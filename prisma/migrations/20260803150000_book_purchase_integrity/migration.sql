-- Purchase auditing: link ownership to the payment that produced it, and give
-- a purchase its own lifecycle state (so refunds can revoke access later).
ALTER TABLE "public"."PurchasedBook" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "public"."PurchasedBook" ADD COLUMN     "transactionId" TEXT;

-- CreateIndex
CREATE INDEX "PurchasedBook_customerId_status_idx" ON "public"."PurchasedBook"("customerId", "status");

-- CreateIndex
CREATE INDEX "PurchasedBook_transactionId_idx" ON "public"."PurchasedBook"("transactionId");

-- Backfill the charge id from the order that paid for each existing purchase.
UPDATE "public"."PurchasedBook" p
SET "transactionId" = o."tapChargeId"
FROM "public"."BookOrder" o
WHERE p."orderId" = o."id"
  AND p."transactionId" IS NULL
  AND o."tapChargeId" IS NOT NULL;

-- Collapse any pre-existing duplicate PENDING orders down to the newest one, so
-- the partial unique index below can be created without data loss. Nothing is
-- deleted: superseded orders are simply marked CANCELLED.
UPDATE "public"."BookOrder" o
SET "status" = 'CANCELLED'
WHERE o."status" = 'PENDING'
  AND o."id" <> (
    SELECT o2."id"
    FROM "public"."BookOrder" o2
    WHERE o2."customerId" = o."customerId"
      AND o2."bookId" = o."bookId"
      AND o2."status" = 'PENDING'
    ORDER BY o2."createdAt" DESC, o2."id" DESC
    LIMIT 1
  );

-- CreateIndex
-- At most one OPEN order per customer per book. Settled orders (PAID/FAILED/
-- CANCELLED) are deliberately unconstrained so history is preserved.
CREATE UNIQUE INDEX "BookOrder_pending_customer_book_key"
  ON "public"."BookOrder"("customerId", "bookId")
  WHERE ("status" = 'PENDING');

-- Status vocabularies enforced by the database, not just by application code.
ALTER TABLE "public"."BookOrder"
  ADD CONSTRAINT "BookOrder_status_check"
  CHECK ("status" IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED'));

ALTER TABLE "public"."PurchasedBook"
  ADD CONSTRAINT "PurchasedBook_status_check"
  CHECK ("status" IN ('COMPLETED', 'REFUNDED'));

ALTER TABLE "public"."PurchasedBook"
  ADD CONSTRAINT "PurchasedBook_source_check"
  CHECK ("source" IN ('PAYMENT', 'ADMIN_GRANT'));
