import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { normalizeInvestorEmail } from '@/lib/investor-access';

const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 120) : null);

/** Investors, data room files and recent investor activity. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403 });
  const [investors, docs, activity, downloads] = await Promise.all([
    prisma.investor.findMany({ orderBy: [{ createdAt: 'desc' }], select: { id: true, email: true, name: true, company: true, status: true, createdAt: true, approvedAt: true, lastSeenAt: true, visits: true } }),
    prisma.diligenceDoc.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, title: true, category: true, fileName: true, size: true, createdAt: true } }),
    prisma.investorActivity.findMany({ orderBy: { createdAt: 'desc' }, take: 60 }),
    prisma.investorActivity.groupBy({ by: ['investorId'], where: { action: 'download' }, _count: { _all: true } }),
  ]);
  const byId = new Map<string, { name: string | null; email: string }>(investors.map((i) => [i.id, i]));
  const docById = new Map<string, { title: string }>(docs.map((d) => [d.id, d]));
  const dl = new Map<string, number>(downloads.map((d) => [d.investorId, d._count._all]));
  return NextResponse.json({
    investors: investors.map((i) => ({ ...i, downloads: dl.get(i.id) ?? 0 })),
    docs,
    activity: activity.map((a) => ({ id: a.id, at: a.createdAt, action: a.action, who: byId.get(a.investorId)?.name || byId.get(a.investorId)?.email || 'Removed', doc: a.docId ? docById.get(a.docId)?.title ?? 'Deleted file' : null })),
  });
}

/** Adds an investor and approves them in one step. Sends nothing. */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403 });
  const body = await req.json().catch(() => ({}));
  const email = normalizeInvestorEmail(body.email);
  if (!email) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
  const data = { name: clean(body.name), company: clean(body.company), status: 'approved', approvedAt: new Date() };
  const investor = await prisma.investor.upsert({ where: { email }, create: { email, ...data }, update: data });
  return NextResponse.json({ id: investor.id });
}
