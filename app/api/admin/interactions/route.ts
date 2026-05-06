/**
 * Founder Interaction Controls API
 *
 * Admin-only route for reviewing structured operator signals and seeding private-alpha interactions.
 * User-facing product avoids public-discussion mechanics: no public profiles, open responses, public reactions, or exact counts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAccess } from '@/lib/admin-auth';
import {
  normalizeInteractionType,
  OPERATOR_INTERACTION_TYPES,
  redactInteractionContext,
  triggerReturnLoopForInteraction,
} from '@/lib/operator-return-loop';

export async function GET(request: NextRequest) {
  const adminAuth = await verifyAdminAccess(request);
  if (!adminAuth.success) {
    return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.statusCode || 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'PENDING_REVIEW';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  const interactions = await prisma.interaction.findMany({
    where: status === 'ALL' ? {} : { displayStatus: status },
    select: {
      id: true,
      contributionId: true,
      interactionType: true,
      context: true,
      originalContext: true,
      correlationRisk: true,
      displayStatus: true,
      isSeeded: true,
      founderNote: true,
      isHighValue: true,
      escalatedToSafety: true,
      createdAt: true,
      contribution: {
        select: {
          title: true,
          issueCategory: true,
          therapeuticArea: true,
          trialPhase: true,
          userId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({
    success: true,
    interactions,
    meta: {
      privacyNote: 'Admin-only view. Do not expose user identities or raw context in user-facing surfaces.',
      generatedAt: new Date().toISOString(),
      adminUser: adminAuth.handle,
    },
  });
}

export async function POST(request: NextRequest) {
  const adminAuth = await verifyAdminAccess(request);
  if (!adminAuth.success) {
    return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.statusCode || 403 });
  }

  const body = await request.json();
  const contributionId = String(body.contributionId || '');
  const normalizedType = normalizeInteractionType(String(body.interactionType || ''));
  const rawContext = typeof body.context === 'string' ? body.context : undefined;

  if (!contributionId) {
    return NextResponse.json({ error: 'contributionId is required' }, { status: 400 });
  }

  if (!normalizedType || !OPERATOR_INTERACTION_TYPES.includes(normalizedType)) {
    return NextResponse.json({ error: `interactionType must be one of: ${OPERATOR_INTERACTION_TYPES.join(', ')}` }, { status: 400 });
  }

  if (rawContext && rawContext.trim().length > 200) {
    return NextResponse.json({ error: 'context must be 200 characters or fewer' }, { status: 400 });
  }

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId, contributionType: 'situation' },
    select: {
      id: true,
      userId: true,
      therapeuticArea: true,
      trialPhase: true,
      issueCategory: true,
    },
  });

  if (!contribution) {
    return NextResponse.json({ error: 'Situation not found' }, { status: 404 });
  }

  const contextResult = redactInteractionContext(rawContext, {
    therapeuticArea: contribution.therapeuticArea,
    trialPhase: contribution.trialPhase,
    issueCategory: contribution.issueCategory,
  });

  const interaction = await prisma.interaction.create({
    data: {
      contributionId,
      userId: null,
      interactionType: normalizedType,
      weight: Number(body.weight || 1),
      context: contextResult.blockedFromDisplay ? null : contextResult.displayContext,
      originalContext: contextResult.originalContext,
      correlationRisk: contextResult.correlationRisk,
      displayStatus: contextResult.blockedFromDisplay ? 'PENDING_REVIEW' : String(body.displayStatus || 'VISIBLE'),
      isSeeded: true,
      seededBy: adminAuth.handle || 'founder',
      founderNote: typeof body.founderNote === 'string' ? body.founderNote.slice(0, 500) : null,
      isHighValue: Boolean(body.isHighValue),
    },
  });

  if (contribution.userId && body.triggerNotification !== false) {
    await triggerReturnLoopForInteraction({
      contributionId,
      authorId: contribution.userId,
      actorId: 'founder-seed',
      interactionType: normalizedType,
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: adminAuth.userId,
      action: 'FOUNDER_SEEDED_INTERACTION',
      resourceType: 'Interaction',
      resourceId: interaction.id,
      details: {
        contributionId,
        interactionType: normalizedType,
        displayStatus: interaction.displayStatus,
        privacySafe: true,
      },
    },
  });

  return NextResponse.json({ success: true, interaction });
}
