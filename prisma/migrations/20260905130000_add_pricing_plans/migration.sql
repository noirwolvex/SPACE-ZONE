CREATE TABLE IF NOT EXISTS "PricingPlan" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" NUMERIC(12, 3) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'BHD',
  "features" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "ctaLabel" TEXT NOT NULL DEFAULT 'Get started',
  "ctaHref" TEXT NOT NULL DEFAULT '/contact',
  "isPopular" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PricingPlan_slug_key" ON "PricingPlan"("slug");
CREATE INDEX IF NOT EXISTS "PricingPlan_published_order_idx" ON "PricingPlan"("isPublished", "sortOrder");
