/**
 * Founder Interaction Item Controls API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { createReturnLoopNotification } from '@/lib/operator-return-loop';

const DISPLAY_STATUSES = ['VISIBLE', 'PENDING_REVIEW', 'SUPPRESSED', 'BLOCKED'];

export async function PATCH(request: NextRequest) {
  const adminAuth = await verifyAdminAccess(request);
  if (!adminAuth.success) {
    return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.statusCode || 403 });
  }

  const url = new URL(request.url);
  const id = url.pathname.split('/').pop() || '';
  const body = await request.json();

  const existing = await prisma.interaction.findUnique({
    where: { id },
    include: {
      contribution: {
        select: { id: true, userId: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Interaction not found' }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.displayStatus !== undefined) {
    if (!DISPLAY_STATUSES.includes(body.displayStatus)) {
      return NextResponse.json({ error: `displayStatus must be one of: ${DISPLAY_STATUSES.join(', ')}` }, { status: 400 });
    }
    updateData.displayStatus = body.displayStatus;
  }

  if (body.context !== undefined) updateData.context = body.context ? String(body.context).slice(0, 200) : null;
  if (body.founderNote !== undefined) updateData.founderNote = body.founderNote ? String(body.founderNote).slice(0, 500) : null;
  if (body.isHighValue !== undefined) updateData.isHighValue = Boolean(body.isHighValue);
  if (body.escalatedToSafety !== undefined) updateData.escalatedToSafety = Boolean(body.escalatedToSafety);

  const updated = await prisma.interaction.update({
    where: { id },
    data: updateData,
  });

  if (body.manualNotificationTrigger && existing.contribution.userId) {
    await createReturnLoopNotification({
      authorId: existing.contribution.userId,
      actorId: adminAuth.userId,
      contributionId: existing.contribution.id,
      trigger: body.manualNotificationTrigger,
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: adminAuth.userId,
      action: 'FOUNDER_INTERACTION_CONTROL_UPDATED',
      resourceType: 'Interaction',
      resourceId: id,
      details: {
        changedFields: Object.keys(updateData),
        manualNotificationTrigger: body.manualNotificationTrigger || null,
        privacySafe: true,
      },
    },
  });

  return NextResponse.json({ success: true, interaction: updated });
}
