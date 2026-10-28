import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { issueInvestorLink, SHARED_LINK_DAYS } from '@/lib/investor-access';

const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 120) : null);

/** approve | revoke | link (returns a personal 7-day link for the founder to send herself). Sends nothing. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const investor = await prisma.investor.findUnique({ where: { id } });
  if (!investor) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (body.action === 'approve') {
    await prisma.investor.update({ where: { id }, data: { status: 'approved', approvedAt: new Date(), name: clean(body.name) ?? investor.name, company: clean(body.company) ?? investor.company } });
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'revoke') {
    await prisma.investor.update({ where: { id }, data: { status: 'revoked', tokenHash: null, tokenExpires: null } });
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'link') {
    if (investor.status !== 'approved') return NextResponse.json({ error: 'Approve this investor first.' }, { status: 400 });
    const token = await issueInvestorLink(id, SHARED_LINK_DAYS * 24 * 60);
    return NextResponse.json({ link: `${req.nextUrl.origin}/investors/enter?token=${token}`, days: SHARED_LINK_DAYS });
  }
  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
