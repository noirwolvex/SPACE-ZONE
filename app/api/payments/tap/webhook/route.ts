import { NextRequest, NextResponse } from "next/server";
import { fulfilBookOrder, markBookOrderFailed } from "@/lib/payments/book-orders";
import { fulfilToolOrder, markToolOrderFailed } from "@/lib/payments/tool-orders";
import { isTapConfigured, mapTapStatus, verifyTapWebhookSignature } from "@/lib/payments/tap";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function amountsMatch(expected: number, actual: number) {
  return Math.abs(Math.round(expected * 1000) - Math.round(actual * 1000)) <= 1;
}

export async function POST(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "book";

  if (!isTapConfigured()) {
    return NextResponse.json({ error: "Payment provider is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("hashstring") ?? request.headers.get("x-tap-signature");

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!verifyTapWebhookSignature(payload, signature)) {
    console.warn("Rejected Tap webhook with an invalid signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const chargeId = typeof payload.id === "string" ? payload.id : null;
  const status = mapTapStatus(typeof payload.status === "string" ? payload.status : undefined);
  const reference = payload.reference as { order?: string } | undefined;
  const orderNo = typeof reference?.order === "string" ? reference.order : null;
  const paidAmount = typeof payload.amount === "number" ? payload.amount : Number(payload.amount);
  const paidCurrency = typeof payload.currency === "string" ? payload.currency : null;

  if (!chargeId && !orderNo) {
    return NextResponse.json({ error: "Missing charge id and order reference." }, { status: 400 });
  }

  if (type === "website") {
    let purchase = orderNo
      ? await prisma.websitePurchase.findFirst({ where: { transactionId: orderNo } })
      : null;

    if (!purchase && chargeId) {
      purchase = await prisma.websitePurchase.findFirst({ where: { transactionId: chargeId } });
    }

    if (!purchase) {
      console.warn(`Tap website webhook referenced an unknown purchase (orderNo=${orderNo}, chargeId=${chargeId}).`);
      return NextResponse.json({ error: "Website purchase not found." }, { status: 404 });
    }

    if (status !== "PAID") {
      if (status === "FAILED" || status === "CANCELLED") {
        await prisma.websitePurchase.updateMany({
          where: { id: purchase.id, status: { not: "PAID" } },
          data: { status },
        });
      }
      return NextResponse.json({ ok: true, status });
    }

    const expectedAmount = Number(purchase.price);
    const expectedCurrency = purchase.currency.toUpperCase();
    if (!Number.isFinite(paidAmount) || !amountsMatch(expectedAmount, paidAmount)) {
      console.warn(`Rejected website payment with mismatched amount for purchase ${purchase.id}.`);
      return NextResponse.json({ error: "Paid amount does not match the website purchase." }, { status: 422 });
    }
    if ((paidCurrency ?? "").toUpperCase() !== expectedCurrency) {
      console.warn(`Rejected website payment with mismatched currency for purchase ${purchase.id}.`);
      return NextResponse.json({ error: "Paid currency does not match the website purchase." }, { status: 422 });
    }

    const updated = await prisma.websitePurchase.updateMany({
      where: { id: purchase.id, status: { not: "PAID" } },
      data: { status: "PAID", transactionId: chargeId ?? purchase.transactionId, purchasedAt: new Date() },
    });

    return NextResponse.json({ ok: true, status: "PAID", alreadyFulfilled: updated.count === 0, purchaseId: purchase.id });
  }

  if (type === "tool") {
    let order = orderNo ? await prisma.order.findUnique({ where: { orderNo } }) : null;

    if (!order && chargeId) {
      order = await prisma.order.findFirst({ where: { payment: { tapChargeId: chargeId } } });
    }

    if (!order) {
      console.warn(`Tap tool webhook referenced an unknown order (orderNo=${orderNo}, chargeId=${chargeId}).`);
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (status !== "PAID") {
      if (status === "FAILED" || status === "CANCELLED") {
        await markToolOrderFailed(order.id, status);
      }
      return NextResponse.json({ ok: true, status });
    }

    const result = await fulfilToolOrder({
      orderId: order.id,
      tapChargeId: chargeId,
      paidAmount: Number.isFinite(paidAmount) ? paidAmount : null,
      paidCurrency,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.reason === "REJECTED" ? 422 : 500 });
    }

    return NextResponse.json({ ok: true, status: "PAID", alreadyFulfilled: result.alreadyPaid, orderNo: order.orderNo });
  }

  let order = orderNo ? await prisma.bookOrder.findUnique({ where: { orderNo } }) : null;

  if (!order && chargeId) {
    order = await prisma.bookOrder.findUnique({ where: { tapChargeId: chargeId } });
  }

  if (!order) {
    console.warn(`Tap webhook referenced an unknown order (orderNo=${orderNo}, chargeId=${chargeId}).`);
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (status !== "PAID") {
    if (status === "FAILED" || status === "CANCELLED") {
      await markBookOrderFailed(order.id, status);
    }
    return NextResponse.json({ ok: true, status });
  }

  const result = await fulfilBookOrder({
    orderId: order.id,
    tapChargeId: chargeId,
    paidAmount: Number.isFinite(paidAmount) ? paidAmount : null,
    paidCurrency,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.reason === "REJECTED" ? 422 : 500 });
  }

  return NextResponse.json({
    ok: true,
    status: "PAID",
    alreadyFulfilled: result.alreadyFulfilled,
    orderNo: order.orderNo,
  });
}
