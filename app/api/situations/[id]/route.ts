/**
 * Single Situation API
 *
 * Fetches a specific situation with privacy-safe interaction state.
 * No actor identities, no public profiles, no exact small counts, and no exact public timestamps.
 */

import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { bucketTimestamp } from '@/lib/anti-correlation';
import { buildInteractionSummary } from '@/lib/operator-return-loop';
import { getOrCreateUserMetrics, trackEvent, EVENT_TYPES } from '@/lib/analytics-tracker';

/**
 * GET /api/situations/[id]
 */
export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const situationId = pathSegments[3];

  if (!situationId) {
    return createErrorResponse('Situation ID is required', 400);
  }

  const situation = await prisma.contribution.findUnique({
    where: {
      id: situationId,
      contributionType: 'situation',
    },
    include: {
      interactions: {
        select: {
          interactionType: true,
          userId: true,
          context: true,
          displayStatus: true,
        },
      },
    },
  });

  if (!situation) {
    return createErrorResponse('Situation not found', 404);
  }

  if (situation.isHidden || situation.isFlagged) {
    if (situation.userId !== user?.id && user?.userRole !== 'admin') {
      return createErrorResponse('Situation not found', 404);
    }
  }

  const timeBucketInfo = bucketTimestamp(situation.createdAt);
  const summary = buildInteractionSummary(situation.interactions);

  const userInteractions = user
    ? situation.interactions
        .filter((i: { userId: string | null }) => i.userId === user.id)
        .map((i: { interactionType: string }) => i.interactionType)
    : [];

  if (user?.id) {
    const metrics = await getOrCreateUserMetrics(user.id, 'operator');
    await trackEvent({
      anonymousUserId: metrics.anonymousUserId,
      eventType: EVENT_TYPES.ENGAGEMENT.SITUATION_VIEWED,
      eventCategory: 'engagement',
      objectType: 'Contribution',
      objectId: situation.id,
      metadata: {
        isAuthorReturn: situation.userId === user.id,
        hasAnonymousContext: summary.hasInteractions,
      },
    });

    if (situation.userId === user.id && summary.hasInteractions) {
      await trackEvent({
        anonymousUserId: metrics.anonymousUserId,
        eventType: 'return_to_interacted_situation',
        eventCategory: 'engagement',
        objectType: 'Contribution',
        objectId: situation.id,
        metadata: {
          returnLoop: true,
          maturityLabel: summary.maturityLabel,
        },
      });
    }
  }

  return createApiResponse({
    situation: {
      id: situation.id,
      title: situation.title,
      description: situation.description,
      therapeuticArea: situation.therapeuticArea,
      trialPhase: situation.trialPhase,
      issueCategory: situation.issueCategory,
      urgencyLevel: situation.urgencyLevel,
      resolutionStatus: situation.resolutionStatus,
      timeBucket: timeBucketInfo.bucket,
      timeLabel: timeBucketInfo.label,
    },
    interactions: {
      ...summary,
      userInteractions,
    },
  });
}, { requireAuth: false });