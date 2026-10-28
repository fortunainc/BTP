-- Member invite links and access requests. Additive and idempotent.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredById" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");
CREATE TABLE IF NOT EXISTS "AccessRequest" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "referrerId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'requested',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "invitedAt" TIMESTAMP(3),
  "joinedAt" TIMESTAMP(3),
  CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AccessRequest_email_key" ON "AccessRequest"("email");
CREATE INDEX IF NOT EXISTS "AccessRequest_referrerId_idx" ON "AccessRequest"("referrerId");
