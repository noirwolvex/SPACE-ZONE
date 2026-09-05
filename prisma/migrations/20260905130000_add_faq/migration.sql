CREATE TABLE IF NOT EXISTS "FAQ" (
  "id" TEXT NOT NULL DEFAULT (gen_random_uuid()::text),
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "category" TEXT,
  "page" TEXT NOT NULL DEFAULT '/',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FAQ_page_sortOrder_idx" ON "FAQ"("page", "sortOrder");
CREATE INDEX IF NOT EXISTS "FAQ_isPublished_idx" ON "FAQ"("isPublished");

INSERT INTO "FAQ" ("question","answer","category","page","sortOrder","isPublished")
SELECT * FROM (VALUES
  ('What services does SpaceZone provide?', 'SpaceZone combines strategy, design, development, websites, startup tools, and practical digital delivery for brands, startups, and businesses.', 'General', '/', 10, true),
  ('How do I start a project?', 'Send us your idea, goal, website, campaign, or product through the contact page. We can shape the scope and next steps from there.', 'Projects', '/', 20, true),
  ('Can you build a custom website?', 'Yes. Custom websites and digital experiences can be planned around your brand, audience, content, and business goals.', 'Websites', '/', 30, true),
  ('Do you offer ready-made digital tools?', 'Yes. The Startup Tools marketplace provides practical digital resources that can be purchased and used by your team.', 'Startup Tools', '/', 40, true),
  ('Can I request a quote before starting?', 'Yes. Contact us with the scope and requirements and we can discuss the appropriate service or project approach.', 'Pricing', '/', 50, true),
  ('Can you work with an existing brand or website?', 'Yes. We can improve existing websites, visual systems, campaigns, and digital assets instead of requiring a complete rebuild.', 'Support', '/', 60, true)
) AS seed("question","answer","category","page","sortOrder","isPublished")
WHERE NOT EXISTS (SELECT 1 FROM "FAQ");
