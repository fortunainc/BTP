import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (req, user) => {
    try {
      // Check if user is admin
      if (user.userRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Extract ID from URL path
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const flagId = pathSegments[4]; // /api/admin/flagged-content/[id]/remove

      // Get the flagged content
      const flag = await prisma.flaggedContent.findUnique({
        where: { id: flagId },
      });

      if (!flag) {
        return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
      }

      // Update flagged content status
      await prisma.flaggedContent.update({
        where: { id: flagId },
        data: {
          status: 'Removed',
        },
      });

      // Remove the actual content based on type
      if (flag.contentType === 'Message') {
        await prisma.message.delete({
          where: { id: flag.contentId },
        });
      } else if (flag.contentType === 'Contribution') {
        await prisma.contribution.delete({
          where: { id: flag.contentId },
        });
      } else if (flag.contentType === 'Interaction') {
        await prisma.interaction.delete({
          where: { id: flag.contentId },
        });
      }

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CONTENT_REMOVED',
          resourceType: flag.contentType,
          resourceId: flag.contentId,
          details: {
            reason: flag.reason,
            removedBy: user.id
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Content removed successfully',
      });
    } catch (error) {
      console.error('Error removing content:', error);
      return NextResponse.json({ error: 'Failed to remove content' }, { status: 500 });
    }
  });