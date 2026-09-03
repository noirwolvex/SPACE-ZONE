import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, createServerSupabaseClient } from "@/lib/supabase";
import { ensureProfileForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTapCharge, isTapConfigured } from "@/lib/payments/tap";
import { randomUUID } from "crypto";

function orderReference() {
  return `WEB-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authCarrier = NextResponse.next();
  const json = (body: unknown, init?: ResponseInit) =>
    applyAuthCookies(authCarrier, NextResponse.json(body, init));

  const body = await request.json().catch(() => ({}));
  const websiteId = typeof body?.websiteId === "string" ? body.websiteId.trim() : "";
  if (!websiteId) return json({ error: "Website identifier is required." }, { status: 400 });

  const supabase = createServerSupabaseClient(request, authCarrier);
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) {
    return json({ status: "authentication_required", code: "AUTH_REQUIRED", error: "Authentication required to purchase this website." }, { status: 401 });
  }

  const profile = await ensureProfileForUser(userData.user);
  if (!profile) return json({ error: "Unable to resolve customer profile." }, { status: 403 });

  const website = await prisma.website.findFirst({
    where: { id: websiteId, isPublished: true },
    select: { id: true, title: true, price: true, currency: true, websiteUrl: true },
  });
  if (!website) return json({ error: "Website not found or unavailable." }, { status: 404 });

  const amount = Number(website.price);
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: "This website is not purchasable right now." }, { status: 409 });

  const existing = await prisma.websitePurchase.findUnique({
    where: { customerId_websiteId: { customerId: profile.id, websiteId: website.id } },
    select: { id: true, status: true },
  });

  if (existing?.status === "PAID") {
    return json({ ok: true, status: "owned", alreadyOwned: true, websiteId: website.id });
  }

  const reference = orderReference();
  const purchase = await prisma.websitePurchase.upsert({
    where: { customerId_websiteId: { customerId: profile.id, websiteId: website.id } },
    update: { price: website.price, currency: website.currency, status: "PENDING", transactionId: reference, purchasedAt: null },
    create: { customerId: profile.id, websiteId: website.id, price: website.price, currency: website.currency, status: "PENDING", transactionId: reference },
  });

  if (!isTapConfigured()) {
    return json({ status: "payment_required", code: "PAYMENT_REQUIRED", orderId: purchase.id, orderNo: reference, websiteId: website.id, amount, currency: website.currency, message: "Online payment is not enabled yet. Your purchase was saved as pending." }, { status: 402 });
  }

  const charge = await createTapCharge({
    orderNo: reference,
    amount,
    currency: website.currency,
    description: website.title,
    customer: { id: profile.id, email: profile.email ?? null, name: profile.name ?? null },
    redirectUrl: `${request.nextUrl.origin}/purchased-websites?order=${encodeURIComponent(reference)}`,
    postUrl: `${request.nextUrl.origin}/api/payments/tap/webhook?type=website`,
  });

  if (!charge.ok) {
    return json({ status: "payment_required", code: "PAYMENT_REQUIRED", orderId: purchase.id, orderNo: reference, websiteId: website.id, amount, currency: website.currency, error: charge.error }, { status: 402 });
  }

  await prisma.websitePurchase.update({ where: { id: purchase.id }, data: { transactionId: charge.chargeId } });

  return json({ ok: true, status: "payment_required", orderId: purchase.id, orderNo: reference, websiteId: website.id, amount, currency: website.currency, paymentUrl: charge.paymentUrl });
}
