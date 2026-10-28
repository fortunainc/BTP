import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ users: [] as Array<Record<string, unknown>>, requests: [] as Array<Record<string, unknown>> }));
const match = (row: Record<string, unknown>, where: Record<string, unknown>) =>
  Object.entries(where).every(([k, v]) => (v && typeof v === 'object' && 'gte' in (v as object)) ? (row[k] as Date) >= (v as { gte: Date }).gte : row[k] === v);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: async ({ where }: { where: Record<string, unknown> }) => db.users.find(u => match(u, where)) ?? null,
      findFirst: async ({ where }: { where: Record<string, unknown> }) => db.users.find(u => match(u, where)) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => { const u = db.users.find(x => x.id === where.id)!; Object.assign(u, data); return u; },
      count: async ({ where }: { where: Record<string, unknown> }) => db.users.filter(u => match(u, where)).length,
    },
    accessRequest: {
      findUnique: async ({ where }: { where: Record<string, unknown> }) => db.requests.find(r => match(r, where)) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => { const r = { id: `r${db.requests.length}`, createdAt: new Date(), status: 'requested', ...data }; db.requests.push(r); return r; },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => { const r = db.requests.find(x => x.id === where.id)!; Object.assign(r, data); return r; },
      count: async ({ where }: { where: Record<string, unknown> }) => db.requests.filter(r => match(r, where)).length,
    },
  },
}));

import { creditReferral, referralCodeFor, referralStats, requestToJoin } from '@/lib/referrals';

const member = { id: 'm', userRole: 'operator', verificationStatus: 'Approved' };
const pending = { id: 'p', userRole: 'operator', verificationStatus: 'Pending' };
beforeEach(() => { db.users = [{ ...member }, { ...pending }]; db.requests = []; });

describe('referrals', () => {
  it('gives invite links only to verified members, and keeps the same code', async () => {
    expect(await referralCodeFor(pending)).toBeNull();
    const code = await referralCodeFor(member);
    expect(code).toMatch(/^[A-Za-z0-9_-]{4,20}$/);
    expect(await referralCodeFor(member)).toBe(code);
  });

  it('records a request through a valid link and credits the member when the account is created', async () => {
    const code = await referralCodeFor(member);
    const res = await requestToJoin(code, 'New.Person@Site.org');
    expect(res).toMatchObject({ ok: true, email: 'new.person@site.org', referrerId: 'm', alreadyRequested: false });
    expect((await requestToJoin(code, 'new.person@site.org')) as { alreadyRequested: boolean }).toMatchObject({ alreadyRequested: true });
    expect(await creditReferral('new.person@site.org')).toBe('m');
    expect(db.requests[0].status).toBe('joined');
    db.users.push({ id: 'n', referredById: 'm' });
    expect(await referralStats('m')).toEqual({ requested: 1, joined: 1 });
  });

  it('rejects bad links and bad emails', async () => {
    expect(await requestToJoin('nope!!', 'a@b.org')).toMatchObject({ ok: false, status: 404 });
    expect(await requestToJoin('abcdef', 'a@b.org')).toMatchObject({ ok: false, status: 404 });
    const code = await referralCodeFor(member);
    expect(await requestToJoin(code, 'not-an-email')).toMatchObject({ ok: false, status: 400 });
  });
});
