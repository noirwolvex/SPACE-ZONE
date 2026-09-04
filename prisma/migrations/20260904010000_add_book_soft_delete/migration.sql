ALTER TABLE "Book" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Book_isDeleted_idx" ON "Book"("isDeleted");
