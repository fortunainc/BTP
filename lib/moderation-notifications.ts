import { prisma } from '@/lib/prisma';

export async function notifyReporter(reportId: string, outcome: 'hidden' | 'dismissed' | 'restored'): Promise<void> {
  try {
    const report = await prisma.flaggedContent.findUnique({ where: { id: reportId }, select: { reportedBy: true } });
    if (!report?.reportedBy) return;
    const copy = outcome === 'hidden'
      ? 'BTP reviewed your report and hid the content from members.'
      : outcome === 'restored'
        ? 'BTP completed another review of reported content and restored it.'
        : 'BTP reviewed your report and did not find that the content required removal.';
    await prisma.notification.create({
      data: {
        userId: report.reportedBy,
        variantId: `TRUST-REPORT-${outcome.toUpperCase()}`,
        notificationClass: 'VALIDATION',
        priority: 'P1',
        copy,
        surfaces: ['in_app'],
        deliveredTo: ['in_app'],
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to notify reporter of moderation outcome:', error);
  }
}
