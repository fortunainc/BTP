CREATE TABLE IF NOT EXISTS "CompanyInquiry" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "website" TEXT NOT NULL,
  "product" TEXT NOT NULL,
  "goals" TEXT NOT NULL,
  "access" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "source" TEXT NOT NULL DEFAULT 'companies page',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyInquiry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CompanyInquiry_createdAt_idx" ON "CompanyInquiry"("createdAt");
