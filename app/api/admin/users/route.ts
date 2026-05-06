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
    const users = await prisma.user.findMany({
      select: {
        id: true,
        handle: true,
        email: true,
        userRole: true,
        verificationStatus: true,
        verificationMethod: true,
        createdAt: true,
        updatedAt: true,
        isSuspended: true,
        _count: {
          select: {
            jobPostings: true,
            sentMessages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
