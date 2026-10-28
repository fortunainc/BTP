import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { investorConfig } from '@/lib/investor-auth';
import { EMAIL_LINK_MINUTES, issueInvestorLink, normalizeInvestorEmail } from '@/lib/investor-access';
import { checkWriteRateLimit } from '@/lib/write-rate-limit';
import { sendEmail } from '@/lib/mailer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer' };

/**
 * An investor enters their email. Approved investors get a sign-in link by email.
 * Everyone else is saved as a request for the founder to approve. The page shows the same message either way.
 */
export async function POST(request: NextRequest) {
  const sameOrigin = request.headers.get('origin') === request.nextUrl.origin || request.headers.get('sec-fetch-site') === 'same-origin';
  if (!sameOrigin) return new NextResponse('Invalid request origin.', { status: 403, headers });
  if (process.env.VERCEL_ENV === 'preview' || !investorConfig()) return new NextResponse('Investor access is not available on this deployment.', { status: 503, headers });
  const text = await request.text().catch(() => '');
  if (text.length > 2048) return new NextResponse('Form too large.', { status: 413, headers });
  const form = new URLSearchParams(text);
  const email = normalizeInvestorEmail(form.get('email'));
  if (!email) return NextResponse.redirect(new URL('/investors?error=email', request.url), { status: 303, headers });
  const nameAndFirm = (form.get('name') || '').trim().slice(0, 120) || null;
  try {
    const budget = await checkWriteRateLimit('investor-room-email-v1', '/investors/request');
    if (!budget.allowed) return new NextResponse('Too many requests. Please try again shortly.', { status: 429, headers: { ...headers, 'Retry-After': String(budget.retryAfter) } });
    const existing = await prisma.investor.findUnique({ where: { email } });
    if (existing?.status === 'approved') {
      const token = await issueInvestorLink(existing.id, EMAIL_LINK_MINUTES);
      const link = `${request.nextUrl.origin}/investors/enter?token=${token}`;
      await sendEmail(email, 'Your BTP investor room link',
        `Here is your private link to the BTP investor room and data room:\n\n${link}\n\nIt works for ${EMAIL_LINK_MINUTES} minutes. Please do not forward it.\n\nBehind the Protocol`);
    } else if (!existing) {
      const [name, company] = nameAndFirm?.includes(',') ? nameAndFirm.split(',').map((s) => s.trim()) : [nameAndFirm, null];
      await prisma.investor.create({ data: { email, name: name || null, company: company || null } });
    }
    return NextResponse.redirect(new URL('/investors?sent=1', request.url), { status: 303, headers });
  } catch {
    return new NextResponse('Access is temporarily unavailable. Please try again later.', { status: 503, headers });
  }
}
