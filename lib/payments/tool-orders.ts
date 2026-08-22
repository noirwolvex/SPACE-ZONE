import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export function generateToolOrderNo() {
  return `TOOL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const TOOL_CURRENCY = "BHD";

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

  const total = params.items.reduce((sum, item) => sum + Number(item.price) * (item.quantity ?? 1), 0);

  const order = await prisma.order.create({
    data: {
      orderNo: generateToolOrderNo(),
      customerId: params.customerId,
      total,
      status: "PENDING",
      items: {
        create: params.items.map((item) => ({
          toolId: item.toolId,
          price: Number(item.price),
        })),
      },
    },
    include: { items: true },
  });

  await prisma.payment.upsert({
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
          await tx.payment.create({
            data: {
              orderId: order.id,
              amount: Number(order.total),
              status: "PAID",
              tapChargeId: params.tapChargeId ?? null,
            },
          });
        }
        return { ok: true, alreadyPaid: true, paymentId: order.payment?.id ?? order.id };
      }

      const total = Number(order.total);
      const paidCurrency = (params.paidCurrency ?? "").toUpperCase();

      if (params.paidAmount == null) {
        return { ok: false, error: "Payment amount could not be verified.", reason: "REJECTED" };
      }

      if (Number(params.paidAmount) !== total) {
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
      select: { status: true, orderNo: true },
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
