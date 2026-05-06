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
      const userId = pathSegments[4]; // /api/admin/verifications/[id]/approve

      // Get the target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Update user verification status
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          verificationStatus: 'Approved',
          verifiedBy: user.id,
          verifiedAt: new Date(),
        },
      });

      // Log audit event
      await logAuditEvent({
        userId: user.id,
        targetUserId: userId,
        eventType: AuditEventType.USER_VERIFIED,
        resourceType: 'User',
        resourceId: userId,
        metadata: {
          targetUserId: userId,
          targetHandle: targetUser.handle,
          verificationMethod: targetUser.verificationMethod,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User approved successfully',
        user: {
          id: updatedUser.id,
          handle: updatedUser.handle,
          verificationStatus: updatedUser.verificationStatus,
        },
      });
    } catch (error) {
      console.error('Error approving user:', error);
      return NextResponse.json({ error: 'Failed to approve user' }, { status: 500 });
    }
  });