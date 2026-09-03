CREATE TABLE "StartupToolFile" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StartupToolFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StartupToolFile_path_key" ON "StartupToolFile"("path");
CREATE INDEX "StartupToolFile_toolId_sortOrder_idx" ON "StartupToolFile"("toolId", "sortOrder");

ALTER TABLE "Download" ADD COLUMN "fileId" TEXT;
CREATE INDEX "Download_fileId_idx" ON "Download"("fileId");

ALTER TABLE "StartupToolFile" ADD CONSTRAINT "StartupToolFile_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "StartupTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Download" ADD CONSTRAINT "Download_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StartupToolFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO storage.buckets (id, name, public)
VALUES ('tool2', 'tool2', false)
ON CONFLICT (id) DO UPDATE SET public = false;