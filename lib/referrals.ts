import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { isApprovedMember, type MemberAccess } from '@/lib/access-policy';
import { normalizeEmail } from '@/lib/work-email';

const DAILY_LIMIT_PER_LINK = 20;

/** Returns the member's invite code, creating one the first time. Only verified members get one. */
export async function referralCodeFor(user: MemberAccess & { id: string }): Promise<string | null> {
  if (!isApprovedMember(user)) return null;
  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { referralCode: true } });
  if (current?.referralCode) return current.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomBytes(5).toString('base64url');
    try {
      await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } });
      return code;
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2002') throw error;
    }
  }
  return null;
}

export async function referralStats(userId: string) {
  const [requested, joined] = await Promise.all([
    prisma.accessRequest.count({ where: { referrerId: userId } }),
    prisma.user.count({ where: { referredById: userId } }),
  ]);
  return { requested, joined };
}

export type JoinResult = { ok: true; email: string; referrerId: string; alreadyRequested: boolean } | { ok: false; status: number; error: string };

/** Records a request to join through a member's link. The invitation itself is sent by the caller. */
export async function requestToJoin(code: unknown, emailInput: unknown): Promise<JoinResult> {
  const email = normalizeEmail(emailInput);
  if (!email) return { ok: false, status: 400, error: 'Enter a valid email address.' };
  if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{4,20}$/.test(code)) return { ok: false, status: 404, error: 'This invite link is not valid.' };
  const referrer = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true, userRole: true, verificationStatus: true, isSuspended: true } });
  if (!referrer || !isApprovedMember(referrer)) return { ok: false, status: 404, error: 'This invite link is no longer active.' };
  const since = new Date(Date.now() - 86_400_000);
  if (await prisma.accessRequest.count({ where: { referrerId: referrer.id, createdAt: { gte: since } } }) >= DAILY_LIMIT_PER_LINK) {
    return { ok: false, status: 429, error: 'This invite link has reached today’s limit. Try again tomorrow.' };
  }
  const existing = await prisma.accessRequest.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { ok: true, email, referrerId: referrer.id, alreadyRequested: true };
  if (await prisma.user.findFirst({ where: { email }, select: { id: true } })) return { ok: true, email, referrerId: referrer.id, alreadyRequested: true };
  await prisma.accessRequest.create({ data: { email, referrerId: referrer.id } });
  return { ok: true, email, referrerId: referrer.id, alreadyRequested: false };
}

/** Called when a new account is created: credits the member whose link the person used. */
export async function creditReferral(email: string | null): Promise<string | null> {
  if (!email) return null;
  try {
    const req = await prisma.accessRequest.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, referrerId: true } });
    if (!req) return null;
    await prisma.accessRequest.update({ where: { id: req.id }, data: { status: 'joined', joinedAt: new Date() } });
    return req.referrerId;
  } catch {
    return null;
  }
}
