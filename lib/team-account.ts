import { prisma } from '@/lib/prisma';

/** Handle shown on posts the BTP team publishes (starter questions, prompts). */
export const TEAM_HANDLE = 'BTP_Team';

/**
 * Returns the BTP team profile, creating it on first use. It has no Clerk
 * login: only admins can publish through it, via the admin starter page.
 */
export async function getOrCreateTeamUser() {
  const existing = await prisma.user.findUnique({ where: { handle: TEAM_HANDLE } });
  if (existing) {
    if (existing.clerkId) throw new Error(`The handle ${TEAM_HANDLE} belongs to a member account`);
    return existing;
  }
  return prisma.user.create({
    data: {
      handle: TEAM_HANDLE,
      userRole: 'operator',
      roleCategory: 'other',
      companyCategory: 'other',
      verificationStatus: 'Approved',
      verificationMethod: 'manual',
      verifiedAt: new Date(),
    },
  });
}
