ALTER TABLE "AccessRequest"
 ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
 ADD COLUMN IF NOT EXISTS "waitlistReferrerId" TEXT REFERENCES "AccessRequest"("id") ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS "emailConfirmedAt" TIMESTAMP(3),
 ADD COLUMN IF NOT EXISTS "referralExcludedAt" TIMESTAMP(3),
 ADD COLUMN IF NOT EXISTS "referralExclusionReason" TEXT,
 ADD COLUMN IF NOT EXISTS "experienceProfile" JSONB,
 ADD COLUMN IF NOT EXISTS "experienceCompletedAt" TIMESTAMP(3),
 ADD COLUMN IF NOT EXISTS "experienceUpdatedAt" TIMESTAMP(3),
 ADD COLUMN IF NOT EXISTS "welcomeClaimedAt" TIMESTAMP(3),
 ADD COLUMN IF NOT EXISTS "welcomeSentAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "AccessRequest_referralCode_key" ON "AccessRequest"("referralCode");
CREATE INDEX IF NOT EXISTS "AccessRequest_waitlistReferrerId_idx" ON "AccessRequest"("waitlistReferrerId");
CREATE TABLE IF NOT EXISTS "WaitlistToken" (
 "id" TEXT PRIMARY KEY, "requestId" TEXT NOT NULL REFERENCES "AccessRequest"("id") ON DELETE CASCADE,
 "tokenHash" TEXT NOT NULL UNIQUE, "purpose" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WaitlistToken_requestId_purpose_idx" ON "WaitlistToken"("requestId","purpose");
CREATE INDEX IF NOT EXISTS "WaitlistToken_expiresAt_idx" ON "WaitlistToken"("expiresAt");
CREATE TABLE IF NOT EXISTS "WaitlistReferralEvent" (
 "id" TEXT PRIMARY KEY, "requestId" TEXT NOT NULL REFERENCES "AccessRequest"("id") ON DELETE CASCADE,
 "actorId" TEXT NOT NULL, "action" TEXT NOT NULL, "reason" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WaitlistReferralEvent_requestId_idx" ON "WaitlistReferralEvent"("requestId");
