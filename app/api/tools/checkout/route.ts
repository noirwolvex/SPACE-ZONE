import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, createServerSupabaseClient } from "@/lib/supabase";
import { ensureProfileForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPendingToolOrder } from "@/lib/payments/tool-orders";
import { createTapCharge, isTapConfigured } from "@/lib/payments/tap";

const MAX_ITEMS_PER_CHECKOUT = 20;

type CheckoutItem = { toolId?: unknown; slug?: unknown };

export async function POST(request: NextRequest) {
  const authCarrier = NextResponse.next();
  const json = (body: unknown, init?: ResponseInit) =>
    applyAuthCookies(authCarrier, NextResponse.json(body, init));

  const body = await request.json().catch(() => ({}));

  if (!body || typeof body !== "object") return json({ error: "Invalid checkout payload." }, { status: 400 });
  const items: unknown[] = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return json({ error: "Cart is empty." }, { status: 400 });
  if (items.length > MAX_ITEMS_PER_CHECKOUT) return json({ error: `You can purchase up to ${MAX_ITEMS_PER_CHECKOUT} tools at once.` }, { status: 400 });

  const supabase = createServerSupabaseClient(request, authCarrier);
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) return json({ error: "Authentication required to purchase tools." }, { status: 401 });

  const profile = await ensureProfileForUser(userData.user);
  if (!profile) return json({ error: "Unable to resolve your profile." }, { status: 403 });

  const getToolSelector = (rawItem: unknown): string | null => {
    if (!rawItem || typeof rawItem !== "object") return null;
    const item = rawItem as CheckoutItem;
    const toolId = typeof item.toolId === "string" ? item.toolId.trim() : "";
    if (toolId) return toolId;
    const slug = typeof item.slug === "string" ? item.slug.trim() : "";
    return slug || null;
  };

  const selectors = items.map(getToolSelector);
  const validSelectors = selectors.filter((value): value is string => value !== null);
  if (validSelectors.length !== items.length) return json({ error: "Each checkout item must include a valid tool id or slug." }, { status: 400 });
  if (new Set(validSelectors).size !== validSelectors.length) return json({ error: "A tool can only be included once per checkout." }, { status: 400 });

  const tools = await prisma.startupTool.findMany({
    where: { OR: [{ id: { in: validSelectors } }, { slug: { in: validSelectors } }] },
    select: { id: true, slug: true, price: true },
  });

  const bySelector = new Map<string, (typeof tools)[number]>();
  for (const tool of tools) {
    bySelector.set(tool.id, tool);
    bySelector.set(tool.slug, tool);
  }

  const normalizedItems = selectors.map((selector) => {
    const tool = selector ? bySelector.get(selector) : null;
    if (!tool || !Number.isFinite(Number(tool.price)) || Number(tool.price) <= 0) return null;
    return { toolId: tool.id, price: Number(tool.price), quantity: 1 };
  });
  const validItems = normalizedItems.filter(Boolean) as Array<{ toolId: string; price: number; quantity: number }>;
  if (validItems.length !== items.length) return json({ error: "One or more selected tools are no longer available." }, { status: 400 });

  const order = await createPendingToolOrder({ customerId: profile.id, items: validItems, currency: "BHD" });

  if (!isTapConfigured()) {
    return json({ status: "payment_required", code: "PAYMENT_REQUIRED", orderId: order.id, orderNo: order.orderNo, amount: Number(order.total), currency: "BHD", message: "Online payment is not enabled yet. Your order was saved as pending." }, { status: 402 });
  }

  const origin = request.nextUrl.origin;
  const charge = await createTapCharge({
    orderNo: order.orderNo,
    amount: Number(order.total),
    currency: "BHD",
    description: "Startup tool purchase",
    customer: { id: profile.id, email: profile.email ?? null, name: profile.name ?? null },
    redirectUrl: `${origin}/purchased-tools?status=success&order=${encodeURIComponent(order.orderNo)}`,
    postUrl: `${origin}/api/payments/tap/webhook?type=tool`,
  });

  if (!charge.ok) return json({ status: "payment_required", code: "PAYMENT_REQUIRED", orderId: order.id, orderNo: order.orderNo, amount: Number(order.total), currency: "BHD", error: charge.error }, { status: 402 });

  await prisma.payment.upsert({ where: { orderId: order.id }, update: { tapChargeId: charge.chargeId, status: "PENDING", amount: Number(order.total) }, create: { orderId: order.id, tapChargeId: charge.chargeId, status: "PENDING", amount: Number(order.total) } });

  return json({ ok: true, status: "payment_required", orderId: order.id, orderNo: order.orderNo, amount: Number(order.total), currency: "BHD", paymentUrl: charge.paymentUrl });
}
