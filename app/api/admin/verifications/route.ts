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
          linkedinProofCode: true,
          yearsExperience: true,
          workEmailPending: true,
          workEmailVerifiedAt: true,
          vouchNote: true,
          vouchedAt: true,
          vouchedById: true,
          roleCategory: true,
          companyCategory: true,
          createdAt: true,
          isFoundingOperator: true,
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
          isFoundingOperator: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const voucherIds = [...new Set(pendingUsers.map((u) => u.vouchedById).filter((v): v is string => Boolean(v)))];
    const vouchers = voucherIds.length
      ? await prisma.user.findMany({ where: { id: { in: voucherIds } }, select: { id: true, handle: true, roleCategory: true } })
      : [];
    const voucherById = new Map(vouchers.map((v) => [v.id, `${v.handle}${v.roleCategory ? ` (${v.roleCategory})` : ''}`]));
    return NextResponse.json({
      pending: pendingUsers.map((u) => ({ ...u, vouchedBy: u.vouchedById ? voucherById.get(u.vouchedById) ?? 'a verified member' : null })),
      all: allUsers,
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 });
  }
}
