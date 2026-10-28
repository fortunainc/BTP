import { NextRequest, NextResponse } from 'next/server';
import { createInvestorSession, INVESTOR_COOKIE, investorConfig, SESSION_SECONDS, verifyInvestorPassword } from '@/lib/investor-auth';
import { checkWriteRateLimit } from '@/lib/write-rate-limit';
import { recordTraffic } from '@/lib/traffic';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer' };
export async function POST(request: NextRequest) {
  // Same-site check. Browsers send `Origin: null` when the page's referrer policy hides it,
  // so also accept the browser-set Sec-Fetch-Site header, which cannot be forged by a page.
  const origin = request.headers.get('origin');
  const sameOrigin = origin === request.nextUrl.origin || request.headers.get('sec-fetch-site') === 'same-origin';
  if (!sameOrigin) return new NextResponse('Invalid request origin.', { status: 403, headers });
  if (process.env.VERCEL_ENV === 'preview' || !investorConfig()) return new NextResponse('Investor access is not available on this deployment.', { status: 503, headers });
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return new NextResponse('Unsupported form.', { status: 415, headers });
  // Read a bounded body even when the client omits or forges Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return new NextResponse('Invalid form.', { status: 400, headers });
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const {done, value} = await reader.read(); if (done) break; size += value.length; if (size > 2048) { await reader.cancel(); return new NextResponse('Form too large.', {status:413, headers}); } chunks.push(value); }
  try {
    // One fixed shared bucket prevents distributed guessing without persisting visitor IPs.
    const budget = await checkWriteRateLimit('investor-room-global-login-v1', '/investors/access');
    if (!budget.allowed) return new NextResponse('Too many attempts. Please try again shortly.', {status:429, headers:{...headers,'Retry-After':String(budget.retryAfter)}});
    const password = new URLSearchParams(Buffer.concat(chunks).toString('utf8')).get('password') || '';
    if (!verifyInvestorPassword(password)) { await recordTraffic('investor_room_failed', request.headers, '/investors'); return NextResponse.redirect(new URL('/investors?error=access', request.url), { status:303, headers }); }
    await recordTraffic('investor_room_login', request.headers, '/investors');
    const response = NextResponse.redirect(new URL('/investors', request.url), { status:303, headers });
    response.cookies.set(INVESTOR_COOKIE, createInvestorSession(), { httpOnly:true, secure:process.env.NODE_ENV === 'production', sameSite:'strict', path:'/investors', maxAge:SESSION_SECONDS });
    return response;
  } catch {
    return new NextResponse('Access is temporarily unavailable. Please try again later.', {status:503, headers});
  }
}
