import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { csvCell } from '@/lib/waitlist';
import { INQUIRY_ACCESS, INQUIRY_STATUS } from '@/lib/company-inquiry';
const headers = { 'Cache-Control': 'private, no-store' };
const accessLabel = (k: string) => INQUIRY_ACCESS.find(([key]) => key === k)?.[1] || k;
export async function GET(req: NextRequest) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403, headers });
  const rows = await prisma.companyInquiry.findMany({ orderBy: { createdAt: 'desc' } });
  if (req.nextUrl.searchParams.get('format') === 'csv') {
    const fields = ['Name', 'Work email', 'Company', 'Website', 'Product and users', 'Wants to learn', 'Can share', 'Status', 'Received'];
    const csv = [fields, ...rows.map(r => [r.name, r.email, r.company, r.website, r.product, r.goals, accessLabel(r.access), r.status, r.createdAt.toISOString()])].map(r => r.map(csvCell).join(',')).join('\r\n');
    return new NextResponse(csv, { headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="btp-company-inquiries.csv"' } });
  }
  return NextResponse.json({ entries: rows.map(r => ({ ...r, accessLabel: accessLabel(r.access) })) }, { headers });
}
export async function PATCH(req: NextRequest) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403, headers });
  if (req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers });
  const body = await req.json().catch(() => ({}));
  if (typeof body.id !== 'string' || !INQUIRY_STATUS.includes(body.status)) return NextResponse.json({ error: 'Choose an inquiry and a status.' }, { status: 400, headers });
  const row = await prisma.companyInquiry.findUnique({ where: { id: body.id } });
  if (!row) return NextResponse.json({ error: 'Inquiry not found.' }, { status: 404, headers });
  await prisma.companyInquiry.update({ where: { id: row.id }, data: { status: body.status } });
  return NextResponse.json({ success: true }, { headers });
}
