import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAccess } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const adminAuth = await verifyAdminAccess(req);

  if (!adminAuth.success) {
    return NextResponse.json(
      { error: adminAuth.error },
      { status: adminAuth.statusCode || 403 }
    );
  }

  try {
    const flaggedContent = await prisma.flaggedContent.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      flaggedContent,
    });
  } catch (error) {
    console.error('Error fetching flagged content:', error);
    return NextResponse.json({ error: 'Failed to fetch flagged content' }, { status: 500 });
  }
}
