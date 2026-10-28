-- Years of experience and temporary identity-ownership proof (cleared at approval).
-- Additive and idempotent: safe to run more than once.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yearsExperience" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "linkedinProofCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workEmailPending" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workEmailCodeHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workEmailCodeExpires" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workEmailVerifiedAt" TIMESTAMP(3);
