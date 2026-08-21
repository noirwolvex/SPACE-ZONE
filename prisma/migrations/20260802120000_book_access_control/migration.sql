-- AlterTable
ALTER TABLE "Book" ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "price" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PurchasedBook" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'PAYMENT',
    "orderId" TEXT,

    CONSTRAINT "PurchasedBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookOrder" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'TAP',
    "tapChargeId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchasedBook_orderId_key" ON "PurchasedBook"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasedBook_customerId_bookId_key" ON "PurchasedBook"("customerId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "BookOrder_orderNo_key" ON "BookOrder"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "BookOrder_tapChargeId_key" ON "BookOrder"("tapChargeId");

-- CreateIndex
CREATE INDEX "BookOrder_customerId_bookId_idx" ON "BookOrder"("customerId", "bookId");

-- CreateIndex
CREATE INDEX "BookOrder_status_idx" ON "BookOrder"("status");

-- AddForeignKey
ALTER TABLE "PurchasedBook" ADD CONSTRAINT "PurchasedBook_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasedBook" ADD CONSTRAINT "PurchasedBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasedBook" ADD CONSTRAINT "PurchasedBook_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BookOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookOrder" ADD CONSTRAINT "BookOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookOrder" ADD CONSTRAINT "BookOrder_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Align existing data with the new free/paid contract:
-- free books carry no price (spec: isFree true => price null).
UPDATE "Book" SET "price" = NULL WHERE "isFree" = true;

-- Paid books must always have a positive price. Any legacy paid row with a
-- missing/zero price is left for an admin to correct, but is flagged here.
-- (No destructive action taken.)
