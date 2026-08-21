/**
 * Status vocabularies for the book purchase pipeline.
 *
 * These are stored as TEXT columns with matching CHECK constraints (see
 * migration 20260803150000_book_purchase_integrity), so an invalid status is
 * rejected by the database as well as by TypeScript.
 */

export const BOOK_ORDER_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED"] as const;
export type BookOrderStatus = (typeof BOOK_ORDER_STATUSES)[number];

/** Statuses that can no longer change. A late webhook must never reopen these. */
export const TERMINAL_ORDER_STATUSES = ["PAID", "FAILED", "CANCELLED"] as const satisfies readonly BookOrderStatus[];

export const PURCHASE_STATUSES = ["COMPLETED", "REFUNDED"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

/**
 * The only purchase status that grants file access.
 *
 * Exported as a constant so database queries filter on the same value that
 * grantsAccess() tests in memory — the two cannot drift apart.
 */
export const ACCESS_GRANTING_PURCHASE_STATUS = "COMPLETED" satisfies PurchaseStatus;

/** How ownership was granted. */
export const PURCHASE_SOURCES = ["PAYMENT", "ADMIN_GRANT"] as const;
export type PurchaseSource = (typeof PURCHASE_SOURCES)[number];

export function isBookOrderStatus(value: unknown): value is BookOrderStatus {
  return typeof value === "string" && (BOOK_ORDER_STATUSES as readonly string[]).includes(value);
}

export function isTerminalOrderStatus(value: unknown): boolean {
  return typeof value === "string" && (TERMINAL_ORDER_STATUSES as readonly string[]).includes(value);
}

/** Only a COMPLETED purchase grants file access; refunds revoke it. */
export function grantsAccess(status: string | null | undefined): boolean {
  return status === ACCESS_GRANTING_PURCHASE_STATUS;
}

/**
 * Money comparison for provider callbacks.
 *
 * Amounts round-trip through JSON and Prisma Decimal, so an exact === on floats
 * is unreliable. Currencies here carry at most 3 decimals (BHD), and a tolerance
 * of half a fils is far tighter than any legitimate rounding difference.
 */
export function amountsMatch(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) < 0.0005;
}
