import { createHash, randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type KnowledgeAggregateType = 'QUESTION' | 'ANSWER' | 'INTERACTION' | 'OUTCOME' | 'HELP_REQUEST';

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function buildLedgerEvent(input: {
  aggregateType: KnowledgeAggregateType;
  aggregateId: string;
  eventType: string;
  actorUserId?: string | null;
  payload: Prisma.InputJsonObject;
  sequence?: number;
  previousEventId?: string | null;
}) {
  const id = randomUUID();
  const sequence = input.sequence ?? 0;
  const immutableContent = {
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    eventType: input.eventType,
    sequence,
    previousEventId: input.previousEventId ?? null,
    actorUserId: input.actorUserId ?? null,
    payload: input.payload,
  };

  return {
    id,
    ...immutableContent,
    payloadHash: createHash('sha256').update(canonicalize(immutableContent)).digest('hex'),
  };
}

export async function appendKnowledgeLedgerEvent(input: Parameters<typeof buildLedgerEvent>[0]) {
  return prisma.knowledgeLedgerEvent.create({ data: buildLedgerEvent(input) });
}
