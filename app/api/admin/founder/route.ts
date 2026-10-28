import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { founderMetrics } from '@/lib/founder-metrics';

export async function GET(req: NextRequest) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403 });
  return NextResponse.json(await founderMetrics(), { headers: { 'Cache-Control': 'private, no-store' } });
}
