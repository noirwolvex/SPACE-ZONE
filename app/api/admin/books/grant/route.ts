import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/**
 * Manually grant a user access to a paid book.
 *
 * Exists so ownership can be issued before Tap is connected (comps, support,
 * refund fixes). Grants are recorded with source = ADMIN_GRANT so they stay
 * distinguishable from real payments.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const body = await request.json().catch(() => ({}));
  const bookId = typeof body?.bookId === "string" ? body.bookId : null;
  const email = typeof body?.email === "string" ? body.email.trim() : null;

  if (!bookId || !email) {
    return NextResponse.json({ error: "bookId and email are required." }, { status: 400 });
  }

  const [book, customer] = await Promise.all([
    prisma.book.findUnique({ where: { id: bookId }, select: { id: true, price: true, currency: true, isFree: true } }),
    prisma.customer.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } }),
  ]);

  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  if (book.isFree) {
    return NextResponse.json({ ok: true, message: "Book is free; no grant needed." });
  }

  const existing = await prisma.purchasedBook.findUnique({
    where: { customerId_bookId: { customerId: customer.id, bookId: book.id } },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ ok: true, alreadyOwned: true, purchaseId: existing.id });
  }

  const purchase = await prisma.purchasedBook.create({
    data: {
      customerId: customer.id,
      bookId: book.id,
      price: book.price ?? 0,
      currency: book.currency,
      source: "ADMIN_GRANT",
    },
  });

  return NextResponse.json({ ok: true, purchaseId: purchase.id });
}
