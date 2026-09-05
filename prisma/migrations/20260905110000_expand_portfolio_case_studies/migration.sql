ALTER TABLE "PortfolioProject"
  ADD COLUMN "challenge" TEXT,
  ADD COLUMN "solution" TEXT,
  ADD COLUMN "process" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "techStack" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "industry" TEXT,
  ADD COLUMN "duration" TEXT;

CREATE INDEX "PortfolioProject_industry_idx" ON "PortfolioProject"("industry");
