-- CreateTable
CREATE TABLE "public"."BookImage" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookImage_bookId_sortOrder_idx" ON "public"."BookImage"("bookId", "sortOrder");

-- AddForeignKey
-- Cascade so removing a book cannot leave orphaned gallery rows behind. The
-- storage objects themselves are deleted explicitly by the admin delete route.
ALTER TABLE "public"."BookImage"
    ADD CONSTRAINT "BookImage_bookId_fkey" FOREIGN KEY ("bookId")
    REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
