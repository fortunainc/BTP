/**
 * Structured Situation Interactions API
 *
 * Privacy rules:
 * - structured responses only
 * - optional context is capped at 200 characters and redacted
 * - no open discussion, public identity, popularity mechanics, or exact public counts
 * - no exact public timestamps
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { getTrustWeight } from '@/lib/trust-vector';
import {
  buildInteractionSummary,
  INTERACTION_COPY,
  normalizeInteractionType,
  OPERATOR_INTERACTION_TYPES,
  redactInteractionContext,
  triggerReturnLoopForInteraction,
  type OperatorInteractionType,
} from '@/lib/operator-return-loop';
import { getOrCreateUserMetrics, trackEvent, EVENT_TYPES } from '@/lib/analytics-tracker';

const INTERACTION_BASE_WEIGHTS: Record<OperatorInteractionType, number> = {
  SEEN_THIS: 1.5,
  TRIED_SIMILAR: 1.2,
  WORKED_FOR_US: 2.0,
  DIDNT_HOLD_UP: 1.8,
  CAUSED_OTHER_ISSUES: 1.6,
  GOT_WORSE_LATER: 1.8,
  STAYED_MANAGEABLE: 1.2,
};

/**
 * POST /api/situations/[id]/interact
 *
 * Record one structured, anonymous operator interaction.
 */
export const POST = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const contributionId = pathSegments[3];

  const body = await req.json();
  const normalizedType = normalizeInteractionType(String(body.interactionType || ''));
  const rawContext = typeof body.context === 'string' ? body.context : undefined;

  if (!normalizedType || !OPERATOR_INTERACTION_TYPES.includes(normalizedType)) {
    return createErrorResponse(
      `Invalid interaction type. Must be one of: ${OPERATOR_INTERACTION_TYPES.join(', ')}`,
      400
    );
  }

  if (rawContext && rawContext.trim().length > 200) {
    return createErrorResponse('Optional context must be 200 characters or fewer', 400);
  }

  const contribution = await prisma.contribution.findUnique({
    where: {
      id: contributionId,
      contributionType: 'situation',
    },
    select: {
      id: true,
      userId: true,
      therapeuticArea: true,
      trialPhase: true,
      issueCategory: true,
    },
  });

  if (!contribution) {
    return createErrorResponse('Situation not found', 404);
  }

  if (contribution.userId === user.id) {
    return createErrorResponse('You cannot add structured context to your own situation', 400);
  }

  const existingInteraction = await prisma.interaction.findFirst({
    where: {
      contributionId,
      userId: user.id,
      interactionType: normalizedType,
    },
  });

  if (existingInteraction) {
    return createErrorResponse('You already added this anonymous context', 400);
  }

  const contextResult = redactInteractionContext(rawContext, {
    therapeuticArea: contribution.therapeuticArea,
    trialPhase: contribution.trialPhase,
    issueCategory: contribution.issueCategory,
  });

  const userTrustWeight = await getTrustWeight(user.id);
  const effectiveWeight = (INTERACTION_BASE_WEIGHTS[normalizedType] || 1.0) * userTrustWeight;

  const interaction = await prisma.interaction.create({
    data: {
      contributionId,
      userId: user.id,
      interactionType: normalizedType,
      weight: effectiveWeight,
      context: contextResult.blockedFromDisplay ? null : contextResult.displayContext,
      originalContext: contextResult.originalContext,
      correlationRisk: contextResult.correlationRisk,
      displayStatus: contextResult.blockedFromDisplay ? 'PENDING_REVIEW' : 'VISIBLE',
    },
  });

  if (contribution.userId) {
    await triggerReturnLoopForInteraction({
      contributionId,
      authorId: contribution.userId,
      actorId: user.id,
      interactionType: normalizedType,
    });
  }

  const metrics = await getOrCreateUserMetrics(user.id, 'operator');
  await trackEvent({
    anonymousUserId: metrics.anonymousUserId,
    eventType: rawContext ? EVENT_TYPES.ENGAGEMENT.CONTEXT_ADDED : EVENT_TYPES.ENGAGEMENT.INTERACTION_CLICKED,
    eventCategory: 'engagement',
    objectType: 'Interaction',
    objectId: interaction.id,
    metadata: {
      contributionId,
      interactionType: normalizedType,
      hasContext: Boolean(contextResult.displayContext),
      displayStatus: contextResult.blockedFromDisplay ? 'PENDING_REVIEW' : 'VISIBLE',
      privacySafe: true,
      antiForum: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'STRUCTURED_INTERACTION_CREATED',
      resourceType: 'Interaction',
      resourceId: interaction.id,
      details: {
        contributionId,
        interactionType: normalizedType,
        hasContext: Boolean(contextResult.displayContext),
        contextCorrelationRisk: contextResult.correlationRisk,
        displayStatus: contextResult.blockedFromDisplay ? 'PENDING_REVIEW' : 'VISIBLE',
      },
    },
  });

  return createApiResponse({
    success: true,
    message: INTERACTION_COPY[normalizedType].successMessage,
    interactionType: normalizedType,
    contextRedacted: Boolean(rawContext && contextResult.displayContext !== rawContext.trim()),
    pendingReview: contextResult.blockedFromDisplay,
  });
}, { requireAuth: true });

/**
 * GET /api/situations/[id]/interact
 *
 * Return privacy-safe interaction summary only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contributionId } = await params;

    const contribution = await prisma.contribution.findUnique({
      where: {
        id: contributionId,
        contributionType: 'situation',
      },
      include: {
        interactions: {
          select: {
            interactionType: true,
            context: true,
            displayStatus: true,
          },
        },
      },
    });

    if (!contribution) {
      return createErrorResponse('Situation not found', 404);
    }

    const summary = buildInteractionSummary(contribution.interactions);

    return createApiResponse({
      ...summary,
      // Deliberately no exact counts and no actor identities.
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return createErrorResponse('Internal server error', 500);
  }
}