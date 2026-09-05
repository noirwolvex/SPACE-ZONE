CREATE TABLE "public"."HomePageContent" (
  "id" TEXT PRIMARY KEY DEFAULT 'default',
  "badge" TEXT NOT NULL,
  "heroTitle" TEXT NOT NULL,
  "heroHighlight" TEXT NOT NULL,
  "heroDescription" TEXT NOT NULL,
  "primaryCtaLabel" TEXT NOT NULL,
  "primaryCtaHref" TEXT NOT NULL,
  "secondaryCtaLabel" TEXT NOT NULL,
  "secondaryCtaHref" TEXT NOT NULL,
  "servicesTitle" TEXT NOT NULL,
  "servicesDescription" TEXT NOT NULL,
  "toolsTitle" TEXT NOT NULL,
  "toolsDescription" TEXT NOT NULL,
  "portfolioTitle" TEXT NOT NULL,
  "portfolioDescription" TEXT NOT NULL,
  "whyTitle" TEXT NOT NULL,
  "whyDescription" TEXT NOT NULL,
  "whyItems" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "finalCtaTitle" TEXT NOT NULL,
  "finalCtaDescription" TEXT NOT NULL,
  "finalCtaLabel" TEXT NOT NULL,
  "finalCtaHref" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "HomePageContent_updatedAt_idx" ON "public"."HomePageContent"("updatedAt");