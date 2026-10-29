import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { activeReferrer, parseWaitlist } from '@/lib/waitlist';
import { checkWriteRateLimit } from '@/lib/write-rate-limit';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Please submit from the BTP website.' }, { status: 403, headers });
  const text = await req.text();
  if (text.length > 4096) return NextResponse.json({ error: 'Form too large.' }, { status: 413, headers });
  let body; try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Please check the form.' }, { status: 400, headers }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Please check the form.' }, { status: 400, headers });
  if (body.website) return NextResponse.json({ success: true }, { headers });
  const data = parseWaitlist(body);
  if (!data) return NextResponse.json({ error: 'Enter your email, choose your role, and agree to access updates.' }, { status: 400, headers });
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const key = createHash('sha256').update('waitlist:' + ip).digest('hex');
    const budget = await checkWriteRateLimit(key, '/api/join');
    if (!budget.allowed) return NextResponse.json({ error: 'Please try again in a minute.' }, { status: 429, headers: { ...headers, 'Retry-After': String(budget.retryAfter) } });
    const referrer = data.code ? await activeReferrer(data.code) : null;
    if (data.code && !referrer) return NextResponse.json({ error: 'This referral link is not active. You can join directly at /join for professional verification.' }, { status: 400, headers });
    // First submission wins. A public repeat request cannot overwrite another person's consent or referral.
    await prisma.accessRequest.upsert({ where: { email: data.email }, update: {}, create: {
      email: data.email, role: data.role, paidReviewInterest: data.paidReviewInterest,
      source: referrer ? 'member referral' : data.source, referrerId: referrer?.id ?? null,
    } });
    return NextResponse.json({ success: true }, { headers });
  } catch { return NextResponse.json({ error: 'We could not save your request. Please try again.' }, { status: 503, headers }); }
}
