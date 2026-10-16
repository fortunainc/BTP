import { isAdminMember } from '@/lib/access-policy';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent, AuditEventType } from '@/lib/audit-logging';

export const POST = withAuth(async (req, user) => {
    try {
      // Check if user is admin
      if (!isAdminMember(user)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Extract ID from URL path
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const userId = pathSegments[4]; // /api/admin/verifications/[id]/approve
      const body = await req.json().catch(() => ({}));
      const verificationMethod = typeof body.verificationMethod === 'string'
        ? body.verificationMethod.trim().toLowerCase()
        : '';
      const allowedMethods = ['linkedin', 'work_email', 'member_endorsement', 'manual_evidence'];

      if (!allowedMethods.includes(verificationMethod)) {
        return NextResponse.json({ error: 'Select how professional experience was verified' }, { status: 400 });
      }

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
          isSuspended: false,
          verificationMethod,
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
          verificationMethod,
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
