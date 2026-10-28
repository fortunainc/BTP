-- Years of experience and temporary identity-ownership proof (cleared at approval).
-- Additive and idempotent: safe to run more than once.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yearsExperience" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "linkedinProofCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workEmailPending" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workEmailTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workEmailTokenExpires" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workEmailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workEmailHash" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_workEmailTokenHash_key" ON "User"("workEmailTokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "User_workEmailHash_key" ON "User"("workEmailHash");
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vouchTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vouchTokenExpires" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vouchNote" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vouchedById" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vouchedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "User_vouchTokenHash_key" ON "User"("vouchTokenHash");
