-- Per-investor access, data room files and investor activity. Additive and idempotent.
CREATE TABLE IF NOT EXISTS "Investor" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "company" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "tokenHash" TEXT,
  "tokenExpires" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3),
  "visits" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Investor_email_key" ON "Investor"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Investor_tokenHash_key" ON "Investor"("tokenHash");
CREATE TABLE IF NOT EXISTS "DiligenceDoc" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiligenceDoc_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "InvestorActivity" (
  "id" TEXT NOT NULL,
  "investorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "docId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvestorActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InvestorActivity_investorId_idx" ON "InvestorActivity"("investorId");
CREATE INDEX IF NOT EXISTS "InvestorActivity_createdAt_idx" ON "InvestorActivity"("createdAt");
