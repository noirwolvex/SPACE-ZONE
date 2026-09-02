import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export function generateToolOrderNo() {
  return `TOOL-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

const TOOL_CURRENCY = "BHD";

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function amountsMatch(expected: number, actual: number) {
  return Math.abs(money(expected) - money(actual)) <= 0.001;
}

export async function createPendingToolOrder(params: {
  customerId: string;
  items: Array<{ toolId: string; price: number; quantity?: number }>;
  currency?: string;
}) {
  if (!params.items.length) {
    throw new Error("Tool order requires at least one item.");
  }

  const requestedCurrency = (params.currency ?? TOOL_CURRENCY).toUpperCase();
  if (requestedCurrency !== TOOL_CURRENCY) {
    throw new Error(`Unsupported tool order currency: ${requestedCurrency}`);
  }

  const toolIds = params.items.map((item) => item.toolId);
  if (new Set(toolIds).size !== toolIds.length) {
    throw new Error("A tool can only appear once in an order.");
  }

  const invalidQuantity = params.items.find((item) => (item.quantity ?? 1) !== 1);
  if (invalidQuantity) {
    throw new Error("Tool quantity must be exactly 1.");
  }

  const requestedItems = params.items
    .map((item) => ({
      toolId: item.toolId,
      price: money(Number(item.price)),
    }))
    .sort((a, b) => a.toolId.localeCompare(b.toolId));

  const total = money(params.items.reduce((sum, item) => sum + Number(item.price), 0));

  return prisma.$transaction(async (tx) => {
    // Serialize checkout attempts for the same customer. This closes the
    // find-then-create race that can happen on rapid duplicate clicks.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${params.customerId}))`;

    const pendingOrders = await tx.order.findMany({
      where: { customerId: params.customerId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: { select: { toolId: true, price: true } } },
    });

    for (const pending of pendingOrders) {
      const pendingItems = pending.items
        .map((item) => ({ toolId: item.toolId, price: money(Number(item.price)) }))
        .sort((a, b) => a.toolId.localeCompare(b.toolId));

      if (
        pendingItems.length === requestedItems.length &&
        pendingItems.every(
          (item, index) =>
            item.toolId === requestedItems[index].toolId &&
            amountsMatch(item.price, requestedItems[index].price),
        )
      ) {
        return pending;
      }
    }

    const order = await tx.order.create({
      data: {
        orderNo: generateToolOrderNo(),
        customerId: params.customerId,
        total,
        status: "PENDING",
        items: {
          create: params.items.map((item) => ({
            toolId: item.toolId,
            price: money(Number(item.price)),
          })),
        },
      },
      include: { items: true },
    });

    await tx.payment.upsert({
      where: { orderId: order.id },
      update: { amount: total, status: "PENDING", tapChargeId: null },
      create: {
        orderId: order.id,
        amount: total,
        status: "PENDING",
        tapChargeId: null,
      },
    });

    return order;
  });
}

export type ToolOrderFulfilmentResult =
  | { ok: true; alreadyPaid: boolean; paymentId: string }
  | { ok: false; error: string; reason: "REJECTED" | "TRANSIENT" };

export async function fulfilToolOrder(params: {
  orderId: string;
  tapChargeId?: string | null;
  paidAmount?: number | null;
  paidCurrency?: string | null;
}): Promise<ToolOrderFulfilmentResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: params.orderId },
        include: { payment: true },
      });

      if (!order) {
        return { ok: false, error: "Order not found.", reason: "REJECTED" };
      }

      if (order.status === "PAID") {
        if (!order.payment) {
          const payment = await tx.payment.create({
            data: {
              orderId: order.id,
              amount: money(Number(order.total)),
              status: "PAID",
              tapChargeId: params.tapChargeId ?? null,
            },
          });
          return { ok: true, alreadyPaid: true, paymentId: payment.id };
        }
        return { ok: true, alreadyPaid: true, paymentId: order.payment.id };
      }

      const total = money(Number(order.total));
      const paidCurrency = (params.paidCurrency ?? "").toUpperCase();

      if (params.paidAmount == null || !Number.isFinite(Number(params.paidAmount))) {
        return { ok: false, error: "Payment amount could not be verified.", reason: "REJECTED" };
      }

      if (!amountsMatch(total, Number(params.paidAmount))) {
        return { ok: false, error: "Paid amount does not match the order.", reason: "REJECTED" };
      }

      if (paidCurrency !== TOOL_CURRENCY) {
        return { ok: false, error: "Paid currency does not match the tool order.", reason: "REJECTED" };
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", updatedAt: new Date() },
      });

      const payment = await tx.payment.upsert({
        where: { orderId: order.id },
        update: {
          amount: total,
          status: "PAID",
          tapChargeId: params.tapChargeId ?? order.payment?.tapChargeId ?? null,
        },
        create: {
          orderId: order.id,
          amount: total,
          status: "PAID",
          tapChargeId: params.tapChargeId ?? null,
        },
      });

      return { ok: true, alreadyPaid: false, paymentId: payment.id };
    });
  } catch (error) {
    console.error("Failed to fulfil tool order:", error);
    return { ok: false, error: "Unable to fulfil order.", reason: "TRANSIENT" };
  }
}

export async function markToolOrderFailed(orderId: string, status: "FAILED" | "CANCELLED") {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order) return;

    if (order.status === "PAID" || order.status === "FAILED" || order.status === "CANCELLED") {
      return;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    await prisma.payment.upsert({
      where: { orderId: orderId },
      update: { status },
      create: {
        orderId: orderId,
        amount: 0,
        status,
      },
    });
  } catch (error) {
    console.error("Failed to mark tool order as failed:", error);
  }
}
