import { NextRequest, NextResponse } from 'next/server';
import { recordTraffic } from '@/lib/traffic';

export const runtime = 'nodejs';
const TRACKED = new Set(['/', '/companies', '/join', '/privacy', '/support']);

/** Cookie-free page-view beacon for public pages. */
export async function POST(req: NextRequest) {
  if(req.headers.get('origin') !== req.nextUrl.origin)return new NextResponse(null,{status:403});
  const raw=await req.text();if(raw.length>2048)return new NextResponse(null,{status:413});
  let body;try{body=JSON.parse(raw)}catch{return new NextResponse(null,{status:400})}
  if(!body || typeof body!=='object')return new NextResponse(null,{status:400});
  const path = typeof body.path === 'string' ? body.path : '';
  const tracked = TRACKED.has(path);
  if (tracked) await recordTraffic('site_visit', req.headers, path, typeof body.referrer==='string'?body.referrer:undefined);
  return new NextResponse(null, { status: 204 });
}
