// Shared with the client dashboard. Keep server-only imports out of this module.
function normalizeEmail(v: unknown) {
 if (typeof v !== 'string') return null;
 const e = v.trim().toLowerCase();
 return /^[^\s@]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/.test(e) && e.length <= 254 ? e : null;
}
import { WAITLIST_ROLES } from '@/lib/waitlist-options';
export const FOLLOW_UP_STATUSES = ['new', 'contacted', 'in_discussion', 'closed'] as const;
export type Audience = 'professional' | 'founder' | 'investor';
export function parseSignup(body: Record<string, unknown>) {
  const audience = body.audience;
  const email = normalizeEmail(body.email);
  const clean = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';
  const name = clean(body.name, 120), company = clean(body.company, 160), request = clean(body.request, 1200);
  const role = clean(body.role, 120), code = clean(body.code, 20);
  if (!['professional', 'founder', 'investor'].includes(String(audience)) || !email || body.contactConsent !== true) return null;
  if (audience === 'professional' && !WAITLIST_ROLES.includes(role as typeof WAITLIST_ROLES[number])) return null;
  if (audience !== 'professional' && !name) return null;
  if (audience === 'founder' && (!company || !request)) return null;
  if (code && !/^[A-Za-z0-9_-]{4,20}$/.test(code)) return null;
  const source = typeof body.source === 'string' && /^[a-zA-Z0-9_ -]{1,60}$/.test(body.source) ? body.source : 'direct';
  return { audience: audience as Audience, email, name, company, request, role, code, source, paidReviewInterest: audience === 'professional' && body.paidReviewInterest === true };
}
