ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "challenge" TEXT;
ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "solution" TEXT;
ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "process" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "techStack" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "duration" TEXT;
CREATE INDEX IF NOT EXISTS "PortfolioProject_industry_idx" ON "PortfolioProject" ("industry");
