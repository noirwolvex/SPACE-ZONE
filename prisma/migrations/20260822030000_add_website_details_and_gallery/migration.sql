ALTER TABLE "public"."Website"
ADD COLUMN "gallery" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "description" TEXT,
ADD COLUMN "system" TEXT,
ADD COLUMN "details" TEXT;
