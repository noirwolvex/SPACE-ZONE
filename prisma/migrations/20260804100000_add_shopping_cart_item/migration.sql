-- CreateTable ShoppingCartItem
CREATE TABLE "public"."ShoppingCartItem" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'TOOL',
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priceLabel" TEXT NOT NULL,
    "thumbnail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingCartItem_customerId_kind_slug_key" ON "public"."ShoppingCartItem"("customerId", "kind", "slug");

-- CreateIndex
CREATE INDEX "ShoppingCartItem_customerId_idx" ON "public"."ShoppingCartItem"("customerId");

-- AddForeignKey
ALTER TABLE "public"."ShoppingCartItem" ADD CONSTRAINT "ShoppingCartItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
