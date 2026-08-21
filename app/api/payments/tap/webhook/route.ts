import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fulfilBookOrder, markBookOrderFailed } from "@/lib/payments/book-orders";
import { fulfilToolOrder, markToolOrderFailed } from "@/lib/payments/tool-orders";
import { isTapConfigured, mapTapStatus, verifyTapWebhookSignature, TAP_WEBHOOK_SECRET } from "@/lib/payments/tap";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "book";

  if (!isTapConfigured() || !TAP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Payment provider is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("hashstring") ?? request.headers.get("x-tap-signature");

  if (!verifyTapWebhookSignature(rawBody, signature)) {
    console.warn("Rejected Tap webhook with an invalid signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
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
