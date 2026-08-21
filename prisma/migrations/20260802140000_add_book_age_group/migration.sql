-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "ageGroup" TEXT;

-- CreateIndex
CREATE INDEX "Book_category_idx" ON "Book"("category");

-- CreateIndex
CREATE INDEX "Book_ageGroup_idx" ON "Book"("ageGroup");

-- CreateIndex
CREATE INDEX "Book_isFree_idx" ON "Book"("isFree");

-- CreateIndex
CREATE INDEX "Book_uploadedAt_idx" ON "Book"("uploadedAt");

-- Backfill ageGroup from the existing free-text targetAge column.
-- Reads the first number in the label and maps it to a bucket. Values that
-- cannot be parsed are simply left NULL (unclassified) — nothing is lost,
-- and targetAge itself is never modified.
UPDATE "Book"
SET "ageGroup" = CASE
  WHEN "targetAge" IS NULL OR btrim("targetAge") = '' THEN NULL
  WHEN lower("targetAge") LIKE '%all age%' THEN 'ALL_AGES'
  WHEN lower("targetAge") LIKE '%adult%' THEN 'ADULTS'
  WHEN substring("targetAge" from '[0-9]+') IS NULL THEN NULL
  WHEN (substring("targetAge" from '[0-9]+'))::int < 6 THEN 'UNDER_6'
  WHEN (substring("targetAge" from '[0-9]+'))::int <= 10 THEN 'AGE_6_10'
  WHEN (substring("targetAge" from '[0-9]+'))::int <= 15 THEN 'AGE_11_15'
  WHEN (substring("targetAge" from '[0-9]+'))::int <= 18 THEN 'AGE_16_18'
  ELSE 'ADULTS'
END
WHERE "ageGroup" IS NULL;
