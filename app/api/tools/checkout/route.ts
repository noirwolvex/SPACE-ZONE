import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, createServerSupabaseClient } from "@/lib/supabase";
import { ensureProfileForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPendingToolOrder } from "@/lib/payments/tool-orders";
import { createTapCharge, isTapConfigured } from "@/lib/payments/tap";

export async function POST(request: NextRequest) {
  const authCarrier = NextResponse.next();
  const json = (body: unknown, init?: ResponseInit) =>
    applyAuthCookies(authCarrier, NextResponse.json(body, init));

  const body = await request.json().catch(() => ({}));

  if (!body || typeof body !== "object") {
    return json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];

  if (!items.length) {
    return json({ error: "Cart is empty." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient(request, authCarrier);
  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData.user) {
    return json({ error: "Authentication required to purchase tools." }, { status: 401 });
  }

  const profile = await ensureProfileForUser(userData.user);
  if (!profile) {
    return json({ error: "Unable to resolve your customer profile." }, { status: 403 });
  }

  const normalizedItems = await Promise.all(
    items.map(async (rawItem: any) => {
      const toolId = typeof rawItem?.toolId === "string" ? rawItem.toolId : null;
      const price = Number(rawItem?.price ?? 0);

      if (!toolId || !Number.isFinite(price) || price <= 0) {
        return null;
      }

      const tool = await prisma.startupTool.findUnique({
        where: { id: toolId },
        select: { id: true, price: true },
      });

      if (!tool) {
        return null;
      }

      return {
        toolId: tool.id,
        price: Number(tool.price),
        quantity: 1,
      };
    })
  );

  const validItems = normalizedItems.filter(Boolean) as Array<{ toolId: string; price: number; quantity: number }>;

  if (!validItems.length) {
    return json({ error: "No valid tools were found in your cart." }, { status: 400 });
  }

  const order = await createPendingToolOrder({
    customerId: profile.id,
    items: validItems,
    currency: "BHD",
  });

  if (!isTapConfigured()) {
    return json(
      {
        status: "payment_required",
        code: "PAYMENT_REQUIRED",
        orderId: order.id,
        orderNo: order.orderNo,
        amount: Number(order.total),
        currency: "BHD",
        message: "Online payment is not enabled yet. Your order was saved as pending.",
      },
      { status: 402 }
    );
  }

  const origin = request.nextUrl.origin;
  const charge = await createTapCharge({
    orderNo: order.orderNo,
    amount: Number(order.total),
    currency: "BHD",
    description: "Startup tool purchase",
    customer: { id: profile.id, email: profile.email ?? null, name: profile.name ?? null },
    redirectUrl: `${origin}/cart?status=success&order=${order.orderNo}`,
    postUrl: `${origin}/api/payments/tap/webhook?type=tool`,
  });

  if (!charge.ok) {
    return json(
      {
        status: "payment_required",
        code: "PAYMENT_REQUIRED",
        orderId: order.id,
        orderNo: order.orderNo,
        amount: Number(order.total),
        currency: "BHD",
        error: charge.error,
      },
      { status: 402 }
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { payment: { upsert: { update: { tapChargeId: charge.chargeId, status: "PENDING" }, create: { amount: Number(order.total), status: "PENDING", tapChargeId: charge.chargeId } } } },
  });

  return json({
    ok: true,
    status: "payment_required",
    orderId: order.id,
    orderNo: order.orderNo,
    amount: Number(order.total),
    currency: "BHD",
    paymentUrl: charge.paymentUrl,
  });
}
