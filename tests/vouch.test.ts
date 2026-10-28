import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ users: [] as Array<Record<string, unknown>> }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: async ({ where }: { where: Record<string, unknown> }) => {
        const [key, value] = Object.entries(where)[0];
        return db.users.find(u => u[key] === value) ?? null;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const u = db.users.find(x => x.id === where.id)!; Object.assign(u, data); return u;
      },
    },
  },
}));

import { confirmVouch, createVouchRequest, viewVouchRequest, vouchStatus } from '@/lib/vouch';

const applicant = { id: 'a', verificationStatus: 'Pending', userRole: 'operator', roleCategory: 'CRC', yearsExperience: 20 };
const member = { id: 'm', verificationStatus: 'Approved', userRole: 'operator' };
const pending = { id: 'p', verificationStatus: 'Pending', userRole: 'operator' };
const note = 'We ran oncology trials on the same site team for four years.';

beforeEach(() => { db.users = [{ ...applicant }, { ...member }, { ...pending }]; });

describe('vouching', () => {
  it('requires a meaningful note', async () => {
    expect((await createVouchRequest(applicant, 'hi')).ok).toBe(false);
  });

  it('lets a verified member see role, years and note, then vouch once', async () => {
    const created = await createVouchRequest(applicant, note);
    if (!created.ok) throw new Error('not created');
    expect(await vouchStatus('a')).toBe('waiting');
    const view = await viewVouchRequest(created.value, member);
    expect(view).toEqual({ ok: true, value: { role: 'CRC', years: 20, note } });
    expect((await confirmVouch(created.value, member, true)).ok).toBe(true);
    expect(await vouchStatus('a')).toBe('vouched');
    expect(db.users[0]).toMatchObject({ vouchedById: 'm', vouchTokenHash: null });
    expect((await confirmVouch(created.value, member, true)).ok).toBe(false);
  });

  it('refuses unverified vouchers, self-vouching and missing attestation', async () => {
    const created = await createVouchRequest(applicant, note);
    if (!created.ok) throw new Error('not created');
    expect(await viewVouchRequest(created.value, pending)).toMatchObject({ ok: false, status: 403 });
    expect(await viewVouchRequest(created.value, { ...applicant, verificationStatus: 'Approved' })).toMatchObject({ ok: false, status: 400 });
    expect(await confirmVouch(created.value, member, false)).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects expired links', async () => {
    const created = await createVouchRequest(applicant, note);
    if (!created.ok) throw new Error('not created');
    db.users[0].vouchTokenExpires = new Date(Date.now() - 1000);
    expect(await viewVouchRequest(created.value, member)).toMatchObject({ ok: false, status: 404 });
  });
});
