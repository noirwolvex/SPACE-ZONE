CREATE TABLE IF NOT EXISTS "Testimonial" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "company" TEXT,
  "avatarUrl" TEXT,
  "content" TEXT NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5 CHECK ("rating" BETWEEN 1 AND 5),
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Testimonial_published_createdAt_idx"
  ON "Testimonial" ("isPublished", "createdAt" DESC);
