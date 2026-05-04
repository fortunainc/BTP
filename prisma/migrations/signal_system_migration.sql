-- Signal System Migration
-- Transforms social platform into closed-loop signal system

-- 1. Add Signal Score fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signalScore" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "averageSignalQuality" FLOAT DEFAULT 0.0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tier" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "internalBadges" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signalCount" INTEGER DEFAULT 0;

-- 2. Create Signal table (will replace Thread)
CREATE TABLE IF NOT EXISTS "Signal" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    
    -- Structured Fields
    "contextType" TEXT NOT NULL,
    "expectedOutcome" TEXT NOT NULL,
    "actualOutcome" TEXT NOT NULL,
    "breakPoint" TEXT NOT NULL,
    "rootCause" TEXT,
    "workaround" TEXT,
    
    -- Impact Matrix
    "timeImpact" TEXT NOT NULL DEFAULT 'medium',
    "costImpact" TEXT NOT NULL DEFAULT 'medium',
    "patientImpact" TEXT NOT NULL DEFAULT 'medium',
    "operationalImpact" TEXT NOT NULL DEFAULT 'medium',
    
    -- Metadata
    "repeatability" TEXT NOT NULL DEFAULT 'one-time',
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Scoring
    "signalScore" INTEGER DEFAULT 0,
    "completenessScore" FLOAT DEFAULT 0.0,
    "specificityScore" FLOAT DEFAULT 0.0,
    "impactScore" FLOAT DEFAULT 0.0,
    
    -- Pattern Detection
    "patternLabel" TEXT,
    "similarSignalCount" INTEGER DEFAULT 0,
    
    -- Status
    "status" TEXT DEFAULT 'active',
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- 3. Create SignalEndorsement table (structured, not free-form comments)
CREATE TABLE IF NOT EXISTS "SignalEndorsement" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "userId" TEXT,
    
    -- Structured endorsement
    "endorsementType" TEXT NOT NULL, -- 'experienced_same', 'have_workaround', 'can_help'
    "additionalContext" TEXT,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "SignalEndorsement_pkey" PRIMARY KEY ("id")
);

-- 4. Create SignalPattern table for pattern detection
CREATE TABLE IF NOT EXISTS "SignalPattern" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "signalCount" INTEGER DEFAULT 0,
    "avgImpactScore" FLOAT DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "SignalPattern_pkey" PRIMARY KEY ("id")
);

-- 5. Add foreign key constraints
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SignalEndorsement" ADD CONSTRAINT "SignalEndorsement_signalId_fkey" 
    FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SignalEndorsement" ADD CONSTRAINT "SignalEndorsement_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS "Signal_userId_idx" ON "Signal"("userId");
CREATE INDEX IF NOT EXISTS "Signal_contextType_idx" ON "Signal"("contextType");
CREATE INDEX IF NOT EXISTS "Signal_patternLabel_idx" ON "Signal"("patternLabel");
CREATE INDEX IF NOT EXISTS "Signal_createdAt_idx" ON "Signal"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "User_tier_idx" ON "User"("tier");
CREATE INDEX IF NOT EXISTS "User_signalScore_idx" ON "User"("signalScore" DESC);

-- 7. Update JobPosting with tier visibility
ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "minTierRequired" INTEGER DEFAULT 0;
ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT false;