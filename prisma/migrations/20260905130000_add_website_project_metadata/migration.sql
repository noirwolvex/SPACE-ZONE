ALTER TABLE "Website"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'LIVE',
  ADD COLUMN "techStack" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "launchYear" INTEGER,
  ADD COLUMN "keyFeatures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "Website_status_idx" ON "Website"("status");
CREATE INDEX "Website_featured_idx" ON "Website"("featured");
CREATE INDEX "Website_launchYear_idx" ON "Website"("launchYear");
