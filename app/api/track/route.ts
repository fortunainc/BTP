import { NextRequest, NextResponse } from 'next/server';
import { recordTraffic } from '@/lib/traffic';

export const runtime = 'nodejs';
const TRACKED = new Set(['/', '/investors', '/privacy', '/support']);

/** Cookie-free page-view beacon for public pages. */
export async function POST(req: NextRequest) {
  const body = await req.text().then((t) => { try { return JSON.parse(t); } catch { return {}; } });
  const path = typeof body.path === 'string' ? body.path : '';
  const tracked = TRACKED.has(path) || path.startsWith('/join/');
  if (tracked) await recordTraffic('site_visit', req.headers, path.startsWith('/join/') ? '/join' : path);
  return new NextResponse(null, { status: 204 });
}
