import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { isApprovedMember, type MemberAccess } from '@/lib/access-policy';

const LINK_DAYS = 14;
export const hashVouchToken = (token: string) => createHash('sha256').update(`btp-vouch-v1:${token}`).digest('hex');

type Viewer = MemberAccess & { id: string };
export type VouchResult<T> = { ok: true; value: T } | { ok: false; status: number; error: string };
const fail = (status: number, error: string): { ok: false; status: number; error: string } => ({ ok: false, status, error });

/** Creates (or replaces) the applicant's vouch link. Returns the raw token, which is never stored. */
export async function createVouchRequest(user: { id: string; verificationStatus: string }, note: unknown): Promise<VouchResult<string>> {
  if (user.verificationStatus === 'Approved') return fail(400, 'Your membership is already verified.');
  const text = typeof note === 'string' ? note.trim() : '';
  if (text.length < 20 || text.length > 500) return fail(400, 'In 20 to 500 characters, say how you worked together so your colleague recognizes you.');
  const token = randomBytes(24).toString('base64url');
  await prisma.user.update({
    where: { id: user.id },
    data: { vouchTokenHash: hashVouchToken(token), vouchTokenExpires: new Date(Date.now() + LINK_DAYS * 86_400_000), vouchNote: text, vouchedById: null, vouchedAt: null },
  });
  return { ok: true, value: token };
}

async function findRequest(token: string) {
  if (!token || token.length < 20) return null;
  return prisma.user.findUnique({
    where: { vouchTokenHash: hashVouchToken(token) },
    select: { id: true, roleCategory: true, yearsExperience: true, vouchNote: true, vouchTokenExpires: true, verificationStatus: true },
  });
}

/** What a verified member sees before vouching: role, years and the applicant's note. Never a name or email. */
export async function viewVouchRequest(token: string, viewer: Viewer): Promise<VouchResult<{ role: string | null; years: number | null; note: string | null }>> {
  if (!isApprovedMember(viewer)) return fail(403, 'Only verified BTP members can vouch.');
  const req = await findRequest(token);
  if (!req || !req.vouchTokenExpires || req.vouchTokenExpires < new Date()) return fail(404, 'This vouch link has expired or was already used.');
  if (req.id === viewer.id) return fail(400, 'You cannot vouch for yourself.');
  return { ok: true, value: { role: req.roleCategory, years: req.yearsExperience, note: req.vouchNote } };
}

/** Records the vouch and retires the link so it cannot be used twice. */
export async function confirmVouch(token: string, viewer: Viewer, attested: unknown): Promise<VouchResult<{ applicantId: string }>> {
  if (attested !== true) return fail(400, 'Confirm that you have worked with this person.');
  const view = await viewVouchRequest(token, viewer);
  if (!view.ok) return view;
  const req = await findRequest(token);
  if (!req) return fail(404, 'This vouch link has expired or was already used.');
  await prisma.user.update({ where: { id: req.id }, data: { vouchedById: viewer.id, vouchedAt: new Date(), vouchTokenHash: null, vouchTokenExpires: null } });
  return { ok: true, value: { applicantId: req.id } };
}

export async function vouchStatus(userId: string): Promise<'none' | 'waiting' | 'vouched'> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { vouchedAt: true, vouchTokenHash: true, vouchTokenExpires: true } });
  if (u?.vouchedAt) return 'vouched';
  return u?.vouchTokenHash && u.vouchTokenExpires && u.vouchTokenExpires > new Date() ? 'waiting' : 'none';
}
