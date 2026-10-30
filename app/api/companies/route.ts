import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { parseCompanyInquiry } from '@/lib/company-inquiry';
import { checkWriteRateLimit } from '@/lib/write-rate-limit';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
const SAVE_ERROR = 'We could not send your inquiry just now. Your answers are still here. Please try again in a moment, or contact BTP through the Support page.';
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Please submit from the BTP website.' }, { status: 403, headers });
  const raw = await req.text();
  if (raw.length > 8192) return NextResponse.json({ error: 'Your answers are too long. Please shorten them and try again.' }, { status: 413, headers });
  let body; try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Please check the form.' }, { status: 400, headers }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Please check the form.' }, { status: 400, headers });
  if (body.fax) return NextResponse.json({ success: true }, { headers }); // hidden trap field
  const parsed = parseCompanyInquiry(body);
  if (!parsed.ok) return NextResponse.json({ error: 'Please check the highlighted fields. Your answers are still here.', fields: parsed.errors }, { status: 400, headers });
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const budget = await checkWriteRateLimit(createHash('sha256').update('company-inquiry:' + ip).digest('hex'), '/api/companies');
    if (!budget.allowed) return NextResponse.json({ error: 'Please wait a minute and try again. Your answers are still here.' }, { status: 429, headers: { ...headers, 'Retry-After': String(budget.retryAfter) } });
    await prisma.companyInquiry.create({ data: parsed.data });
    return NextResponse.json({ success: true }, { headers });
  } catch { return NextResponse.json({ error: SAVE_ERROR }, { status: 503, headers }); }
}
