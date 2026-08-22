ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "outcome" TEXT;
ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "metrics" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "gradient" TEXT NOT NULL DEFAULT 'from-indigo-100 via-white to-sky-100';
