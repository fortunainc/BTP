CREATE TABLE "ApiRateLimit" ("key" TEXT PRIMARY KEY, "windowStart" TIMESTAMP(3) NOT NULL, "count" INTEGER NOT NULL);
CREATE TABLE "AccountDeletionRequest" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL UNIQUE, "status" TEXT NOT NULL DEFAULT 'REQUESTED', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3));
ALTER TABLE "PrivateHelpRequest" ALTER COLUMN "contributionId" DROP NOT NULL;
ALTER TABLE "PrivateHelpRequest" ADD COLUMN "assignedExpertId" TEXT, ADD COLUMN "internalNote" TEXT, ADD COLUMN "memberUpdate" TEXT, ADD COLUMN "feedback" TEXT, ADD COLUMN "completedAt" TIMESTAMP(3), ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "ContributionOutcome" SET "wasHelpful" = false, "impactScore" = 0 WHERE "outcomeType" IN ('correction', 'incomplete');
