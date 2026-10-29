import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/work-email';
import { isApprovedMember } from '@/lib/access-policy';

import { WAITLIST_ROLES } from '@/lib/waitlist-options';
export function parseWaitlist(body: Record<string, unknown>) {
  const email = normalizeEmail(body.email);
  const role = typeof body.role === 'string' && WAITLIST_ROLES.includes(body.role as typeof WAITLIST_ROLES[number]) ? body.role : null;
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const source = typeof body.source === 'string' && /^[a-zA-Z0-9_ -]{1,60}$/.test(body.source) ? body.source : 'direct';
  if (!email || !role || body.contactConsent !== true || (code && !/^[A-Za-z0-9_-]{4,20}$/.test(code))) return null;
  return { email, role, code, source, paidReviewInterest: body.paidReviewInterest === true };
}
export async function activeReferrer(code: string) {
  const member = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true, userRole: true, verificationStatus: true, isSuspended: true } });
  return member && isApprovedMember(member) ? member : null;
}
export function csvCell(value: unknown) {
  let text = value == null ? '' : String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
