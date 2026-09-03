BEGIN;

DROP TABLE IF EXISTS "Admin";

ALTER TABLE "StartupTool"
  ALTER COLUMN "price" TYPE DECIMAL(12,3)
  USING ROUND("price"::numeric, 3);

ALTER TABLE "Order"
  ALTER COLUMN "total" TYPE DECIMAL(12,3)
  USING ROUND("total"::numeric, 3);

ALTER TABLE "OrderItem"
  ALTER COLUMN "price" TYPE DECIMAL(12,3)
  USING ROUND("price"::numeric, 3);

ALTER TABLE "Payment"
  ALTER COLUMN "amount" TYPE DECIMAL(12,3)
  USING ROUND("amount"::numeric, 3);

ALTER TABLE "Website"
  ALTER COLUMN "price" TYPE DECIMAL(12,3)
  USING ROUND("price"::numeric, 3);

CREATE TABLE "RateLimitCounter" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitCounter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimitCounter_key_key" ON "RateLimitCounter"("key");
CREATE INDEX "RateLimitCounter_resetAt_idx" ON "RateLimitCounter"("resetAt");

COMMIT;
