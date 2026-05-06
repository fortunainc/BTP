import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit-logging';

export const POST = withAuth(async (req, user) => {
    try {
      // Check if user is admin
      if (user.userRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Extract ID from URL path
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const flagId = pathSegments[4]; // /api/admin/flagged-content/[id]/dismiss

      // Update flagged content status
      await prisma.flaggedContent.update({
        where: { id: flagId },
        data: {
          status: 'Dismissed',
        },
      });

      // Log audit event
      await logAuditEvent({
        eventType: 'CONTENT_APPROVED' as any,
        userId: user.id,
        resourceType: 'FlaggedContent',
        resourceId: flagId,
        metadata: { dismissedBy: user.id },
        severity: 'medium',
      });

      return NextResponse.json({
        success: true,
        message: 'Flag dismissed successfully',
      });
    } catch (error) {
      console.error('Error dismissing flag:', error);
      return NextResponse.json({ error: 'Failed to dismiss flag' }, { status: 500 });
    }
  });