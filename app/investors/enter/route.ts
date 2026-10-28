import { NextRequest, NextResponse } from 'next/server';
import { INVESTOR_COOKIE, investorConfig, SESSION_SECONDS } from '@/lib/investor-auth';
import { createPersonSession, investorForLink } from '@/lib/investor-access';
import { recordTraffic } from '@/lib/traffic';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer' };

/** Opens the room from a personal link. The link identifies one approved investor. */
export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV === 'preview' || !investorConfig()) return new NextResponse('Investor access is not available on this deployment.', { status: 503, headers });
  const investor = await investorForLink(request.nextUrl.searchParams.get('token')).catch(() => null);
  if (!investor) return NextResponse.redirect(new URL('/investors?error=link', request.url), { status: 303, headers });
  await recordTraffic('investor_room_login', request.headers, '/investors');
  const response = NextResponse.redirect(new URL('/investors', request.url), { status: 303, headers });
  // Lax so the cookie is kept when the link is opened from an email app.
  response.cookies.set(INVESTOR_COOKIE, createPersonSession(investor.id), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/investors', maxAge: SESSION_SECONDS });
  return response;
}
