-- Add badges field to User
ALTER TABLE "User" ADD COLUMN "badges" TEXT[];

-- Add signalType to Thread
ALTER TABLE "Thread" ADD COLUMN "signalType" TEXT DEFAULT 'Assist';

-- Add isPinned to Reply
ALTER TABLE "Reply" ADD COLUMN "isPinned" BOOLEAN DEFAULT false;

-- Create IndustrySignal table
CREATE TABLE "IndustrySignal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "question" TEXT NOT NULL,
    "therapeuticArea" TEXT,
    "trialPhase" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustrySignal_pkey" PRIMARY KEY ("id")
);

-- Create OperatorPlaybook table
CREATE TABLE "OperatorPlaybook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "threadId" TEXT,
    "userId" TEXT,
    "situationDescription" TEXT NOT NULL,
    "warningSigns" TEXT[] NOT NULL,
    "escalationSteps" TEXT[] NOT NULL,
    "escalationLanguage" TEXT NOT NULL,
    "lessonsLearned" TEXT NOT NULL,
    "therapeuticArea" TEXT NOT NULL,
    "trialPhase" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorPlaybook_pkey" PRIMARY KEY ("id")
);

-- Create TrialConfession table
CREATE TABLE "TrialConfession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "therapeuticArea" TEXT,
    "trialPhase" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialConfession_pkey" PRIMARY KEY ("id")
);

-- Create CareerDiscussion table
CREATE TABLE "CareerDiscussion" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerDiscussion_pkey" PRIMARY KEY ("id")
);

-- Add new fields to TrialTypeRoom
ALTER TABLE "TrialTypeRoom" ADD COLUMN "participantCount" INTEGER DEFAULT 0;
ALTER TABLE "TrialTypeRoom" ADD COLUMN "lastActiveAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "TrialTypeRoom" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "TrialTypeRoom" ADD COLUMN "closesAt" TIMESTAMP(3);

-- Add foreign key constraints
ALTER TABLE "OperatorPlaybook" ADD CONSTRAINT "OperatorPlaybook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrialConfession" ADD CONSTRAINT "TrialConfession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerDiscussion" ADD CONSTRAINT "CareerDiscussion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;