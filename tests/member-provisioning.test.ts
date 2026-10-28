import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ users: [] as Array<Record<string, unknown>> }));

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: async () => ({ users: { getUser: async () => ({ primaryEmailAddressId: 'e1', emailAddresses: [{ id: 'e1', emailAddress: 'tester@example.com' }] }) } }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: async ({ where }: { where: { clerkId: string } }) => db.users.find(u => u.clerkId === where.clerkId) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => { const u = { id: `u${db.users.length + 1}`, ...data }; db.users.push(u); return u; },
    },
  },
}));

import { ensureMemberRecord, onboardingComplete } from '@/lib/member-provisioning';

beforeEach(() => { db.users = []; });

describe('member provisioning', () => {
  it('creates a pending, unapproved record with the Clerk email on first contact', async () => {
    const u = await ensureMemberRecord('clerk_1');
    expect(u).toMatchObject({ clerkId: 'clerk_1', verificationStatus: 'Pending', roleCategory: 'unspecified', email: 'tester@example.com' });
    expect(String(u.handle)).toMatch(/^[a-z]+-[a-z]+(-\d{2})?$/);
  });

  it('returns the existing record instead of creating a duplicate', async () => {
    const first = await ensureMemberRecord('clerk_1');
    const second = await ensureMemberRecord('clerk_1');
    expect(second.id).toBe(first.id);
    expect(db.users).toHaveLength(1);
  });

  it('treats provisioned accounts as not yet onboarded', () => {
    expect(onboardingComplete({ userRole: 'operator', handle: 'member-abc123', roleCategory: 'unspecified' })).toBe(false);
    expect(onboardingComplete({ userRole: 'operator', handle: 'siteops', roleCategory: 'CRC' })).toBe(true);
  });
});
