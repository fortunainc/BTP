import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mock = vi.hoisted(() => ({ status: 'NEW', changed: 1, update: vi.fn(), ledger: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ withAdminAuth: (handler: (request: NextRequest, admin: { userId: string }) => Promise<Response>) => (request: NextRequest) => handler(request, { userId: 'founder' }) }));
vi.mock('@/lib/anti-correlation', () => ({ applyAutomaticRedaction: (value: string) => ({ redactedContent: value }) }));
vi.mock('@/lib/prisma', () => {
  const tx = {
    privateHelpRequest: { findUnique: async () => ({ id: 'help', userId: 'member', status: mock.status }), updateMany: async (args: unknown) => { mock.update(args); return { count: mock.changed }; } },
    user: { findFirst: async () => ({ id: 'expert' }) },
    knowledgeLedgerEvent: { findFirst: async () => ({ sequence: 2, rowHash: 'previous-seal' }), create: async (args: unknown) => mock.ledger(args) },
  };
  return { prisma: { ...tx, $transaction: (fn: (transaction: unknown) => Promise<unknown>) => fn(tx) } };
});
import { PATCH } from '@/app/api/admin/help-requests/route';
const call = (body: Record<string, unknown>) => PATCH(new NextRequest('https://btp.test/api/admin/help-requests', { method: 'PATCH', body: JSON.stringify({ id: 'help', memberUpdate: 'Update for member', ...body }) }));
beforeEach(() => { mock.status = 'NEW'; mock.changed = 1; mock.update.mockClear(); mock.ledger.mockClear(); });
it('rejects a skipped transition', async () => { expect((await call({ status: 'COMPLETED' })).status).toBe(409); expect(mock.update).not.toHaveBeenCalled(); });
it('records the next ledger sequence for each state change', async () => { expect((await call({ status: 'REVIEWING' })).status).toBe(200); expect(mock.ledger.mock.calls[0][0].data).toMatchObject({ sequence: 3, previousEventHash: 'previous-seal' }); });
it('requires explicit mutual consent before a match', async () => { mock.status = 'MATCHING'; expect((await call({ status: 'MATCHED', expertId: 'expert' })).status).toBe(400); expect(mock.update).not.toHaveBeenCalled(); expect((await call({ status: 'MATCHED', expertId: 'expert', consentConfirmed: true })).status).toBe(200); });
it('returns conflict rather than recording a stale transition', async () => { mock.changed = 0; expect((await call({ status: 'REVIEWING' })).status).toBe(409); expect(mock.ledger).not.toHaveBeenCalled(); });
