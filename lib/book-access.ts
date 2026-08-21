import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureProfileForUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { ACCESS_GRANTING_PURCHASE_STATUS, grantsAccess } from "@/lib/payments/order-status";

/**
 * Single source of truth for "may this request read this book's file?".
 *
 * Both /api/books/[id]/access and the legacy /api/books/download/[id] route
 * delegate here so the rule cannot drift between entry points.
 */

export type BookAccessDecision =
  | { status: "granted"; book: BookForAccess; reason: "FREE" | "PURCHASED" | "ADMIN"; customerId: string | null }
  | { status: "not_found" }
  | { status: "unauthenticated"; book: BookForAccess }
  | { status: "payment_required"; book: BookForAccess; customerId: string };

export type BookForAccess = {
  id: string;
  title: string | null;
  filename: string;
  path: string;
  isFree: boolean;
  price: unknown;
  currency: string;
};

const BOOK_ACCESS_SELECT = {
  id: true,
  title: true,
  filename: true,
  path: true,
  isFree: true,
  price: true,
  currency: true,
} as const;

/**
 * Resolve access for a book. Deliberately fails closed: any path that does not
 * explicitly establish entitlement returns a non-granted decision.
 */
export async function resolveBookAccess(
  request: NextRequest,
  response: NextResponse,
  bookId: string
): Promise<BookAccessDecision> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: BOOK_ACCESS_SELECT,
  });

  if (!book) {
    return { status: "not_found" };
  }

  // Free books are readable by anyone, but still only through a signed,
  // short-lived URL or an authorized stream — never a public object URL.
  if (book.isFree) {
    return { status: "granted", book, reason: "FREE", customerId: null };
  }

  const supabase = createServerSupabaseClient(request, response);
  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData.user) {
    return { status: "unauthenticated", book };
  }

  const profile = await ensureProfileForUser(userData.user);
  if (!profile) {
    return { status: "unauthenticated", book };
  }

  // Admins can always read, for support and content verification.
  if (profile.role === "ADMIN") {
    return { status: "granted", book, reason: "ADMIN", customerId: profile.id };
  }

  const purchase = await prisma.purchasedBook.findUnique({
    where: { customerId_bookId: { customerId: profile.id, bookId: book.id } },
    select: { id: true, status: true },
  });

  // Existence is not entitlement: a REFUNDED row is a historical record, not a
  // licence. Only a COMPLETED purchase opens the file.
  if (!purchase || !grantsAccess(purchase.status)) {
    return { status: "payment_required", book, customerId: profile.id };
  }

  return { status: "granted", book, reason: "PURCHASED", customerId: profile.id };
}

/**
 * Bulk ownership lookup used by listing pages so each card can render the
 * correct action without exposing any file location.
 */
export async function getPurchasedBookIds(customerId: string | null | undefined) {
  if (!customerId) return new Set<string>();

  const purchases = await prisma.purchasedBook.findMany({
    where: { customerId, status: ACCESS_GRANTING_PURCHASE_STATUS },
    select: { bookId: true },
  });

  return new Set(purchases.map((purchase) => purchase.bookId));
}

/**
 * Single-book ownership check for the details page.
 *
 * This drives presentation only — every actual file read still goes through
 * resolveBookAccess(), which re-verifies entitlement server-side.
 */
export async function hasPurchasedBook(
  customerId: string | null | undefined,
  bookId: string
): Promise<boolean> {
  if (!customerId) return false;

  const purchase = await prisma.purchasedBook.findUnique({
    where: { customerId_bookId: { customerId, bookId } },
    select: { status: true },
  });

  return grantsAccess(purchase?.status);
}
