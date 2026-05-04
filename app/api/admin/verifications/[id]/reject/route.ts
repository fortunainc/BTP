import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent, AuditEventType } from '@/lib/audit-logging';

export const POST = withAuth(async (req, user) => {
    try {
      // Check if user is admin
      if (user.userRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Extract ID from URL path
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const userId = pathSegments[4]; // /api/admin/verifications/[id]/reject
      const body = await req.json();
      const { reason } = body;

      if (!reason || reason.trim().length === 0) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      // Get the target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Update user verification status with rejection reason
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          verificationStatus: 'Rejected',
          verifiedBy: user.id,
          verifiedAt: new Date(),
        },
      });

      // Log audit event with rejection reason
      await logAuditEvent({
        userId: user.id,
        targetUserId: userId,
        eventType: AuditEventType.USER_VERIFICATION_REJECTED,
        resourceType: 'User',
        resourceId: userId,
        metadata: {
          targetUserId: userId,
          targetHandle: targetUser.handle,
          reason: reason.trim(),
          verificationMethod: targetUser.verificationMethod,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User rejected successfully',
        user: {
          id: updatedUser.id,
          handle: updatedUser.handle,
          verificationStatus: updatedUser.verificationStatus,
        },
      });
    } catch (error) {
      console.error('Error rejecting user:', error);
      return NextResponse.json({ error: 'Failed to reject user' }, { status: 500 });
    }
  });