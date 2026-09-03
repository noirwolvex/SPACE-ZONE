BEGIN;

CREATE INDEX IF NOT EXISTS "StartupTool_categoryId_idx" ON "StartupTool"("categoryId");
CREATE INDEX IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_toolId_idx" ON "OrderItem"("toolId");
CREATE INDEX IF NOT EXISTS "Download_orderItemId_idx" ON "Download"("orderItemId");
CREATE INDEX IF NOT EXISTS "PurchasedBook_bookId_idx" ON "PurchasedBook"("bookId");
CREATE INDEX IF NOT EXISTS "BookOrder_bookId_idx" ON "BookOrder"("bookId");

DROP INDEX IF EXISTS "RateLimitCounter_resetAt_idx";

COMMIT;
