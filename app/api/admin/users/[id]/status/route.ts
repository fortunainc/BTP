import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit-logging';

export const PATCH = withAuth(async (req, user) => {
    try {
      // Check if user is admin
      if (user.userRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Extract ID from URL path
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const userId = pathSegments[4]; // /api/admin/users/[id]/status
      const body = await req.json();
      const { isActive } = body;

      if (isActive === undefined) {
        return NextResponse.json({ error: 'isActive field is required' }, { status: 400 });
      }

      // Get the target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Prevent self-suspension
      if (targetUser.id === user.id) {
        return NextResponse.json({ error: 'Cannot suspend your own account' }, { status: 400 });
      }

      // Update user status (using verificationStatus instead)
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: isActive ? 'Approved' : 'Suspended' },
      });

      // Log audit event
      await logAuditEvent({
        eventType: isActive ? 'USER_REACTIVATED' as any : 'USER_SUSPENDED' as any,
        userId: user.id,
        resourceType: 'User',
        resourceId: userId,
        metadata: {
          targetHandle: targetUser.handle,
          targetEmail: targetUser.email,
        },
        severity: 'high',
      });

      return NextResponse.json({
        success: true,
        message: `User ${isActive ? 'reactivated' : 'suspended'} successfully`,
        user: {
          id: updatedUser.id,
          handle: updatedUser.handle,
          verificationStatus: updatedUser.verificationStatus,
        },
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }
  });