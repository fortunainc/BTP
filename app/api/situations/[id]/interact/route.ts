/**
 * Structured Situation Interactions API
 *
 * Privacy rules:
 * - structured responses only
 * - public answers are capped at 2,000 characters and redacted
 * - generalized verified roles are public; real identity remains private
 * - no exact public timestamps
 */

import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
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
import { buildLedgerEvent } from '@/lib/knowledge-ledger';

const INTERACTION_BASE_WEIGHTS: Record<OperatorInteractionType, number> = {
  ANSWER: 2.0,
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
  if (user.verificationStatus !== 'Approved' && user.userRole !== 'admin') {
    return createErrorResponse('Approved BTP membership is required', 403);
  }

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

  const contextLimit = normalizedType === 'ANSWER' ? 2000 : 200;
  if (rawContext && rawContext.trim().length > contextLimit) {
    return createErrorResponse(
      normalizedType === 'ANSWER'
        ? 'Answers must be 2,000 characters or fewer'
        : 'Optional context must be 200 characters or fewer',
      400
    );
  }

  if (normalizedType === 'ANSWER' && !rawContext?.trim()) {
    return createErrorResponse('Answer text is required', 400);
  }

  const contribution = await prisma.contribution.findUnique({
    where: {
      id: contributionId,
      contributionType: { in: ['question', 'situation'] },
    },
    select: {
      id: true,
      userId: true,
      therapeuticArea: true,
      trialPhase: true,
      issueCategory: true,
      isHidden: true,
      isFlagged: true,
      forceExcludeFromPatterns: true,
    },
  });

  if (!contribution) {
    return createErrorResponse('Question not found', 404);
  }

  if (contribution.isHidden || contribution.isFlagged || contribution.forceExcludeFromPatterns) {
    return createErrorResponse('Question not found', 404);
  }

  if (contribution.userId === user.id) {
    return createErrorResponse('You cannot answer or add context to your own question', 400);
  }

  const existingInteraction = await prisma.interaction.findFirst({
    where: {
      contributionId,
      userId: user.id,
      interactionType: normalizedType,
    },
  });

  if (existingInteraction) {
    return createErrorResponse(
      normalizedType === 'ANSWER' ? 'You already answered this question' : 'You already added this context',
      400
    );
  }

  const contextResult = redactInteractionContext(rawContext, {
    therapeuticArea: contribution.therapeuticArea,
    trialPhase: contribution.trialPhase,
    issueCategory: contribution.issueCategory,
  });

  const userTrustWeight = await getTrustWeight(user.id);
  const effectiveWeight = (INTERACTION_BASE_WEIGHTS[normalizedType] || 1.0) * userTrustWeight;

  const interactionId = randomUUID();
  const interactionData = {
    data: {
        id: interactionId,
        contributionId,
        userId: user.id,
        interactionType: normalizedType,
        weight: effectiveWeight,
        context: contextResult.blockedFromDisplay ? null : contextResult.displayContext,
        originalContext: null,
        correlationRisk: contextResult.correlationRisk,
        isVerified: normalizedType === 'ANSWER' && user.verificationStatus === 'Approved',
        displayStatus: contextResult.blockedFromDisplay ? 'PENDING_REVIEW' : 'VISIBLE',
    },
  };
  const ledgerEvent = buildLedgerEvent({
    aggregateType: normalizedType === 'ANSWER' ? 'ANSWER' : 'INTERACTION',
    aggregateId: interactionId,
    eventType: 'CREATED',
    actorUserId: user.id,
    payload: {
      questionId: contributionId,
      interactionType: normalizedType,
      answer: normalizedType === 'ANSWER' ? contextResult.displayContext : null,
      context: normalizedType === 'ANSWER' ? null : contextResult.displayContext,
      roleCategory: user.roleCategory,
      verificationStatus: user.verificationStatus,
      correlationRisk: contextResult.correlationRisk,
      visibility: contextResult.blockedFromDisplay ? 'PENDING_REVIEW' : 'COMMUNITY_VISIBLE',
    },
  });
  const [interaction] = await prisma.$transaction([
    prisma.interaction.create(interactionData),
    prisma.knowledgeLedgerEvent.create({ data: ledgerEvent }),
  ]);

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
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    if (user.verificationStatus !== 'Approved' && user.userRole !== 'admin') {
      return createErrorResponse('Approved BTP membership is required', 403);
    }

    const contributionId = new URL(request.url).pathname.split('/')[3];

    const contribution = await prisma.contribution.findUnique({
      where: {
        id: contributionId,
        contributionType: { in: ['question', 'situation'] },
        isHidden: false,
        isFlagged: false,
        forceExcludeFromPatterns: false,
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
}, { requireAuth: true });
