import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INVESTOR_COOKIE } from '@/lib/investor-auth';
import { logInvestorActivity, normalizeInvestorEmail, roomViewer } from '@/lib/investor-access';
import { DILIGENCE_CATEGORIES } from '@/lib/diligence';
import { checkWriteRateLimit } from '@/lib/write-rate-limit';
import { sendEmail } from '@/lib/mailer';
import { SITE_URL, SUPPORT_EMAIL } from '@/lib/site';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer' };
const back = (request: NextRequest, query: string) => NextResponse.redirect(new URL(`/investors/diligence?${query}`, request.url), { status: 303, headers });

/**
 * An investor in the data room asks for materials. Saved for the founder in /admin/requests,
 * with a notification to the BTP inbox. Nothing is sent to the investor.
 */
export async function POST(request: NextRequest) {
  const sameOrigin = request.headers.get('origin') === request.nextUrl.origin || request.headers.get('sec-fetch-site') === 'same-origin';
  if (!sameOrigin) return new NextResponse('Invalid request origin.', { status: 403, headers });
  const viewer = await roomViewer(request.cookies.get(INVESTOR_COOKIE)?.value);
  if (!viewer) return NextResponse.redirect(new URL('/investors', request.url), { status: 303, headers });
  const text = await request.text().catch(() => '');
  if (text.length > 6000) return new NextResponse('Request too large.', { status: 413, headers });
  const form = new URLSearchParams(text);
  const sections = form.getAll('section').filter((s) => (DILIGENCE_CATEGORIES as readonly string[]).includes(s));
  const note = (form.get('note') || '').trim().slice(0, 2000);
  if (!sections.length && !note) return back(request, 'error=empty#request');

  let name = '', email = '', company = '', investorId: string | null = null;
  if (viewer.kind === 'investor') {
    const investor = await prisma.investor.findUnique({ where: { id: viewer.id }, select: { id: true, email: true, name: true, company: true } }).catch(() => null);
    if (!investor) return NextResponse.redirect(new URL('/investors', request.url), { status: 303, headers });
    ({ name, company } = { name: investor.name || '', company: investor.company || '' });
    email = investor.email; investorId = investor.id;
  } else {
    email = normalizeInvestorEmail(form.get('email')) || '';
    name = (form.get('name') || '').trim().slice(0, 120);
    if (!email) return back(request, 'error=email#request');
  }

  try {
    const budget = await checkWriteRateLimit(`diligence-request-v1:${investorId ?? email}`, '/investors/diligence/request');
    if (!budget.allowed) return new NextResponse('Too many requests. Please try again shortly.', { status: 429, headers: { ...headers, 'Retry-After': String(budget.retryAfter) } });
    await prisma.diligenceRequest.create({ data: { investorId, name, email, company, sections: sections.join(', '), note } });
    await logInvestorActivity(viewer, 'diligence_request');
    await sendEmail(SUPPORT_EMAIL, 'BTP data room request',
      `${[name, company].filter(Boolean).join(', ') || email} (${email}) requested data room materials.\n\nSections: ${sections.join(', ') || 'None selected'}\n${note ? `\nNote:\n${note}\n` : ''}\nTrack it at ${SITE_URL}/admin/requests`);
    return back(request, 'requested=1#request');
  } catch {
    return back(request, 'error=unavailable#request');
  }
}
