import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { amountsMatch, grantsAccess, isTerminalOrderStatus } from "@/lib/payments/order-status";

/**
 * Book order lifecycle.
 *
 * Ownership (PurchasedBook) is created here and nowhere else, and only from a
 * confirmed-paid order. User-facing routes can create orders but can never
 * grant access.
 */

export function generateOrderNo() {
  return `BK-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/**
 * Create (or reuse) a pending order for a paid book.
 * Reuses an existing PENDING order so repeated Buy clicks don't pile up rows.
 *
 * Two concurrent Buy clicks both miss the initial lookup and both attempt an
 * insert; the partial unique index on (customerId, bookId) WHERE status='PENDING'
 * lets exactly one win. The loser reads back the winner's row instead of
 * surfacing a unique-violation as a 500.
 */
export async function createPendingBookOrder(params: {
  customerId: string;
  bookId: string;
  amount: number;
  currency: string;
}) {
  const findPending = () =>
    prisma.bookOrder.findFirst({
      where: { customerId: params.customerId, bookId: params.bookId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

  const existing = await findPending();
  if (existing) return existing;

  try {
    return await prisma.bookOrder.create({
      data: {
        orderNo: generateOrderNo(),
        customerId: params.customerId,
        bookId: params.bookId,
        amount: params.amount,
        currency: params.currency,
        status: "PENDING",
        provider: "TAP",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winner = await findPending();
      if (winner) return winner;
    }
    throw error;
  }
}

export type FulfilmentResult =
  | { ok: true; alreadyFulfilled: boolean; purchaseId: string }
  /**
   * `reason` tells the caller whether retrying could ever help:
   *   REJECTED  — the charge does not legitimately pay this order. Permanent.
   *   TRANSIENT — something failed on our side. The provider should retry.
   */
  | { ok: false; error: string; reason: "REJECTED" | "TRANSIENT" };

/**
 * Mark an order paid and grant ownership, atomically and idempotently.
 *
 * Safe to call repeatedly with the same charge: the unique constraint on
 * (customerId, bookId) makes a duplicate grant a no-op rather than an error,
 * which matters because payment providers retry webhooks.
 *
 * `paidAmount` / `paidCurrency` are what the provider says it actually captured.
 * They are checked against the order inside the transaction, so a charge for the
 * wrong amount cannot unlock a more expensive book.
 */
export async function fulfilBookOrder(params: {
  orderId: string;
  tapChargeId?: string | null;
  paidAmount?: number | null;
  paidCurrency?: string | null;
}): Promise<FulfilmentResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.bookOrder.findUnique({
        where: { id: params.orderId },
        include: { purchase: true },
      });

      if (!order) {
        return { ok: false as const, error: "Order not found.", reason: "REJECTED" as const };
      }

      // Already fulfilled by an earlier delivery of this webhook.
      if (order.purchase) {
        return { ok: true as const, alreadyFulfilled: true, purchaseId: order.purchase.id };
      }

      /* --- Charge must match the order it claims to pay for ----------------
       * Checked before anything is written. A provider that reports neither
       * amount nor currency is not trusted to settle the order silently.
       */
      const expectedAmount = Number(order.amount);

      if (params.paidAmount == null || params.paidCurrency == null) {
        console.error(
          `Refusing to fulfil order ${order.orderNo}: provider reported no amount/currency to verify.`
        );
        return {
          ok: false as const,
          error: "Payment amount could not be verified.",
          reason: "REJECTED" as const,
        };
      }

      if (!amountsMatch(params.paidAmount, expectedAmount)) {
        console.error(
          `Refusing to fulfil order ${order.orderNo}: paid ${params.paidAmount} but order is ${expectedAmount}.`
        );
        return {
          ok: false as const,
          error: "Paid amount does not match the order.",
          reason: "REJECTED" as const,
        };
      }

      if (params.paidCurrency.toUpperCase() !== order.currency.toUpperCase()) {
        console.error(
          `Refusing to fulfil order ${order.orderNo}: paid in ${params.paidCurrency} but order is ${order.currency}.`
        );
        return {
          ok: false as const,
          error: "Paid currency does not match the order.",
          reason: "REJECTED" as const,
        };
      }

      // A late capture on an order we had already given up on is still money
      // received — honour it, but make the anomaly visible in the logs.
      if (order.status === "FAILED" || order.status === "CANCELLED") {
        console.warn(`Order ${order.orderNo} was ${order.status} and is being promoted to PAID by a late capture.`);
      }

      const chargeId = params.tapChargeId ?? order.tapChargeId;

      await tx.bookOrder.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          tapChargeId: chargeId,
        },
      });

      // The user may already have a row for this book, either from a different
      // order or from an earlier purchase that was refunded. (customerId, bookId)
      // is unique, so a re-purchase reactivates the existing row rather than
      // inserting a second one.
      const existingPurchase = await tx.purchasedBook.findUnique({
        where: { customerId_bookId: { customerId: order.customerId, bookId: order.bookId } },
        select: { id: true, status: true },
      });

      if (existingPurchase) {
        if (grantsAccess(existingPurchase.status)) {
          return { ok: true as const, alreadyFulfilled: true, purchaseId: existingPurchase.id };
        }

        await tx.purchasedBook.update({
          where: { id: existingPurchase.id },
          data: {
            status: "COMPLETED",
            source: "PAYMENT",
            price: order.amount,
            currency: order.currency,
            transactionId: chargeId,
            // Safe: we already established this order has no purchase attached,
            // and orderId is unique across purchases.
            orderId: order.id,
            purchasedAt: new Date(),
          },
        });

        return { ok: true as const, alreadyFulfilled: false, purchaseId: existingPurchase.id };
      }

      const purchase = await tx.purchasedBook.create({
        data: {
          customerId: order.customerId,
          bookId: order.bookId,
          price: order.amount,
          currency: order.currency,
          source: "PAYMENT",
          status: "COMPLETED",
          // Denormalized so a purchase row is auditable without its order.
          transactionId: chargeId,
          orderId: order.id,
        },
      });

      return { ok: true as const, alreadyFulfilled: false, purchaseId: purchase.id };
    });
  } catch (error) {
    console.error("Failed to fulfil book order:", error);
    return { ok: false, error: "Unable to fulfil order.", reason: "TRANSIENT" };
  }
}

/**
 * Record a failed or cancelled payment.
 *
 * Refuses to touch an order that has already settled: providers retry and
 * reorder webhook deliveries, and a late FAILED must never overwrite a PAID
 * order that already has ownership hanging off it.
 */
export async function markBookOrderFailed(orderId: string, status: "FAILED" | "CANCELLED") {
  try {
    const order = await prisma.bookOrder.findUnique({
      where: { id: orderId },
      select: { status: true, orderNo: true },
    });

    if (!order) return;

    if (isTerminalOrderStatus(order.status)) {
      if (order.status !== status) {
        console.warn(
          `Ignoring ${status} webhook for order ${order.orderNo}: already settled as ${order.status}.`
        );
      }
      return;
    }

    await prisma.bookOrder.update({ where: { id: orderId }, data: { status } });
  } catch (error) {
    console.error("Failed to mark book order as failed:", error);
  }
}
