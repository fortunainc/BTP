import { NextRequest, NextResponse } from 'next/server';
import { INVESTOR_COOKIE } from '@/lib/investor-auth';
export async function POST(request: NextRequest) {
  const headers = {'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow'};
  if (request.headers.get('origin') !== request.nextUrl.origin) return new NextResponse('Invalid request origin.', {status:403, headers});
  const response = NextResponse.redirect(new URL('/investors', request.url), { status:303, headers });
  response.cookies.set(INVESTOR_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV === 'production',sameSite:'strict',path:'/investors',maxAge:0});
  return response;
}
