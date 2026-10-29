// Shared by the browser form and the API, so it must stay free of server only imports.
const normalizeEmail = (v: unknown) => {
  if (typeof v !== 'string') return null;
  const e = v.trim().toLowerCase();
  return /^[^\s@]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/.test(e) && e.length <= 254 ? e : null;
};

export const INQUIRY_ACCESS = [
  ['demo', 'A demo or sandbox account we can share'],
  ['prototype', 'A usable prototype'],
  ['walkthrough', 'A walkthrough or screen recording only'],
  ['not_yet', 'Not yet'],
] as const;
export const INQUIRY_STATUS = ['new', 'in_discussion', 'closed'] as const;
const ACCESS_KEYS: readonly string[] = INQUIRY_ACCESS.map(([k]) => k);

const text = (v: unknown, min: number, max: number) => {
  if (typeof v !== 'string') return null;
  const t = v.replace(/\s+/g, ' ').trim();
  return t.length >= min && t.length <= max ? t : null;
};
export function normalizeWebsite(v: unknown) {
  const t = text(v, 4, 200);
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.') || /\s/.test(u.hostname)) return null;
    return u.origin + (u.pathname === '/' ? '' : u.pathname);
  } catch { return null; }
}
export type InquiryErrors = Partial<Record<'name' | 'email' | 'company' | 'website' | 'product' | 'goals' | 'access', string>>;
export function parseCompanyInquiry(body: Record<string, unknown>) {
  const errors: InquiryErrors = {};
  const name = text(body.name, 2, 120); if (!name) errors.name = 'Enter your name.';
  const email = normalizeEmail(body.email); if (!email) errors.email = 'Enter a valid work email.';
  const company = text(body.company, 2, 160); if (!company) errors.company = 'Enter your company name.';
  const website = normalizeWebsite(body.website); if (!website) errors.website = 'Enter your company website, for example example.com.';
  const product = text(body.product, 10, 1200); if (!product) errors.product = 'Briefly describe the product and who uses it (at least 10 characters).';
  const goals = text(body.goals, 10, 1200); if (!goals) errors.goals = 'Tell us what you want to learn or improve (at least 10 characters).';
  const access = typeof body.access === 'string' && ACCESS_KEYS.includes(body.access) ? body.access : null; if (!access) errors.access = 'Choose what you can share.';
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return { ok: true as const, data: { name: name!, email: email!, company: company!, website: website!, product: product!, goals: goals!, access: access! } };
}
