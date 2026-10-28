import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { trafficSummary } from '@/lib/traffic';

export async function GET(req: NextRequest) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403 });
  return NextResponse.json(await trafficSummary(30));
}
