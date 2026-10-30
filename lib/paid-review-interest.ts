import { prisma } from '@/lib/prisma';
import { verifiedRoleLabel } from '@/lib/role-label';
import { normalizeEmail } from '@/lib/work-email';
import { UNSPECIFIED_ROLE } from '@/lib/member-provisioning';

/**
 * Paid review interest for a signed-in member. Stored on AccessRequest (keyed
 * by email) so admins see it in the existing waitlist view. Writing it never
 * sends email, notifies admins, credits referrals, or touches approval state.
 */

export type PaidReviewInterest = { interested: boolean; roleLabel: string | null; yearsExperience: number | null };

export const MEMBER_PROFILE_SOURCE = 'member profile';

async function clerkPrimaryEmail(clerkId: string | null | undefined): Promise<string | null> {
  if (!clerkId) return null;
  try {
    const { clerkClient } = await import('@clerk/nextjs/server');
    const u = await (await clerkClient()).users.getUser(clerkId);
    return (u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId) ?? u.emailAddresses[0])?.emailAddress ?? null;
  } catch {
    return null;
  }
}

async function memberProfile(userId: string) {
  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, clerkId: true, roleCategory: true, yearsExperience: true },
  });
  if (!member) return null;
  const email = normalizeEmail(member.email) ?? normalizeEmail(await clerkPrimaryEmail(member.clerkId));
  const roleLabel = member.roleCategory && member.roleCategory !== UNSPECIFIED_ROLE ? verifiedRoleLabel(member.roleCategory) : null;
  return { email, roleLabel, yearsExperience: member.yearsExperience ?? null };
}

function findRequest(email: string) {
  return prisma.accessRequest.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, paidReviewInterest: true },
  });
}

export async function getPaidReviewInterest(userId: string): Promise<PaidReviewInterest> {
  const profile = await memberProfile(userId);
  if (!profile) return { interested: false, roleLabel: null, yearsExperience: null };
  const row = profile.email ? await findRequest(profile.email) : null;
  return { interested: Boolean(row?.paidReviewInterest), roleLabel: profile.roleLabel, yearsExperience: profile.yearsExperience };
}

export type SetInterestResult = { ok: true; value: PaidReviewInterest } | { ok: false; status: number; error: string };

export async function setPaidReviewInterest(userId: string, interested: boolean): Promise<SetInterestResult> {
  const profile = await memberProfile(userId);
  if (!profile) return { ok: false, status: 404, error: 'Member not found' };
  if (!profile.email) return { ok: false, status: 409, error: 'We could not find an email on your account. Contact BTP to update your interest.' };
  const value = { interested, roleLabel: profile.roleLabel, yearsExperience: profile.yearsExperience };

  const existing = await findRequest(profile.email);
  if (existing) {
    // Only the interest flag changes. Status, referrer, invitation and verification fields are untouched.
    await prisma.accessRequest.update({ where: { id: existing.id }, data: { paidReviewInterest: interested } });
    return { ok: true, value };
  }
  try {
    await prisma.accessRequest.create({
      data: {
        email: profile.email,
        role: profile.roleLabel,
        paidReviewInterest: interested,
        source: MEMBER_PROFILE_SOURCE,
        status: 'joined',
        joinedAt: new Date(),
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code !== 'P2002') throw error;
    // A concurrent request created the row first; apply the flag to it.
    const raced = await findRequest(profile.email);
    if (!raced) throw error;
    await prisma.accessRequest.update({ where: { id: raced.id }, data: { paidReviewInterest: interested } });
  }
  return { ok: true, value };
}
