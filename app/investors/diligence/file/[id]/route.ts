import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INVESTOR_COOKIE } from '@/lib/investor-auth';
import { logInvestorActivity, roomViewer } from '@/lib/investor-access';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Streams one data room file to an approved investor and records the download. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await roomViewer(request.cookies.get(INVESTOR_COOKIE)?.value);
  if (!viewer) return NextResponse.redirect(new URL('/investors', request.url), { status: 303 });
  const { id } = await params;
  const doc = await prisma.diligenceDoc.findUnique({ where: { id } }).catch(() => null);
  if (!doc) return new NextResponse('Not found.', { status: 404 });
  await logInvestorActivity(viewer, 'download', doc.id);
  const safeName = doc.fileName.replace(/[^\w.\- ]/g, '_');
  return new NextResponse(new Uint8Array(doc.data), { headers: {
    'Content-Type': doc.mimeType,
    'Content-Disposition': `${/^(application\/pdf|image\/(png|jpeg))$/.test(doc.mimeType) ? 'inline' : 'attachment'}; filename="${safeName}"`,
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
  } });
}
