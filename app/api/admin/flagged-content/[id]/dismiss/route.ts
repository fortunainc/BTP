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
      const flagId = pathSegments[4]; // /api/admin/flagged-content/[id]/dismiss

      const flag = await prisma.flaggedContent.findUnique({ where: { id: flagId } });
      if (!flag) return NextResponse.json({ error: 'Flag not found' }, { status: 404 });

      await prisma.$transaction(async tx => {
        await tx.flaggedContent.update({
          where: { id: flagId },
          data: {
            status: 'Dismissed',
            action: 'dismissed',
            reviewedBy: admin.userId,
            reviewedAt: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            userId: admin.userId,
            action: 'CONTENT_REPORT_DISMISSED',
            resourceType: flag.contentType,
            resourceId: flag.contentId,
            details: { reportId: flag.id, reason: flag.reason },
          },
        });
      });
      await notifyReporter(flag.id, 'dismissed');

      return NextResponse.json({
        success: true,
        message: 'Flag dismissed successfully',
      });
    } catch (error) {
      console.error('Error dismissing flag:', error);
      return NextResponse.json({ error: 'Failed to dismiss flag' }, { status: 500 });
    }
}
