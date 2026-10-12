import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { notifyReporter } from '@/lib/moderation-notifications';

export async function POST(req: NextRequest) {
    try {
      const admin = await verifyAdminAccess(req);
      if (!admin.success || !admin.userId) {
        return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403 });
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

      // Hiding is the safe beta default: retain the source record and report evidence.
      await prisma.$transaction(async tx => {
        if (flag.contentType === 'Message') {
          await tx.message.update({
            where: { id: flag.contentId },
            data: { isRemoved: true, removedBy: admin.userId, removedAt: new Date() },
          });
        } else if (flag.contentType === 'Contribution') {
          await tx.contribution.update({
            where: { id: flag.contentId },
            data: {
              isHidden: true,
              isFlagged: true,
              flagReason: flag.reason,
              isModerated: true,
              moderatedBy: admin.userId,
              moderatedAt: new Date(),
              moderationAction: 'hidden',
            },
          });
        } else if (flag.contentType === 'Interaction') {
          await tx.interaction.update({
            where: { id: flag.contentId },
            data: { displayStatus: 'SUPPRESSED' },
          });
        } else {
          throw new Error('Unsupported content type');
        }

        await tx.flaggedContent.update({
          where: { id: flagId },
          data: {
            status: 'Resolved',
            action: 'hidden',
            reviewedBy: admin.userId,
            reviewedAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            userId: admin.userId,
            action: 'CONTENT_HIDDEN',
            resourceType: flag.contentType,
            resourceId: flag.contentId,
            details: { reportId: flag.id, reason: flag.reason },
          },
        });
      });
      await notifyReporter(flag.id, 'hidden');

      return NextResponse.json({
        success: true,
        message: 'Content hidden successfully',
      });
    } catch (error) {
      console.error('Error removing content:', error);
      return NextResponse.json({ error: 'Failed to hide content' }, { status: 500 });
    }
}
