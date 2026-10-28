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
vi.mock('@/lib/audit-logging', () => ({ logAuditEvent: async () => undefined, AuditEventType: { USER_UPDATED: 'USER_UPDATED' } }));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/user/work-email/confirm/route';
import { hashEmail, hashToken, isWorkEmail, normalizeEmail, newToken } from '@/lib/work-email';

beforeEach(() => { db.users = []; });

describe('work email', () => {
  it('accepts work domains and refuses personal ones', () => {
    expect(isWorkEmail('crc@cancercenter.org')).toBe(true);
    expect(isWorkEmail('me@gmail.com')).toBe(false);
    expect(normalizeEmail('  CRC@Site.ORG ')).toBe('crc@site.org');
    expect(normalizeEmail('not-an-email')).toBeNull();
  });

  it('confirms through the one-click link and keeps only a hash', async () => {
    const token = newToken();
    db.users.push({ id: 'u1', workEmailPending: 'crc@site.org', workEmailTokenHash: hashToken(token), workEmailTokenExpires: new Date(Date.now() + 60_000) });
    const res = await GET(new NextRequest(`https://btp.test/api/user/work-email/confirm?token=${token}`));
    expect(res.headers.get('location')).toBe('https://btp.test/onboarding?email=confirmed');
    expect(db.users[0]).toMatchObject({ workEmailHash: hashEmail('crc@site.org'), workEmailTokenHash: null });
    expect(db.users[0].workEmailVerifiedAt).toBeInstanceOf(Date);
  });

  it('rejects expired or unknown links', async () => {
    const token = newToken();
    db.users.push({ id: 'u1', workEmailPending: 'crc@site.org', workEmailTokenHash: hashToken(token), workEmailTokenExpires: new Date(Date.now() - 1) });
    expect((await GET(new NextRequest(`https://btp.test/api/user/work-email/confirm?token=${token}`))).headers.get('location')).toContain('email=expired');
    expect((await GET(new NextRequest('https://btp.test/api/user/work-email/confirm?token=short'))).headers.get('location')).toContain('email=invalid');
  });
});
