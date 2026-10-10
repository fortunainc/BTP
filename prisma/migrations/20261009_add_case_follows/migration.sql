CREATE TABLE "CaseFollow" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseFollow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CaseFollow_contributionId_userId_key"
    ON "CaseFollow"("contributionId", "userId");
CREATE INDEX "CaseFollow_userId_createdAt_idx" ON "CaseFollow"("userId", "createdAt");
CREATE INDEX "CaseFollow_contributionId_idx" ON "CaseFollow"("contributionId");

ALTER TABLE "CaseFollow"
    ADD CONSTRAINT "CaseFollow_contributionId_fkey"
    FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseFollow"
    ADD CONSTRAINT "CaseFollow_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
