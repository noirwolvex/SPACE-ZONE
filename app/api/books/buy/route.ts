import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, createServerSupabaseClient } from "@/lib/supabase";
import { ensureProfileForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPendingBookOrder } from "@/lib/payments/book-orders";
import { createTapCharge, isTapConfigured } from "@/lib/payments/tap";
import { grantsAccess } from "@/lib/payments/order-status";

/**
 * Start a purchase.
 *
 * This route NEVER grants access. It records a PENDING BookOrder and returns
 * either a payment URL (once Tap is configured) or 402 payment_required.
 * Ownership is created only by the Tap webhook after a confirmed payment.
 */
export async function POST(request: NextRequest) {
  // Scratch response Supabase writes refreshed auth cookies onto; every return
  // below funnels through json() so those cookies reach the client.
  const authCarrier = NextResponse.next();
  const json = (body: unknown, init?: ResponseInit) =>
    applyAuthCookies(authCarrier, NextResponse.json(body, init));

  const body = await request.json().catch(() => ({}));
  const bookId = typeof body?.bookId === "string" ? body.bookId : null;

  if (!bookId) {
    return json({ error: "Book identifier is required." }, { status: 400 });
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, title: true, isFree: true, price: true, currency: true },
  });

  if (!book) {
    return json({ error: "Book not found." }, { status: 404 });
  }

  if (book.isFree) {
    return json({ ok: true, status: "free", free: true, message: "This book is free and immediately available." });
  }

  const supabase = createServerSupabaseClient(request, authCarrier);
  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData.user) {
    return json(
      {
        status: "authentication_required",
        code: "AUTH_REQUIRED",
        error: "Authentication required to purchase this book.",
      },
      { status: 401 }
    );
  }

  const profile = await ensureProfileForUser(userData.user);
  if (!profile) {
    return json({ error: "Unable to resolve customer profile." }, { status: 403 });
  }

  // Already owned: nothing to pay for. A REFUNDED row is not ownership, so it
  // deliberately falls through and lets the user buy the book again.
  const existingPurchase = await prisma.purchasedBook.findUnique({
    where: { customerId_bookId: { customerId: profile.id, bookId: book.id } },
    select: { id: true, status: true },
  });

  if (existingPurchase && grantsAccess(existingPurchase.status)) {
    return json({ ok: true, status: "owned", alreadyOwned: true, message: "You already own this book." });
  }

  const amount = book.price != null ? Number(book.price) : 0;
  if (!Number.isFinite(amount) || amount <= 0) {
    console.error(`Paid book ${book.id} has an invalid price: ${String(book.price)}`);
    return json({ error: "This book is not purchasable right now." }, { status: 409 });
  }

  const order = await createPendingBookOrder({
    customerId: profile.id,
    bookId: book.id,
    amount,
    currency: book.currency,
  });

  // Payment provider not connected yet: the order stays PENDING and access
  // remains locked. No PurchasedBook record is created here, ever.
  if (!isTapConfigured()) {
    return json(
      {
        status: "payment_required",
        code: "PAYMENT_REQUIRED",
        orderId: order.id,
        orderNo: order.orderNo,
        bookId: book.id,
        amount,
        currency: book.currency,
        message: "Online payment is not enabled yet. Your order was saved as pending.",
      },
      { status: 402 }
    );
  }

  const origin = request.nextUrl.origin;
  const charge = await createTapCharge({
    orderNo: order.orderNo,
    amount,
    currency: book.currency,
    description: book.title ?? "Book purchase",
    customer: { id: profile.id, email: profile.email ?? null, name: profile.name ?? null },
    redirectUrl: `${origin}/purchased-books?order=${order.orderNo}`,
    postUrl: `${origin}/api/payments/tap/webhook`,
  });

  if (!charge.ok) {
    return json(
      {
        status: "payment_required",
        code: "PAYMENT_REQUIRED",
        orderId: order.id,
        orderNo: order.orderNo,
        bookId: book.id,
        amount,
        currency: book.currency,
        error: charge.error,
      },
      { status: 402 }
    );
  }

  await prisma.bookOrder.update({
    where: { id: order.id },
    data: { tapChargeId: charge.chargeId },
  });

  return json({
    ok: true,
    status: "payment_required",
    orderId: order.id,
    orderNo: order.orderNo,
    bookId: book.id,
    amount,
    currency: book.currency,
    paymentUrl: charge.paymentUrl,
  });
}
