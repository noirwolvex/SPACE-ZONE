CREATE TABLE "public"."AboutPageContent" (
  "id" TEXT PRIMARY KEY DEFAULT 'default',
  "badge" TEXT NOT NULL,
  "heroTitle" TEXT NOT NULL,
  "heroDescription" TEXT NOT NULL,
  "focusLabel" TEXT NOT NULL,
  "focusValue" TEXT NOT NULL,
  "approachLabel" TEXT NOT NULL,
  "approachValue" TEXT NOT NULL,
  "outputLabel" TEXT NOT NULL,
  "outputValue" TEXT NOT NULL,
  "whatWeDoTitle" TEXT NOT NULL,
  "whatWeDoText" TEXT NOT NULL,
  "offerings" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "howWeThinkTitle" TEXT NOT NULL,
  "howWeThinkText" TEXT NOT NULL,
  "values" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "workflowTitle" TEXT NOT NULL,
  "workflow" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "servicesTitle" TEXT NOT NULL,
  "ctaTitle" TEXT NOT NULL,
  "ctaText" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AboutPageContent_updatedAt_idx" ON "public"."AboutPageContent"("updatedAt");