-- DropForeignKey
ALTER TABLE "CareerDiscussion" DROP CONSTRAINT "CareerDiscussion_userId_fkey";

-- DropForeignKey
ALTER TABLE "OperatorPlaybook" DROP CONSTRAINT "OperatorPlaybook_userId_fkey";

-- DropForeignKey
ALTER TABLE "PatternSignal" DROP CONSTRAINT "PatternSignal_threadId_fkey";

-- DropForeignKey
ALTER TABLE "PollVote" DROP CONSTRAINT "PollVote_pollId_fkey";

-- DropForeignKey
ALTER TABLE "PollVote" DROP CONSTRAINT "PollVote_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reply" DROP CONSTRAINT "Reply_threadId_fkey";

-- DropForeignKey
ALTER TABLE "Reply" DROP CONSTRAINT "Reply_userId_fkey";

-- DropForeignKey
ALTER TABLE "Thread" DROP CONSTRAINT "Thread_userId_fkey";

-- DropForeignKey
ALTER TABLE "ThreadFollow" DROP CONSTRAINT "ThreadFollow_threadId_fkey";

-- DropForeignKey
ALTER TABLE "ThreadFollow" DROP CONSTRAINT "ThreadFollow_userId_fkey";

-- DropForeignKey
ALTER TABLE "TrialConfession" DROP CONSTRAINT "TrialConfession_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "badges",
DROP COLUMN "reputationScore",
DROP COLUMN "reputationTier",
ADD COLUMN     "companyCategory" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFoundingOperator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "roleCategory" TEXT NOT NULL,
ADD COLUMN     "suspensionReason" TEXT,
ADD COLUMN     "trustScore" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "userRole" TEXT NOT NULL,
ADD COLUMN     "verificationMethod" TEXT,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- DropTable
DROP TABLE "CareerDiscussion";

-- DropTable
DROP TABLE "CaseDrop";

-- DropTable
DROP TABLE "IndustrySignal";

-- DropTable
DROP TABLE "OperatorPlaybook";

-- DropTable
DROP TABLE "PatternSignal";

-- DropTable
DROP TABLE "Poll";

-- DropTable
DROP TABLE "PollVote";

-- DropTable
DROP TABLE "Reply";

-- DropTable
DROP TABLE "Thread";

-- DropTable
DROP TABLE "ThreadFollow";

-- DropTable
DROP TABLE "TrialConfession";

-- DropTable
DROP TABLE "TrialTypeRoom";

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "contributionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "originalContent" TEXT,
    "therapeuticArea" TEXT NOT NULL,
    "trialPhase" TEXT NOT NULL,
    "issueCategory" TEXT NOT NULL,
    "siteCountRange" TEXT,
    "geographicScope" TEXT,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'Normal',
    "resolutionStatus" TEXT NOT NULL DEFAULT 'Unresolved',
    "extractedPatterns" JSONB,
    "relatedContext" JSONB,
    "correlationRisk" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "riskFactors" JSONB,
    "redactionLog" JSONB,
    "redactionCount" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "isModerated" BOOLEAN NOT NULL DEFAULT false,
    "moderatedBy" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderationAction" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "suppressedSignalType" TEXT,
    "emotionalSignalType" TEXT,
    "workaroundPresent" BOOLEAN NOT NULL DEFAULT false,
    "workaroundType" TEXT,
    "systemOfRecordMismatch" BOOLEAN NOT NULL DEFAULT false,
    "officialRealityGap" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "decisionDistanceLevel" TEXT,
    "burdenAbsorber" TEXT,
    "burdenType" TEXT,
    "invisibleWorkType" TEXT,
    "likelyDownstreamRisk" TEXT,
    "escalationPattern" TEXT,
    "patientImpactPotential" TEXT,
    "operationalDebtLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "economicValuePotential" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "microOpportunityEligible" BOOLEAN NOT NULL DEFAULT false,
    "driftIndicatorsJson" JSONB,
    "failureTrajectoryPrediction" TEXT,
    "signalQualityScore" TEXT,
    "patternMaturity" TEXT,
    "predictiveSummary" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "forceIncludeFromPatterns" BOOLEAN NOT NULL DEFAULT false,
    "forceExcludeFromPatterns" BOOLEAN NOT NULL DEFAULT false,
    "overridePatternLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "userId" TEXT,
    "interactionType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "context" TEXT,
    "originalContext" TEXT,
    "correlationRisk" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "displayStatus" TEXT NOT NULL DEFAULT 'VISIBLE',
    "isSeeded" BOOLEAN NOT NULL DEFAULT false,
    "seededBy" TEXT,
    "founderNote" TEXT,
    "isHighValue" BOOLEAN NOT NULL DEFAULT false,
    "escalatedToSafety" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustVector" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quality" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "reliability" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "patternContribution" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "solutionUtility" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "recency" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "peerConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "outcomeReinforcement" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "scarcity" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "domainRelevance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "overallWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "priorityAccess" BOOLEAN NOT NULL DEFAULT false,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculationVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustVector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "therapeuticAreas" JSONB,
    "trialPhases" JSONB,
    "issueExpertise" JSONB,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "responsivenessScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "generatedSummary" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availabilityNote" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapabilityIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityMatch" (
    "id" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "capabilityIdentityId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "matchFactors" JSONB,
    "correlationRisk" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "correlationFactors" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contractorType" TEXT NOT NULL,
    "requiredRole" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "experienceLevel" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "therapeuticArea" TEXT NOT NULL,
    "trialPhase" TEXT NOT NULL,
    "location" TEXT,
    "remoteCapable" BOOLEAN NOT NULL DEFAULT false,
    "organizationType" TEXT NOT NULL,
    "compensationBand" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "priorityLevel" TEXT NOT NULL DEFAULT 'Normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Applied',
    "message" TEXT,
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "therapeuticAreas" TEXT[],
    "trialPhases" TEXT[],
    "siteTypes" TEXT[],
    "certifications" TEXT[],
    "languages" TEXT[],
    "location" TEXT,
    "timezone" TEXT,
    "roleTitle" TEXT,
    "organizationType" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availabilityNote" TEXT,
    "minSites" INTEGER NOT NULL DEFAULT 1,
    "maxSites" INTEGER NOT NULL DEFAULT 5,
    "travelWilling" BOOLEAN NOT NULL DEFAULT true,
    "remoteCapable" BOOLEAN NOT NULL DEFAULT false,
    "hourlyRate" TEXT,
    "successfulMatches" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionOutcome" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "userId" TEXT,
    "outcomeType" TEXT NOT NULL,
    "outcomeData" TEXT,
    "wasHelpful" BOOLEAN,
    "impactScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContributionOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HireOutcome" (
    "id" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "userId" TEXT,
    "wasSuccessful" BOOLEAN,
    "wouldRehire" BOOLEAN,
    "feedback" TEXT,
    "performanceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HireOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hire" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compensationBand" TEXT,
    "contractDuration" TEXT,
    "feePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "estimatedFee" DOUBLE PRECISION,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeRecord" (
    "id" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "feePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "estimatedCompensation" DOUBLE PRECISION,
    "feeOwed" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Fee Pending',
    "invoiceReference" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "collectedDate" TIMESTAMP(3),
    "collectedAmount" DOUBLE PRECISION,
    "waiverReason" TEXT,
    "waivedBy" TEXT,
    "waivedAt" TIMESTAMP(3),
    "notes" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedBy" TEXT,
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "originalContent" TEXT,
    "wasRedacted" BOOLEAN NOT NULL DEFAULT false,
    "redactionReason" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "isRemoved" BOOLEAN NOT NULL DEFAULT false,
    "removedBy" TEXT,
    "removedAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "notificationClass" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "copy" TEXT NOT NULL,
    "contextSnippet" TEXT,
    "relatedPostId" TEXT,
    "relatedThreadId" TEXT,
    "relatedOpportunityId" TEXT,
    "relatedPatternId" TEXT,
    "relatedMatchId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "surfaces" TEXT[],
    "deliveredTo" TEXT[],
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" TIMESTAMP(3),
    "batchId" TEXT,
    "batchCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "notificationClass" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "relatedIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "validationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "expansionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "momentumEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pressureEnabled" BOOLEAN NOT NULL DEFAULT true,
    "opportunityEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "timezone" TEXT,
    "digestFrequency" TEXT NOT NULL DEFAULT 'daily',
    "digestTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlaggedContent" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "reportedBy" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "action" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlaggedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroOpportunity" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "triggerReason" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "therapeuticArea" TEXT,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
    "minCompensation" DOUBLE PRECISION NOT NULL DEFAULT 150,
    "maxCompensation" DOUBLE PRECISION NOT NULL DEFAULT 300,
    "requiredExpertise" TEXT[],
    "matchedOperators" TEXT[],
    "interestedOperators" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'open',
    "selectedOperator" TEXT,
    "completedAt" TIMESTAMP(3),
    "actualCompensation" DOUBLE PRECISION,
    "outcomeNotes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MicroOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroOpportunityInterest" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expressedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "compensation" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MicroOpportunityInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "anonymousUserId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventCategory" TEXT NOT NULL,
    "objectType" TEXT,
    "objectId" TEXT,
    "metadataJson" JSONB,
    "dataSource" TEXT NOT NULL DEFAULT 'REAL',
    "createdAtBucket" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMetrics" (
    "id" TEXT NOT NULL,
    "anonymousUserId" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL DEFAULT 'REAL',
    "roleType" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'Pending',
    "signupDateBucket" TEXT,
    "lastActiveBucket" TEXT,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "reflectionOpenCount" INTEGER NOT NULL DEFAULT 0,
    "opportunityInviteCount" INTEGER NOT NULL DEFAULT 0,
    "microConsultCount" INTEGER NOT NULL DEFAULT 0,
    "revenueGeneratedCents" INTEGER NOT NULL DEFAULT 0,
    "retentionStatus" TEXT NOT NULL DEFAULT 'new',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAccessLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "fieldsAccessed" TEXT[],
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMetrics" (
    "id" TEXT NOT NULL,
    "dateBucket" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL DEFAULT 'REAL',
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "verifiedOperators" INTEGER NOT NULL DEFAULT 0,
    "verifiedOrgs" INTEGER NOT NULL DEFAULT 0,
    "onboardingCompleted" INTEGER NOT NULL DEFAULT 0,
    "dau" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "notificationsSent" INTEGER NOT NULL DEFAULT 0,
    "notificationsOpened" INTEGER NOT NULL DEFAULT 0,
    "postsCreated" INTEGER NOT NULL DEFAULT 0,
    "interactions" INTEGER NOT NULL DEFAULT 0,
    "reflectionsSent" INTEGER NOT NULL DEFAULT 0,
    "reflectionsOpened" INTEGER NOT NULL DEFAULT 0,
    "microOppsCreated" INTEGER NOT NULL DEFAULT 0,
    "operatorInvites" INTEGER NOT NULL DEFAULT 0,
    "operatorInterests" INTEGER NOT NULL DEFAULT 0,
    "consultsCompleted" INTEGER NOT NULL DEFAULT 0,
    "gmvCents" INTEGER NOT NULL DEFAULT 0,
    "platformRevenueCents" INTEGER NOT NULL DEFAULT 0,
    "operatorPayoutsCents" INTEGER NOT NULL DEFAULT 0,
    "flaggedContent" INTEGER NOT NULL DEFAULT 0,
    "redactionsApplied" INTEGER NOT NULL DEFAULT 0,
    "highRiskPosts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityMap" (
    "id" TEXT NOT NULL,
    "realUserId" TEXT NOT NULL,
    "anonymousUserId" TEXT NOT NULL,
    "encryptedMapping" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IdentityMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionSignalExtraction" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "signalStage" TEXT NOT NULL,
    "workaroundPresent" BOOLEAN NOT NULL DEFAULT false,
    "workaroundType" TEXT,
    "suppressedSignalType" TEXT,
    "emotionalSignalType" TEXT,
    "systemOfRecordMismatch" BOOLEAN NOT NULL DEFAULT false,
    "officialRealityGap" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "decisionDistanceLevel" TEXT,
    "burdenAbsorber" TEXT,
    "burdenType" TEXT,
    "invisibleWorkType" TEXT,
    "likelyDownstreamRisk" TEXT,
    "escalationPattern" TEXT,
    "patientImpactPotential" TEXT,
    "operationalDebtLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "economicValuePotential" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "microOpportunityEligible" BOOLEAN NOT NULL DEFAULT false,
    "driftIndicatorsJson" JSONB,
    "failureTrajectoryPrediction" TEXT,
    "signalQualityScore" TEXT,
    "predictiveSummary" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "extractionVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionSignalExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionFollowUp" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "userId" TEXT,
    "followUpType" TEXT NOT NULL DEFAULT 'truth_loop',
    "statusChange" TEXT NOT NULL,
    "notes" TEXT,
    "validatedPrediction" TEXT,
    "daysSinceSubmission" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseFollow" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailurePathway" (
    "id" TEXT NOT NULL,
    "pathwayType" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "contributionIds" TEXT[],
    "triggerSignals" JSONB,
    "intermediateSignals" JSONB,
    "outcomeSignal" JSONB,
    "pathwayRisk" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "confirmedAt" TIMESTAMP(3),
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FailurePathway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributorHealthFlag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalLevel" TEXT NOT NULL DEFAULT 'normal',
    "lastContributionAt" TIMESTAMP(3),
    "contributionCount" INTEGER NOT NULL DEFAULT 0,
    "avgSignalQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "isInactive" BOOLEAN NOT NULL DEFAULT false,
    "inactivityDays" INTEGER,
    "dropOffDetected" BOOLEAN NOT NULL DEFAULT false,
    "dropOffDate" TIMESTAMP(3),
    "followUpResponseRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reflectionOpenRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "churnRisk" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "adminNoted" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributorHealthFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contribution_contributionType_idx" ON "Contribution"("contributionType");

-- CreateIndex
CREATE INDEX "Contribution_therapeuticArea_idx" ON "Contribution"("therapeuticArea");

-- CreateIndex
CREATE INDEX "Contribution_issueCategory_idx" ON "Contribution"("issueCategory");

-- CreateIndex
CREATE INDEX "Contribution_resolutionStatus_idx" ON "Contribution"("resolutionStatus");

-- CreateIndex
CREATE INDEX "Contribution_signalQualityScore_idx" ON "Contribution"("signalQualityScore");

-- CreateIndex
CREATE INDEX "Contribution_patternMaturity_idx" ON "Contribution"("patternMaturity");

-- CreateIndex
CREATE INDEX "Contribution_suppressedSignalType_idx" ON "Contribution"("suppressedSignalType");

-- CreateIndex
CREATE INDEX "Contribution_emotionalSignalType_idx" ON "Contribution"("emotionalSignalType");

-- CreateIndex
CREATE INDEX "Interaction_contributionId_idx" ON "Interaction"("contributionId");

-- CreateIndex
CREATE INDEX "Interaction_interactionType_idx" ON "Interaction"("interactionType");

-- CreateIndex
CREATE UNIQUE INDEX "Interaction_contributionId_userId_interactionType_key" ON "Interaction"("contributionId", "userId", "interactionType");

-- CreateIndex
CREATE UNIQUE INDEX "TrustVector_userId_key" ON "TrustVector"("userId");

-- CreateIndex
CREATE INDEX "TrustVector_priorityAccess_idx" ON "TrustVector"("priorityAccess");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityIdentity_userId_key" ON "CapabilityIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityIdentity_profileId_key" ON "CapabilityIdentity"("profileId");

-- CreateIndex
CREATE INDEX "OpportunityMatch_status_idx" ON "OpportunityMatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityMatch_jobPostingId_capabilityIdentityId_key" ON "OpportunityMatch"("jobPostingId", "capabilityIdentityId");

-- CreateIndex
CREATE INDEX "JobPosting_status_idx" ON "JobPosting"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobPostingId_operatorId_key" ON "Application"("jobPostingId", "operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorProfile_userId_key" ON "OperatorProfile"("userId");

-- CreateIndex
CREATE INDEX "ContributionOutcome_contributionId_idx" ON "ContributionOutcome"("contributionId");

-- CreateIndex
CREATE UNIQUE INDEX "HireOutcome_hireId_key" ON "HireOutcome"("hireId");

-- CreateIndex
CREATE UNIQUE INDEX "Hire_applicationId_key" ON "Hire"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeRecord_hireId_key" ON "FeeRecord"("hireId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_applicationId_key" ON "Conversation"("applicationId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_notificationClass_idx" ON "Notification"("notificationClass");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_scheduledFor_idx" ON "Notification"("scheduledFor");

-- CreateIndex
CREATE INDEX "NotificationBatch_userId_idx" ON "NotificationBatch"("userId");

-- CreateIndex
CREATE INDEX "NotificationBatch_scheduledFor_idx" ON "NotificationBatch"("scheduledFor");

-- CreateIndex
CREATE INDEX "NotificationBatch_status_idx" ON "NotificationBatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationSettings_userId_key" ON "UserNotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "UserNotificationSettings_userId_idx" ON "UserNotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "MicroOpportunity_contributionId_idx" ON "MicroOpportunity"("contributionId");

-- CreateIndex
CREATE INDEX "MicroOpportunity_status_idx" ON "MicroOpportunity"("status");

-- CreateIndex
CREATE INDEX "MicroOpportunity_issueType_idx" ON "MicroOpportunity"("issueType");

-- CreateIndex
CREATE INDEX "MicroOpportunityInterest_opportunityId_idx" ON "MicroOpportunityInterest"("opportunityId");

-- CreateIndex
CREATE INDEX "MicroOpportunityInterest_userId_idx" ON "MicroOpportunityInterest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MicroOpportunityInterest_opportunityId_userId_key" ON "MicroOpportunityInterest"("opportunityId", "userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_anonymousUserId_idx" ON "AnalyticsEvent"("anonymousUserId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventCategory_idx" ON "AnalyticsEvent"("eventCategory");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAtBucket_idx" ON "AnalyticsEvent"("createdAtBucket");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_dataSource_idx" ON "AnalyticsEvent"("dataSource");

-- CreateIndex
CREATE UNIQUE INDEX "UserMetrics_anonymousUserId_key" ON "UserMetrics"("anonymousUserId");

-- CreateIndex
CREATE INDEX "UserMetrics_anonymousUserId_idx" ON "UserMetrics"("anonymousUserId");

-- CreateIndex
CREATE INDEX "UserMetrics_roleType_idx" ON "UserMetrics"("roleType");

-- CreateIndex
CREATE INDEX "UserMetrics_retentionStatus_idx" ON "UserMetrics"("retentionStatus");

-- CreateIndex
CREATE INDEX "UserMetrics_dataSource_idx" ON "UserMetrics"("dataSource");

-- CreateIndex
CREATE INDEX "AdminAccessLog_adminUserId_idx" ON "AdminAccessLog"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminAccessLog_action_idx" ON "AdminAccessLog"("action");

-- CreateIndex
CREATE INDEX "AdminAccessLog_createdAt_idx" ON "AdminAccessLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetrics_dateBucket_key" ON "DailyMetrics"("dateBucket");

-- CreateIndex
CREATE INDEX "DailyMetrics_dateBucket_idx" ON "DailyMetrics"("dateBucket");

-- CreateIndex
CREATE INDEX "DailyMetrics_dataSource_idx" ON "DailyMetrics"("dataSource");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityMap_realUserId_key" ON "IdentityMap"("realUserId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityMap_anonymousUserId_key" ON "IdentityMap"("anonymousUserId");

-- CreateIndex
CREATE INDEX "IdentityMap_realUserId_idx" ON "IdentityMap"("realUserId");

-- CreateIndex
CREATE INDEX "IdentityMap_anonymousUserId_idx" ON "IdentityMap"("anonymousUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionSignalExtraction_contributionId_key" ON "ExecutionSignalExtraction"("contributionId");

-- CreateIndex
CREATE INDEX "ExecutionSignalExtraction_signalStage_idx" ON "ExecutionSignalExtraction"("signalStage");

-- CreateIndex
CREATE INDEX "ExecutionSignalExtraction_suppressedSignalType_idx" ON "ExecutionSignalExtraction"("suppressedSignalType");

-- CreateIndex
CREATE INDEX "ExecutionSignalExtraction_signalQualityScore_idx" ON "ExecutionSignalExtraction"("signalQualityScore");

-- CreateIndex
CREATE INDEX "ExecutionSignalExtraction_workaroundPresent_idx" ON "ExecutionSignalExtraction"("workaroundPresent");

-- CreateIndex
CREATE INDEX "ExecutionSignalExtraction_microOpportunityEligible_idx" ON "ExecutionSignalExtraction"("microOpportunityEligible");

-- CreateIndex
CREATE INDEX "ContributionFollowUp_contributionId_idx" ON "ContributionFollowUp"("contributionId");

-- CreateIndex
CREATE INDEX "ContributionFollowUp_statusChange_idx" ON "ContributionFollowUp"("statusChange");

-- CreateIndex
CREATE INDEX "ContributionFollowUp_createdAt_idx" ON "ContributionFollowUp"("createdAt");

-- CreateIndex
CREATE INDEX "CaseFollow_userId_createdAt_idx" ON "CaseFollow"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseFollow_contributionId_idx" ON "CaseFollow"("contributionId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseFollow_contributionId_userId_key" ON "CaseFollow"("contributionId", "userId");

-- CreateIndex
CREATE INDEX "FailurePathway_pathwayType_idx" ON "FailurePathway"("pathwayType");

-- CreateIndex
CREATE INDEX "FailurePathway_stage_idx" ON "FailurePathway"("stage");

-- CreateIndex
CREATE INDEX "FailurePathway_isActive_idx" ON "FailurePathway"("isActive");

-- CreateIndex
CREATE INDEX "FailurePathway_detectedAt_idx" ON "FailurePathway"("detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContributorHealthFlag_userId_key" ON "ContributorHealthFlag"("userId");

-- CreateIndex
CREATE INDEX "ContributorHealthFlag_signalLevel_idx" ON "ContributorHealthFlag"("signalLevel");

-- CreateIndex
CREATE INDEX "ContributorHealthFlag_isInactive_idx" ON "ContributorHealthFlag"("isInactive");

-- CreateIndex
CREATE INDEX "ContributorHealthFlag_churnRisk_idx" ON "ContributorHealthFlag"("churnRisk");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustVector" ADD CONSTRAINT "TrustVector_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityIdentity" ADD CONSTRAINT "CapabilityIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityMatch" ADD CONSTRAINT "OpportunityMatch_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityMatch" ADD CONSTRAINT "OpportunityMatch_capabilityIdentityId_fkey" FOREIGN KEY ("capabilityIdentityId") REFERENCES "CapabilityIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityMatch" ADD CONSTRAINT "OpportunityMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "OperatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorProfile" ADD CONSTRAINT "OperatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionOutcome" ADD CONSTRAINT "ContributionOutcome_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionOutcome" ADD CONSTRAINT "ContributionOutcome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HireOutcome" ADD CONSTRAINT "HireOutcome_hireId_fkey" FOREIGN KEY ("hireId") REFERENCES "Hire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HireOutcome" ADD CONSTRAINT "HireOutcome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hire" ADD CONSTRAINT "Hire_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hire" ADD CONSTRAINT "Hire_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRecord" ADD CONSTRAINT "FeeRecord_hireId_fkey" FOREIGN KEY ("hireId") REFERENCES "Hire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRecord" ADD CONSTRAINT "FeeRecord_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "NotificationBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionSignalExtraction" ADD CONSTRAINT "ExecutionSignalExtraction_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionFollowUp" ADD CONSTRAINT "ContributionFollowUp_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionFollowUp" ADD CONSTRAINT "ContributionFollowUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFollow" ADD CONSTRAINT "CaseFollow_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFollow" ADD CONSTRAINT "CaseFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorHealthFlag" ADD CONSTRAINT "ContributorHealthFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "KnowledgeLedgerEvent_aggregateType_aggregateRefHash_createdAt_i" RENAME TO "KnowledgeLedgerEvent_aggregateType_aggregateRefHash_created_idx";

-- RenameIndex
ALTER INDEX "KnowledgeLedgerEvent_aggregateType_aggregateRefHash_sequence_ke" RENAME TO "KnowledgeLedgerEvent_aggregateType_aggregateRefHash_sequenc_key";
