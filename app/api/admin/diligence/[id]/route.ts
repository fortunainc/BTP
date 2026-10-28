import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403 });
  const { id } = await params;
  await prisma.diligenceDoc.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
