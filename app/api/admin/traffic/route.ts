import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { trafficSummary, acquisitionSummary } from '@/lib/traffic';

export async function GET(req: NextRequest) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403 });
  const [traffic,acquisition]=await Promise.all([trafficSummary(30),acquisitionSummary(30)]);
  return NextResponse.json({...traffic,acquisition});
}
