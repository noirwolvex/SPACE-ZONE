CREATE TABLE "ServiceMedia" (
  "serviceId" TEXT NOT NULL,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ServiceMedia_pkey" PRIMARY KEY ("serviceId"),
  CONSTRAINT "ServiceMedia_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
