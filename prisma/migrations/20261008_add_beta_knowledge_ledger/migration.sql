CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "KnowledgeLedgerEvent" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateRefHash" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "previousEventHash" TEXT,
    "contentHash" TEXT NOT NULL,
    "rowHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeLedgerEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KnowledgeLedgerEvent_aggregateType_aggregateRefHash_sequence_key"
ON "KnowledgeLedgerEvent"("aggregateType", "aggregateRefHash", "sequence");
CREATE INDEX "KnowledgeLedgerEvent_aggregateType_aggregateRefHash_createdAt_idx"
ON "KnowledgeLedgerEvent"("aggregateType", "aggregateRefHash", "createdAt");
CREATE INDEX "KnowledgeLedgerEvent_eventType_createdAt_idx"
ON "KnowledgeLedgerEvent"("eventType", "createdAt");

-- The database independently seals every immutable row. It does not trust a
-- caller-supplied hash, matching TSM's database-authoritative ledger pattern.
CREATE OR REPLACE FUNCTION seal_knowledge_ledger_event()
RETURNS trigger AS $$
BEGIN
  NEW."rowHash" := encode(digest(convert_to(
    coalesce(NEW."aggregateType", '') || chr(31) ||
    coalesce(NEW."aggregateRefHash", '') || chr(31) ||
    coalesce(NEW."eventType", '') || chr(31) ||
    coalesce(NEW."sequence"::text, '') || chr(31) ||
    coalesce(NEW."previousEventHash", '') || chr(31) ||
    coalesce(NEW."contentHash", ''),
    'UTF8'
  ), 'sha256'), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "KnowledgeLedgerEvent_seal_insert"
BEFORE INSERT ON "KnowledgeLedgerEvent"
FOR EACH ROW EXECUTE FUNCTION seal_knowledge_ledger_event();

CREATE TABLE "PrivateHelpRequest" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "helpType" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timing" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrivateHelpRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PrivateHelpRequest_contributionId_createdAt_idx"
ON "PrivateHelpRequest"("contributionId", "createdAt");
CREATE INDEX "PrivateHelpRequest_userId_createdAt_idx"
ON "PrivateHelpRequest"("userId", "createdAt");
CREATE INDEX "PrivateHelpRequest_status_createdAt_idx"
ON "PrivateHelpRequest"("status", "createdAt");

-- TSM-style append-only enforcement: corrections and moderation are new events.
CREATE OR REPLACE FUNCTION reject_knowledge_ledger_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'KnowledgeLedgerEvent is append-only: % is forbidden', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "KnowledgeLedgerEvent_append_only_update"
BEFORE UPDATE ON "KnowledgeLedgerEvent"
FOR EACH ROW EXECUTE FUNCTION reject_knowledge_ledger_mutation();

CREATE TRIGGER "KnowledgeLedgerEvent_append_only_delete"
BEFORE DELETE ON "KnowledgeLedgerEvent"
FOR EACH ROW EXECUTE FUNCTION reject_knowledge_ledger_mutation();
