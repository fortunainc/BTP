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
    const [pendingUsers, allUsers] = await Promise.all([
      prisma.user.findMany({
        where: { verificationStatus: 'Pending' },
        select: {
          id: true,
          handle: true,
          email: true,
          userRole: true,
          verificationStatus: true,
          verificationMethod: true,
          emailVerified: true,
          linkedinUrl: true,
          roleCategory: true,
          companyCategory: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          handle: true,
          email: true,
          userRole: true,
          verificationStatus: true,
          verificationMethod: true,
          emailVerified: true,
          linkedinUrl: true,
          roleCategory: true,
          companyCategory: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      pending: pendingUsers,
      all: allUsers,
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 });
  }
}
