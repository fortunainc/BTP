import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { isApprovedMember } from '@/lib/access-policy';
import { FOUNDER_WAITLIST_ROLE } from '@/lib/waitlist-options';
import { csvCell } from '@/lib/waitlist';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(req: NextRequest) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403, headers });
  const rows = await prisma.accessRequest.findMany({ orderBy: { createdAt: 'desc' } });
  const ids = [...new Set(rows.flatMap(r => r.referrerId ? [r.referrerId] : []))];
  const members = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, handle: true, referralCode: true, verificationStatus: true, userRole: true, isSuspended: true } });
  const byId = new Map(members.map(m => [m.id, m]));
  const entries = rows.map(r => {
    const ref = r.referrerId ? byId.get(r.referrerId) : undefined;
    return { ...r, referrer: ref?.handle || null, eligible: r.role !== FOUNDER_WAITLIST_ROLE && Boolean(r.professionalVerifiedAt || (ref && isApprovedMember(ref))) };
  });
  if (req.nextUrl.searchParams.get('format') === 'csv') {
    const fields = ['Email', 'Role', 'Paid review interest', 'Source', 'Referrer', 'Eligible', 'Status', 'Requested'];
    const csv = [fields, ...entries.map(r => [r.email, r.role, r.paidReviewInterest ? 'Yes' : 'No', r.source, r.referrer, r.eligible ? 'Yes' : 'No', r.status, r.createdAt.toISOString()])].map(r => r.map(csvCell).join(',')).join('\r\n');
    return new NextResponse(csv, { headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="btp-waitlist.csv"' } });
  }
  return NextResponse.json({ entries, referrals: members.map(m => {
    const rr = rows.filter(r => r.referrerId === m.id);
    return { id: m.id, handle: m.handle, active: isApprovedMember(m), link: m.referralCode ? `${req.nextUrl.origin}/join/${m.referralCode}` : null,
      requested: rr.length, paid: rr.filter(r => r.paidReviewInterest).length, invited: rr.filter(r => r.invitedAt).length, joined: rr.filter(r => r.status === 'joined').length };
  }) }, { headers });
}
export async function PATCH(req: NextRequest) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403, headers });
  if (req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers });
  const body = await req.json().catch(() => ({}));
  if (typeof body.id !== 'string') return NextResponse.json({ error: 'Choose a request.' }, { status: 400, headers });
  const row = await prisma.accessRequest.findUnique({ where: { id: body.id } });
  if (!row) return NextResponse.json({ error: 'Request not found.' }, { status: 404, headers });
  if (row.role === FOUNDER_WAITLIST_ROLE) return NextResponse.json({ error: 'This is founder product-review interest, not a community access request.' }, { status: 409, headers });
  if (body.action === 'verify') {
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (note.length < 8 || note.length > 300) return NextResponse.json({ error: 'Briefly record how you checked their professional experience.' }, { status: 400, headers });
    await prisma.accessRequest.update({ where: { id: row.id }, data: { professionalVerifiedAt: new Date(), professionalVerifiedBy: admin.userId, verificationNote: note } });
    return NextResponse.json({ success: true }, { headers });
  }
  if (body.action === 'invite') {
    const ref = row.referrerId ? await prisma.user.findUnique({ where: { id: row.referrerId } }) : null;
    if (!row.professionalVerifiedAt && !(ref && isApprovedMember(ref))) return NextResponse.json({ error: 'Verify their professional experience or use an active verified member referral before inviting.' }, { status: 409, headers });
    if (row.status === 'joined' || row.status === 'invited') return NextResponse.json({ success: true }, { headers });
    if (process.env.VERCEL_ENV === 'preview') return NextResponse.json({ error: 'Sending invitations is disabled in previews.' }, { status: 503, headers });
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      await (await clerkClient()).invitations.createInvitation({ emailAddress: row.email, redirectUrl: `${req.nextUrl.origin}/sign-up`, ignoreExisting: true });
      await prisma.accessRequest.update({ where: { id: row.id }, data: { status: 'invited', invitedAt: new Date() } });
      return NextResponse.json({ success: true }, { headers });
    } catch { return NextResponse.json({ error: 'Invitation could not be confirmed. The request remains saved. Check Clerk before retrying.' }, { status: 503, headers }); }
  }
  return NextResponse.json({ error: 'Unknown action.' }, { status: 400, headers });
}
