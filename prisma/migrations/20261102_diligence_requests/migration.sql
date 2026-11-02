CREATE TABLE IF NOT EXISTS "DiligenceRequest" (
  "id" TEXT NOT NULL,
  "investorId" TEXT,
  "name" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL,
  "company" TEXT NOT NULL DEFAULT '',
  "sections" TEXT NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiligenceRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DiligenceRequest_createdAt_idx" ON "DiligenceRequest"("createdAt");
