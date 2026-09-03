ALTER TABLE "Service" ADD COLUMN "summary" TEXT;
UPDATE "Service" SET "summary" = "description" WHERE "summary" IS NULL;
UPDATE "Service" SET "description" = CASE "slug"
  WHEN 'web-app-development' THEN 'We design and build fast, maintainable web apps, dashboards, and customer-facing products using modern frameworks. The work covers product planning, UI implementation, backend integration, performance, deployment, and the kind of polish that makes a digital product feel dependable from day one.'
  WHEN 'seo-digital-marketing' THEN 'We improve how people discover your brand through technical SEO, content planning, search intent research, campaign setup, and practical reporting. The goal is not just more traffic; it is better-qualified attention that can turn into leads, signups, and sales.'
  WHEN 'brand-identity' THEN 'We shape the visual and verbal foundation of your brand so every touchpoint feels consistent. This can include logo direction, color systems, typography, social templates, brand guidelines, and core messaging that gives your team a clear creative lane.'
  WHEN 'designing-store-banners' THEN 'We create polished store banners that help shoppers understand your offer quickly. Each banner is designed around the campaign goal, product category, brand style, and the placement where it will appear, from homepage hero banners to collection promos and sale announcements.'
  ELSE "description"
END;
ALTER TABLE "Service" ALTER COLUMN "summary" SET NOT NULL;

CREATE TABLE "WebsitePurchase" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "websiteId" TEXT NOT NULL,
  "price" DECIMAL(12,3) NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "transactionId" TEXT,
  "purchasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebsitePurchase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WebsitePurchase_customerId_websiteId_key" ON "WebsitePurchase"("customerId","websiteId");
CREATE INDEX "WebsitePurchase_customerId_status_idx" ON "WebsitePurchase"("customerId","status");
CREATE INDEX "WebsitePurchase_websiteId_idx" ON "WebsitePurchase"("websiteId");
CREATE INDEX "WebsitePurchase_transactionId_idx" ON "WebsitePurchase"("transactionId");
ALTER TABLE "WebsitePurchase" ADD CONSTRAINT "WebsitePurchase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WebsitePurchase" ADD CONSTRAINT "WebsitePurchase_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
