/**
 * Reflection API - privacy-safe return loop
 *
 * Returns anonymized, bucketed reflection updates. It deliberately avoids:
 * - exact small counts
 * - exact percentages
 * - operator profile codes
 * - identities or actor-level details
 */

import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { bucketTimestamp } from '@/lib/anti-correlation';
import {
  buildInteractionSummary,
  bucketCount,
  normalizeInteractionType,
  type OperatorInteractionType,
} from '@/lib/operator-return-loop';
import { getOrCreateUserMetrics, trackEvent, EVENT_TYPES } from '@/lib/analytics-tracker';

interface ReflectionResponse {
  id: string;
  title: string;
  timeBucket: string;
  updatedBasedOnAnonymousContext: boolean;
  patternCluster: {
    similarIssueBucket: string;
    therapeuticAreas: string[];
    trialPhases: string[];
    patternStatus: 'early indication' | 'repeating issue' | 'showing up repeatedly';
  };
  interactionSummary: {
    hasInteractions: boolean;
    userSafeSummaries: string[];
    maturityLabel: string;
    interactionTypesPresent: string[];
  };
  responseSignals: string[];
  whatWorked: string[];
  whatDidntHoldUp: string[];
  downstreamRisks: string[];
  confidence: 'low' | 'emerging' | 'strong';
  opportunitySignal: string | null;
}

const DISPLAYABLE_CONTEXT_TYPES: OperatorInteractionType[] = [
  'WORKED_FOR_US',
  'DIDNT_HOLD_UP',
  'CAUSED_OTHER_ISSUES',
  'TRIED_SIMILAR',
  'GOT_WORSE_LATER',
  'STAYED_MANAGEABLE',
];

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[4];

  if (!id) {
    return createErrorResponse('Reflection ID is required', 400);
  }

  const contribution = await prisma.contribution.findFirst({
    where: {
      id,
      userId: user.id,
      contributionType: 'situation',
    },
    include: {
      interactions: {
        where: { displayStatus: { notIn: ['BLOCKED', 'SUPPRESSED'] } },
        select: {
          interactionType: true,
          context: true,
          displayStatus: true,
        },
      },
    },
  });

  if (!contribution) {
    return createErrorResponse('Contribution not found', 404);
  }

  const similarContributions = await prisma.contribution.findMany({
    where: {
      id: { not: id },
      contributionType: 'situation',
      isHidden: false,
      isFlagged: false,
      forceExcludeFromPatterns: false,
      OR: [
        {
          signalQualityScore: { in: ['HIGH', 'MEDIUM'] },
          OR: [
            { issueCategory: contribution.issueCategory },
            { therapeuticArea: contribution.therapeuticArea },
          ],
        },
        {
          forceIncludeFromPatterns: true,
          OR: [
            { issueCategory: contribution.issueCategory },
            { therapeuticArea: contribution.therapeuticArea },
          ],
        },
      ],
    },
    include: {
      interactions: {
        where: { displayStatus: { notIn: ['BLOCKED', 'SUPPRESSED'] } },
        select: {
          interactionType: true,
          context: true,
          displayStatus: true,
        },
      },
    },
    take: 50,
  });

  const allInteractions = [
    ...contribution.interactions,
    ...similarContributions.flatMap((similar) => similar.interactions),
  ];

  const ownSummary = buildInteractionSummary(contribution.interactions);
  const combinedSummary = buildInteractionSummary(allInteractions);
  const responseSignals = buildResponseSignals(allInteractions);
  const contexts = extractPrivacySafeContexts(allInteractions);

  const similarIssueCount = similarContributions.length + 1;
  const patternStatus = determinePatternStatus(similarIssueCount, combinedSummary.maturityLabel);
  const confidence = determineConfidence(similarIssueCount, allInteractions.length);
  const therapeuticAreas = Array.from(
    new Set(
      [contribution.therapeuticArea, ...similarContributions.map((item) => item.therapeuticArea)]
        .filter((value): value is string => Boolean(value))
    )
  ).slice(0, 4);
  const trialPhases = Array.from(
    new Set(
      [contribution.trialPhase, ...similarContributions.map((item) => item.trialPhase)]
        .filter((value): value is string => Boolean(value))
    )
  ).slice(0, 4);

  const metrics = await getOrCreateUserMetrics(user.id, 'operator');
  await trackEvent({
    anonymousUserId: metrics.anonymousUserId,
    eventType: EVENT_TYPES.SITUATION.REFLECTION_OPENED,
    eventCategory: 'situation',
    objectType: 'Contribution',
    objectId: contribution.id,
    metadata: {
      updatedBasedOnAnonymousContext: ownSummary.updatedReflectionAvailable,
      maturityLabel: ownSummary.maturityLabel,
      privacySafe: true,
    },
  });

  const response: ReflectionResponse = {
    id: contribution.id,
    title: contribution.title || 'Your Situation',
    timeBucket: bucketTimestamp(contribution.createdAt).label,
    updatedBasedOnAnonymousContext: ownSummary.updatedReflectionAvailable,
    patternCluster: {
      similarIssueBucket: bucketCount(similarIssueCount) || 'early',
      therapeuticAreas,
      trialPhases,
      patternStatus,
    },
    interactionSummary: {
      hasInteractions: ownSummary.hasInteractions,
      userSafeSummaries: ownSummary.userSafeSummaries,
      maturityLabel: ownSummary.maturityLabel,
      interactionTypesPresent: ownSummary.interactionTypesPresent,
    },
    responseSignals,
    whatWorked: contexts.WORKED_FOR_US,
    whatDidntHoldUp: contexts.DIDNT_HOLD_UP,
    downstreamRisks: [...contexts.CAUSED_OTHER_ISSUES, ...contexts.GOT_WORSE_LATER],
    confidence,
    opportunitySignal: contribution.microOpportunityEligible
      ? 'Your experience may be relevant to a short paid consult if a matching request appears.'
      : null,
  };

  return createApiResponse(response);
}, { requireAuth: true });

function buildResponseSignals(interactions: { interactionType: string }[]): string[] {
  const normalized = interactions
    .map((interaction) => normalizeInteractionType(interaction.interactionType))
    .filter((type): type is OperatorInteractionType => Boolean(type));

  const present = new Set(normalized);
  const signals: string[] = [];

  if (present.has('SEEN_THIS')) signals.push('Others have seen something similar.');
  if (present.has('TRIED_SIMILAR')) signals.push('Some operators tried a similar approach.');
  if (present.has('WORKED_FOR_US')) signals.push('Similar context includes a useful direction.');
  if (present.has('DIDNT_HOLD_UP')) signals.push('A workaround did not hold up in similar context.');
  if (present.has('CAUSED_OTHER_ISSUES')) signals.push('Anonymous context includes downstream issues.');
  if (present.has('GOT_WORSE_LATER')) signals.push('This may become more serious if left alone.');
  if (present.has('STAYED_MANAGEABLE')) signals.push('This stayed manageable in similar anonymous context.');

  return signals;
}

function extractPrivacySafeContexts(
  interactions: { interactionType: string; context: string | null; displayStatus?: string | null }[]
): Record<OperatorInteractionType, string[]> {
  const result: Record<OperatorInteractionType, string[]> = {
    SEEN_THIS: [],
    TRIED_SIMILAR: [],
    WORKED_FOR_US: [],
    DIDNT_HOLD_UP: [],
    CAUSED_OTHER_ISSUES: [],
    GOT_WORSE_LATER: [],
    STAYED_MANAGEABLE: [],
  };

  for (const interaction of interactions) {
    const type = normalizeInteractionType(interaction.interactionType);
    if (!type || !DISPLAYABLE_CONTEXT_TYPES.includes(type)) continue;
    if (!interaction.context || interaction.displayStatus === 'PENDING_REVIEW') continue;

    const safeContext = interaction.context.trim().slice(0, 200);
    if (safeContext && !result[type].includes(safeContext)) {
      result[type].push(safeContext);
    }
  }

  return result;
}

function determinePatternStatus(
  similarIssueCount: number,
  maturityLabel: string
): ReflectionResponse['patternCluster']['patternStatus'] {
  if (maturityLabel === 'showing up repeatedly' || similarIssueCount >= 12) return 'showing up repeatedly';
  if (maturityLabel === 'repeating issue' || similarIssueCount >= 5) return 'repeating issue';
  return 'early indication';
}

function determineConfidence(similarCount: number, interactionCount: number): ReflectionResponse['confidence'] {
  if (similarCount >= 8 || interactionCount >= 8) return 'strong';
  if (similarCount >= 3 || interactionCount >= 3) return 'emerging';
  return 'low';
}

export default { GET };
