import { acquisitionConversion } from '@/lib/acquisition-server';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { activeReferrer } from '@/lib/waitlist';
import { FOUNDER_WAITLIST_ROLE } from '@/lib/waitlist-options';
import { parseSignup } from '@/lib/signup';
import { checkWriteRateLimit } from '@/lib/write-rate-limit';
import { growthEnabled } from '@/lib/waitlist-growth';
import { growthSignup } from '@/lib/waitlist-growth-signup';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Please submit from the BTP website.' }, { status: 403, headers });
  const text = await req.text();
  if (text.length > 8192) return NextResponse.json({ error: 'Form too large.' }, { status: 413, headers });
  let body; try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Please check the form.' }, { status: 400, headers }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Please check the form.' }, { status: 400, headers });
  if (body.website) return NextResponse.json({ success: true }, { headers });
  const data = parseSignup(body);
  if (data && data.audience !== 'professional' && data.code.startsWith('wl_')) data.code='';
  if (!data) return NextResponse.json({ error: 'Complete the required details and agree to be contacted.' }, { status: 400, headers });
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const key = createHash('sha256').update('signup:' + ip).digest('hex');
    const budget = await checkWriteRateLimit(key, '/api/interest');
    if (!budget.allowed) return NextResponse.json({ error: 'Please try again in a minute.' }, { status: 429, headers: { ...headers, 'Retry-After': String(budget.retryAfter) } });
    if(growthEnabled() && data.audience==='professional')return await growthSignup(req,data);
    const referrer = data.code ? await activeReferrer(data.code) : null;
    if (data.code && !referrer) return NextResponse.json({ error: 'This referral link is no longer active. Join directly at /join instead.' }, { status: 400, headers });
    const submittedAt = new Date();
    const saved = await prisma.$transaction(async tx => {
      let createdAt: Date | undefined;
      let recordKey: string;
      if (data.audience === 'professional') {
        const old = await tx.accessRequest.findUnique({ where: { email: data.email } });
        // Preserve a legacy founder request before allowing the same person to join as an operator.
        if (old?.role === FOUNDER_WAITLIST_ROLE) {
          await tx.companyInquiry.upsert({ where: { id: 'legacy-' + old.id }, update: {}, create: {
            id: 'legacy-' + old.id, email: old.email, name: '', company: '', website: '', product: 'Product review interest (earlier waiting list)', goals: '', access: 'not_yet', source: old.source, createdAt: old.createdAt,
          } });
          await tx.accessRequest.update({ where: { id: old.id }, data: { role: data.role, paidReviewInterest: data.paidReviewInterest, source: referrer ? 'member referral' : data.source, referrerId: referrer?.id ?? null, status: 'requested', professionalVerifiedAt: null, professionalVerifiedBy: null, verificationNote: null, invitedAt: null, joinedAt: null } });
          recordKey = 'professional:' + old.id;
        } else {
          const row = await tx.accessRequest.upsert({ where: { email: data.email }, update: {}, create: { email: data.email, role: data.role, paidReviewInterest: data.paidReviewInterest, source: referrer ? 'member referral' : data.source, referrerId: referrer?.id ?? null } });
          recordKey = 'professional:' + row.id; createdAt = row.createdAt;
        }
      } else if (data.audience === 'founder') {
        // Identical retries are idempotent; a different product/request remains a separate inquiry.
        const id = 'signup-' + createHash('sha256').update(JSON.stringify([data.email, data.company, data.request])).digest('hex');
        const row = await tx.companyInquiry.upsert({ where: { id }, update: {}, create: { id, name: data.name, email: data.email, company: data.company, website: '', product: data.request, goals: '', access: 'not_yet', source: data.source } });
        recordKey = 'founder:' + row.id; createdAt = row.createdAt;
      } else {
        const row = await tx.investor.upsert({ where: { email: data.email }, update: {}, create: { email: data.email, name: data.name, company: data.company || null, status: 'pending' } });
        recordKey = 'investor:' + row.id; createdAt = row.createdAt;
      }
      await tx.requestFollowUp.upsert({ where: { key: recordKey }, update: {}, create: { key: recordKey, source: data.source, referrerId: referrer?.id ?? null } });
      return { key: recordKey, isNew: !!createdAt && createdAt >= submittedAt };
    });
    const conversion = saved.isNew && await acquisitionConversion(data.audience === 'professional' ? 'community_signup' : data.audience === 'founder' ? 'founder_request' : 'investor_request', saved.key, req.headers, data.attribution);
    return NextResponse.json({ success: true, conversion }, { headers });
  } catch { return NextResponse.json({ error: 'We could not save your request. Your details are still here. Please try again.' }, { status: 503, headers }); }
}
