import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAccess } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminAccess(req);
    if (!admin.success || !admin.userId) {
      return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403 });
    }

    const flagId = new URL(req.url).pathname.split('/')[4];
    const flag = await prisma.flaggedContent.findUnique({ where: { id: flagId } });
    if (!flag) return NextResponse.json({ error: 'Flag not found' }, { status: 404 });

    await prisma.$transaction(async tx => {
      if (flag.contentType === 'Message') {
        await tx.message.update({
          where: { id: flag.contentId },
          data: { isRemoved: false, removedBy: null, removedAt: null },
        });
      } else if (flag.contentType === 'Contribution') {
        await tx.contribution.update({
          where: { id: flag.contentId },
          data: {
            isHidden: false,
            isFlagged: false,
            flagReason: null,
            isModerated: true,
            moderatedBy: admin.userId,
            moderatedAt: new Date(),
            moderationAction: 'restored',
          },
        });
      } else if (flag.contentType === 'Interaction') {
        await tx.interaction.update({
          where: { id: flag.contentId },
          data: { displayStatus: 'VISIBLE' },
        });
      } else {
        throw new Error('Unsupported content type');
      }

      await tx.flaggedContent.update({
        where: { id: flag.id },
        data: {
          status: 'Resolved',
          action: 'restored',
          reviewedBy: admin.userId,
          reviewedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          action: 'CONTENT_RESTORED',
          resourceType: flag.contentType,
          resourceId: flag.contentId,
          details: { reportId: flag.id },
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Content restored successfully' });
  } catch (error) {
    console.error('Error restoring content:', error);
    return NextResponse.json({ error: 'Failed to restore content' }, { status: 500 });
  }
}
