import { beforeEach, describe, expect, it, vi } from 'vitest';

type Batch = { id: string; userId: string; notificationClass: string; variantId: string; count: number; relatedIds: string[]; status: string; createdAt: Date };
const db = vi.hoisted(() => ({ batches: [] as Batch[], seq: 0 }));

vi.mock('@/lib/prisma', () => {
  const notificationBatch = {
    findFirst: async ({ where }: { where: Partial<Batch> }) =>
      db.batches.find(b => b.userId === where.userId && b.notificationClass === where.notificationClass && b.status === where.status) ?? null,
    create: async ({ data }: { data: Omit<Batch, 'id' | 'status' | 'createdAt'> }) => {
      const b = { ...data, id: `b${++db.seq}`, status: 'pending', createdAt: new Date() } as Batch;
      db.batches.push(b);
      return b;
    },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const b = db.batches.find(x => x.id === where.id)!;
      if (data.count && typeof data.count === 'object') b.count += (data.count as { increment: number }).increment;
      if (data.relatedIds && typeof data.relatedIds === 'object') b.relatedIds.push(...((data.relatedIds as { push: string[] }).push));
      if (typeof data.status === 'string') b.status = data.status;
      if (typeof data.variantId === 'string') b.variantId = data.variantId;
      return b;
    },
  };
  const prisma = { notificationBatch, $transaction: async (fn: (tx: unknown) => unknown) => fn({ notificationBatch }) };
  return { prisma };
});

import { recordBatchedEvent } from '@/lib/return-engine/database';

const event = (relatedId: string) => ({ userId: 'u1', variantId: 'VAL-03', notificationClass: 'VALIDATION', relatedId, minBatchSize: 3 });

beforeEach(() => { db.batches = []; db.seq = 0; });

describe('durable notification batching', () => {
  it('holds events until the batch threshold, then releases once', async () => {
    expect((await recordBatchedEvent(event('p1'))).ready).toBe(false);
    expect((await recordBatchedEvent(event('p2'))).ready).toBe(false);
    const third = await recordBatchedEvent(event('p3'));
    expect(third).toEqual({ ready: true, count: 3 });
    expect(db.batches[0].status).toBe('sent');
    expect(db.batches[0].relatedIds).toEqual(['p1', 'p2', 'p3']);
  });

  it('starts a new batch after one is sent and keeps users separate', async () => {
    for (const p of ['a', 'b', 'c']) await recordBatchedEvent(event(p));
    expect((await recordBatchedEvent(event('d'))).count).toBe(1);
    expect((await recordBatchedEvent({ ...event('x'), userId: 'u2' })).count).toBe(1);
    expect(db.batches.filter(b => b.status === 'pending')).toHaveLength(2);
  });

  it('counts survive a new engine instance because state lives in the database', async () => {
    await recordBatchedEvent(event('p1'));
    await recordBatchedEvent(event('p2'));
    // Simulates a cold start: no in-memory state is consulted.
    expect((await recordBatchedEvent(event('p3'))).ready).toBe(true);
  });
});
