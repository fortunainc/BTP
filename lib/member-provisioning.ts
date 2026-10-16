import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';

/** Placeholder role category for accounts that have signed in but not finished onboarding. */
export const UNSPECIFIED_ROLE = 'unspecified';

const memberSelect = {
  id: true,
  clerkId: true,
  handle: true,
  userRole: true,
  roleCategory: true,
  companyCategory: true,
  verificationStatus: true,
  isSuspended: true,
  trustScore: true,
} as const;

async function primaryEmail(clerkId: string): Promise<string | null> {
  try {
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const u = await client.users.getUser(clerkId);
    const primary = u.emailAddresses.find(e => e.id === u.primaryEmailAddressId) ?? u.emailAddresses[0];
    return primary?.emailAddress ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the member record for a signed-in Clerk user, creating a pending,
 * unapproved record on first contact. Creation grants no community access:
 * approval remains a separate admin step.
 */
export async function ensureMemberRecord(clerkId: string) {
  const existing = await prisma.user.findUnique({ where: { clerkId }, select: memberSelect });
  if (existing) return existing;

  const email = await primaryEmail(clerkId);
  for (let attempt = 0; attempt < 5; attempt++) {
    const handle = `member-${randomBytes(3).toString('hex')}`;
    try {
      return await prisma.user.create({
        data: {
          clerkId,
          handle,
          email,
          userRole: 'operator',
          roleCategory: UNSPECIFIED_ROLE,
          companyCategory: 'other',
          verificationStatus: 'Pending',
          trustVector: { create: {} },
        },
        select: memberSelect,
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== 'P2002') throw error;
      // Concurrent first request created the record, or the handle collided.
      const raced = await prisma.user.findUnique({ where: { clerkId }, select: memberSelect });
      if (raced) return raced;
    }
  }
  throw new Error('Could not provision member record');
}

export function onboardingComplete(user: { userRole?: string | null; handle?: string | null; roleCategory?: string | null }) {
  return Boolean(user.userRole && user.handle && user.roleCategory && user.roleCategory !== UNSPECIFIED_ROLE);
}
