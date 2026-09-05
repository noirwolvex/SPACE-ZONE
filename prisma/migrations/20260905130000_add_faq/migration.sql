CREATE TABLE IF NOT EXISTS "FAQ" (
  "id" TEXT NOT NULL DEFAULT (gen_random_uuid()::text),
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "category" TEXT,
  "page" TEXT NOT NULL DEFAULT '/',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FAQ_page_sortOrder_idx" ON "FAQ"("page", "sortOrder");
CREATE INDEX IF NOT EXISTS "FAQ_isPublished_idx" ON "FAQ"("isPublished");
