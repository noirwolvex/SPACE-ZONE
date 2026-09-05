CREATE TABLE "public"."WebsiteVideo" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "websiteId" TEXT NOT NULL UNIQUE,
  "videoPath" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebsiteVideo_websiteId_fkey"
    FOREIGN KEY ("websiteId") REFERENCES "public"."Website"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "WebsiteVideo_websiteId_idx" ON "public"."WebsiteVideo"("websiteId");
