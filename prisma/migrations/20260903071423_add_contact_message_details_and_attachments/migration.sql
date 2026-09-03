ALTER TABLE "ContactMessage"
  ADD COLUMN "contactType" TEXT NOT NULL DEFAULT 'Inquiry',
  ADD COLUMN "details" TEXT,
  ADD COLUMN "attachmentUrl" TEXT,
  ADD COLUMN "attachmentName" TEXT;
