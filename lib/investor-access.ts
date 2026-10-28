import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { investorConfig, SESSION_SECONDS, validInvestorSession } from '@/lib/investor-auth';

export const EMAIL_LINK_MINUTES = 30;
export const SHARED_LINK_DAYS = 7;

export function normalizeInvestorEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

const hashToken = (token: string) => createHash('sha256').update(`btp-investor-link-v1:${token}`).digest('hex');

/** Issues a fresh sign-in link token for an approved investor. Replaces any earlier link. */
export async function issueInvestorLink(investorId: string, minutes: number): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await prisma.investor.update({ where: { id: investorId }, data: { tokenHash: hashToken(token), tokenExpires: new Date(Date.now() + minutes * 60_000) } });
  return token;
}

/** Returns the approved investor a link belongs to, or null. Links stay valid until they expire so email scanners cannot burn them. */
export async function investorForLink(token: string | null) {
  if (!token || token.length > 100) return null;
  const investor = await prisma.investor.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!investor || investor.status !== 'approved' || !investor.tokenExpires || investor.tokenExpires < new Date()) return null;
  return investor;
}

function sign(payload: string, secret: Buffer) {
  return createHmac('sha256', secret).update(`btp-investor-person-v1:${payload}`).digest('base64url');
}

/** Session cookie naming one investor: inv1.<expiry>.<investorId>.<signature>. */
export function createPersonSession(investorId: string, now = Date.now()) {
  const config = investorConfig();
  if (!config) throw new Error('Investor access is not configured');
  const payload = `inv1.${Math.floor(now / 1000) + SESSION_SECONDS}.${investorId}`;
  return `${payload}.${sign(payload, config.secret)}`;
}

export function personFromSession(token?: string, now = Date.now()): string | null {
  const config = investorConfig();
  if (!config || !token || token.length > 200) return null;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'inv1' || !/^\d{10}$/.test(parts[1]) || !/^[a-z0-9]{10,40}$/.test(parts[2])) return null;
  const remaining = Number(parts[1]) - Math.floor(now / 1000);
  if (remaining <= 0 || remaining > SESSION_SECONDS) return null;
  const expected = Buffer.from(sign(parts.slice(0, 3).join('.'), config.secret));
  const received = Buffer.from(parts[3]);
  return expected.length === received.length && timingSafeEqual(expected, received) ? parts[2] : null;
}

export type RoomViewer = { kind: 'investor'; id: string; name: string | null; company: string | null } | { kind: 'shared' };

/** Who is viewing the room: an approved investor (checked live, so revoking is immediate) or the legacy shared password. */
export async function roomViewer(token?: string): Promise<RoomViewer | null> {
  if (process.env.VERCEL_ENV === 'preview') return null;
  const id = personFromSession(token);
  if (id) {
    const investor = await prisma.investor.findUnique({ where: { id }, select: { id: true, status: true, name: true, company: true } }).catch(() => null);
    return investor?.status === 'approved' ? { kind: 'investor', id: investor.id, name: investor.name, company: investor.company } : null;
  }
  return validInvestorSession(token) ? { kind: 'shared' } : null;
}

/** Records what an investor opened. Never throws. */
export async function logInvestorActivity(viewer: RoomViewer, action: 'room' | 'data_room' | 'download', docId?: string) {
  if (viewer.kind !== 'investor') return;
  try {
    await prisma.$transaction([
      prisma.investorActivity.create({ data: { investorId: viewer.id, action, docId: docId ?? null } }),
      prisma.investor.update({ where: { id: viewer.id }, data: { lastSeenAt: new Date(), ...(action === 'room' ? { visits: { increment: 1 } } : {}) } }),
    ]);
  } catch (error) {
    console.error('Investor activity failed', error instanceof Error ? error.name : 'unknown');
  }
}
