/**
 * Structured Operator Return Loop
 *
 * This module is intentionally anti-forum:
 * - no usernames
 * - no public profiles
 * - no reply chains
 * - no exact small counts in user-facing summaries
 * - no exact timestamps in user-facing summaries
 * - no likes, votes, karma, popularity sorting, or follower mechanics
 */

import { prisma } from '@/lib/prisma';
import { applyAutomaticRedaction, calculateCorrelationRisk } from '@/lib/anti-correlation';
import { getOrCreateUserMetrics, trackEvent, EVENT_TYPES } from '@/lib/analytics-tracker';

export type OperatorInteractionType =
  | 'SEEN_THIS'
  | 'TRIED_SIMILAR'
  | 'WORKED_FOR_US'
  | 'DIDNT_HOLD_UP'
  | 'CAUSED_OTHER_ISSUES'
  | 'GOT_WORSE_LATER'
  | 'STAYED_MANAGEABLE';

export const OPERATOR_INTERACTION_TYPES: OperatorInteractionType[] = [
  'SEEN_THIS',
  'TRIED_SIMILAR',
  'WORKED_FOR_US',
  'DIDNT_HOLD_UP',
  'CAUSED_OTHER_ISSUES',
  'GOT_WORSE_LATER',
  'STAYED_MANAGEABLE',
];

export const LEGACY_INTERACTION_ALIASES: Record<string, OperatorInteractionType> = {
  SEEN_TOO: 'SEEN_THIS',
  ACCURATE: 'SEEN_THIS',
  SOLUTION_WORKED: 'WORKED_FOR_US',
  WORKED: 'WORKED_FOR_US',
  SOLUTION_FAILED: 'DIDNT_HOLD_UP',
  DIDNT_WORK: 'DIDNT_HOLD_UP',
  DIFFERENT_CAUSE: 'CAUSED_OTHER_ISSUES',
  ADD_CONTEXT: 'TRIED_SIMILAR',
  AGREE: 'SEEN_THIS',
};

export const INTERACTION_COPY: Record<OperatorInteractionType, {
  label: string;
  successMessage: string;
  notificationVariantId: string;
  notificationClass: 'VALIDATION' | 'EXPANSION' | 'MOMENTUM' | 'PRESSURE' | 'OPPORTUNITY';
  notificationCopy: string;
}> = {
  SEEN_THIS: {
    label: "I've seen this",
    successMessage: 'Added anonymously. This helps show whether the situation is isolated.',
    notificationVariantId: 'VAL-FIRST-SEEN',
    notificationClass: 'VALIDATION',
    notificationCopy: 'Similar anonymous context has appeared.',
  },
  TRIED_SIMILAR: {
    label: 'We tried something similar',
    successMessage: 'Added anonymously. This gives the situation more useful context.',
    notificationVariantId: 'EXP-TRIED-SIMILAR',
    notificationClass: 'EXPANSION',
    notificationCopy: 'A similar approach has appeared in anonymous context.',
  },
  WORKED_FOR_US: {
    label: 'What worked for us',
    successMessage: 'Added anonymously. This may help another operator avoid wasted motion.',
    notificationVariantId: 'EXP-WORKED',
    notificationClass: 'EXPANSION',
    notificationCopy: 'Helpful context was added from a similar situation.',
  },
  DIDNT_HOLD_UP: {
    label: "What didn't hold up",
    successMessage: 'Added anonymously. This helps separate temporary fixes from durable ones.',
    notificationVariantId: 'EXP-DIDNT-HOLD',
    notificationClass: 'EXPANSION',
    notificationCopy: "Anonymous context suggests a workaround may not have held up.",
  },
  CAUSED_OTHER_ISSUES: {
    label: 'This caused other issues',
    successMessage: 'Added anonymously. This helps operators see downstream risk earlier.',
    notificationVariantId: 'EXP-OTHER-ISSUES',
    notificationClass: 'EXPANSION',
    notificationCopy: 'Anonymous context suggests this caused other issues later.',
  },
  GOT_WORSE_LATER: {
    label: 'This got worse later',
    successMessage: 'Added anonymously. This helps show whether the issue may be maturing.',
    notificationVariantId: 'PRE-WORSE-LATER',
    notificationClass: 'PRESSURE',
    notificationCopy: 'Anonymous context suggests this got worse later.',
  },
  STAYED_MANAGEABLE: {
    label: 'This stayed manageable',
    successMessage: 'Added anonymously. This helps distinguish urgent issues from watchable ones.',
    notificationVariantId: 'VAL-MANAGEABLE',
    notificationClass: 'VALIDATION',
    notificationCopy: 'Anonymous context suggests this stayed manageable.',
  },
};

const HIGH_RISK_THRESHOLD = 0.7;
const SAFE_COUNT_THRESHOLD = 5;

export function normalizeInteractionType(type: string): OperatorInteractionType | null {
  if (OPERATOR_INTERACTION_TYPES.includes(type as OperatorInteractionType)) {
    return type as OperatorInteractionType;
  }

  return LEGACY_INTERACTION_ALIASES[type] || null;
}

export function redactInteractionContext(context: string | undefined, riskContext?: {
  therapeuticArea?: string | null;
  trialPhase?: string | null;
  issueCategory?: string | null;
}): {
  displayContext: string | null;
  originalContext: string | null;
  correlationRisk: number;
  blockedFromDisplay: boolean;
} {
  if (!context || !context.trim()) {
    return {
      displayContext: null,
      originalContext: null,
      correlationRisk: 0,
      blockedFromDisplay: false,
    };
  }

  const trimmed = context.trim().slice(0, 200);
  const { redactedContent } = applyAutomaticRedaction(trimmed);
  const risk = calculateCorrelationRisk(trimmed, {
    therapeuticArea: riskContext?.therapeuticArea || undefined,
    trialPhase: riskContext?.trialPhase || undefined,
    issueCategory: riskContext?.issueCategory || undefined,
  });

  return {
    displayContext: redactedContent.slice(0, 200),
    originalContext: trimmed,
    correlationRisk: risk.riskScore,
    blockedFromDisplay: risk.riskScore >= HIGH_RISK_THRESHOLD,
  };
}

export function bucketCount(count: number): string | null {
  if (count <= 0) return null;
  if (count < SAFE_COUNT_THRESHOLD) return 'a few';
  if (count < 12) return 'several';
  if (count < 30) return 'many';
  return 'showing up repeatedly';
}

export function buildInteractionSummary(interactions: Array<{
  interactionType: string;
  context?: string | null;
  displayStatus?: string | null;
}>): {
  hasInteractions: boolean;
  interactionTypesPresent: string[];
  userSafeSummaries: string[];
  maturityLabel: string;
  updatedReflectionAvailable: boolean;
} {
  const visible = interactions.filter((i) => i.displayStatus !== 'BLOCKED' && i.displayStatus !== 'SUPPRESSED');
  const normalized = visible
    .map((i) => normalizeInteractionType(i.interactionType))
    .filter((type): type is OperatorInteractionType => Boolean(type));

  const counts = normalized.reduce<Record<OperatorInteractionType, number>>((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<OperatorInteractionType, number>);

  const total = normalized.length;
  const summaries: string[] = [];

  if ((counts.SEEN_THIS || 0) > 0) {
    const bucket = bucketCount(counts.SEEN_THIS || 0);
    summaries.push(`${bucket ? `${bucket[0].toUpperCase()}${bucket.slice(1)} operators have` : 'Operators have'} seen something similar`);
  }

  if ((counts.TRIED_SIMILAR || 0) + (counts.WORKED_FOR_US || 0) + (counts.DIDNT_HOLD_UP || 0) > 0) {
    summaries.push('Some tried workarounds');
  }

  if ((counts.WORKED_FOR_US || 0) > 0) {
    summaries.push('Something helped in a similar situation');
  }

  if ((counts.DIDNT_HOLD_UP || 0) > 0) {
    summaries.push('A workaround may not have held up');
  }

  if ((counts.CAUSED_OTHER_ISSUES || 0) > 0) {
    summaries.push('This created other issues in similar anonymous context');
  }

  if ((counts.GOT_WORSE_LATER || 0) > 0) {
    summaries.push('This may get worse if it is left alone');
  }

  if ((counts.STAYED_MANAGEABLE || 0) > 0) {
    summaries.push('This stayed manageable in similar anonymous context');
  }

  let maturityLabel = 'early indication';
  if (total >= 3 || (counts.SEEN_THIS || 0) >= 2) maturityLabel = 'repeating issue';
  if (total >= 8 || (counts.GOT_WORSE_LATER || 0) >= 3) maturityLabel = 'showing up repeatedly';

  return {
    hasInteractions: visible.length > 0,
    interactionTypesPresent: [...new Set(normalized)],
    userSafeSummaries: summaries,
    maturityLabel,
    updatedReflectionAvailable: visible.some((i) => Boolean(i.context)),
  };
}

function randomMinutes(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

async function applyQuietHours(userId: string, scheduledFor: Date): Promise<Date> {
  const settings = await prisma.userNotificationSettings.findUnique({
    where: { userId },
  });

  if (!settings?.quietHoursStart || !settings?.quietHoursEnd) {
    return scheduledFor;
  }

  const hour = scheduledFor.getHours();
  const start = settings.quietHoursStart;
  const end = settings.quietHoursEnd;
  const inQuietHours = start > end
    ? hour >= start || hour < end
    : hour >= start && hour < end;

  if (!inQuietHours) {
    return scheduledFor;
  }

  const adjusted = new Date(scheduledFor);
  adjusted.setHours(end, randomMinutes(0, 45), 0, 0);
  if (hour >= start) {
    adjusted.setDate(adjusted.getDate() + 1);
  }
  return adjusted;
}

export async function createReturnLoopNotification(params: {
  authorId: string;
  actorId?: string;
  contributionId: string;
  interactionType?: OperatorInteractionType;
  trigger:
    | 'FIRST_VALIDATION'
    | 'MULTIPLE_VALIDATIONS'
    | 'WHAT_WORKED'
    | 'DIDNT_HOLD_UP'
    | 'GOT_WORSE_LATER'
    | 'PATTERN_MATURITY'
    | 'REFLECTION_UPDATED'
    | 'MICRO_OPPORTUNITY';
}): Promise<void> {
  const copyByTrigger: Record<typeof params.trigger, string> = {
    FIRST_VALIDATION: 'Similar anonymous context has appeared.',
    MULTIPLE_VALIDATIONS: 'This is starting to show up across similar situations.',
    WHAT_WORKED: 'Helpful context was added from a similar situation.',
    DIDNT_HOLD_UP: "Anonymous context suggests a workaround may not have held up.",
    GOT_WORSE_LATER: 'Anonymous context suggests this became a bigger issue later.',
    PATTERN_MATURITY: 'This moved from an early indication to a repeating issue.',
    REFLECTION_UPDATED: 'Your reflection has new context.',
    MICRO_OPPORTUNITY: 'Your experience may be relevant to a short paid consult.',
  };

  const classByTrigger: Record<typeof params.trigger, 'VALIDATION' | 'EXPANSION' | 'MOMENTUM' | 'PRESSURE' | 'OPPORTUNITY'> = {
    FIRST_VALIDATION: 'VALIDATION',
    MULTIPLE_VALIDATIONS: 'VALIDATION',
    WHAT_WORKED: 'EXPANSION',
    DIDNT_HOLD_UP: 'EXPANSION',
    GOT_WORSE_LATER: 'PRESSURE',
    PATTERN_MATURITY: 'MOMENTUM',
    REFLECTION_UPDATED: 'EXPANSION',
    MICRO_OPPORTUNITY: 'OPPORTUNITY',
  };

  const variantByTrigger: Record<typeof params.trigger, string> = {
    FIRST_VALIDATION: 'RET-FIRST-VALIDATION',
    MULTIPLE_VALIDATIONS: 'RET-MULTIPLE-VALIDATIONS',
    WHAT_WORKED: 'RET-WHAT-WORKED',
    DIDNT_HOLD_UP: 'RET-DIDNT-HOLD',
    GOT_WORSE_LATER: 'RET-WORSE-LATER',
    PATTERN_MATURITY: 'RET-PATTERN-MATURITY',
    REFLECTION_UPDATED: 'RET-REFLECTION-UPDATED',
    MICRO_OPPORTUNITY: 'RET-MICRO-OPPORTUNITY',
  };

  const duplicateWindowMinutes = params.trigger === 'FIRST_VALIDATION' ? 90 : 240;
  const duplicateCutoff = new Date(Date.now() - duplicateWindowMinutes * 60 * 1000);

  const existing = await prisma.notification.findFirst({
    where: {
      userId: params.authorId,
      relatedPostId: params.contributionId,
      variantId: variantByTrigger[params.trigger],
      createdAt: { gte: duplicateCutoff },
      dismissed: false,
    },
  });

  if (existing) return;

  let minMinutes = 120;
  let maxMinutes = 360;
  let priority: 'P1' | 'P2' | 'P3' = 'P2';

  if (params.trigger === 'FIRST_VALIDATION') {
    minMinutes = 15;
    maxMinutes = 60;
    priority = 'P1';
  } else if (params.trigger === 'PATTERN_MATURITY' || params.trigger === 'MICRO_OPPORTUNITY') {
    minMinutes = 15;
    maxMinutes = 60;
    priority = 'P1';
  } else if (params.trigger === 'REFLECTION_UPDATED') {
    minMinutes = 120;
    maxMinutes = 360;
    priority = 'P2';
  }

  const scheduledFor = await applyQuietHours(
    params.authorId,
    new Date(Date.now() + randomMinutes(minMinutes, maxMinutes) * 60 * 1000)
  );

  await prisma.notification.create({
    data: {
      userId: params.authorId,
      variantId: variantByTrigger[params.trigger],
      notificationClass: classByTrigger[params.trigger],
      priority,
      copy: copyByTrigger[params.trigger],
      relatedPostId: params.contributionId,
      relatedThreadId: null,
      relatedOpportunityId: null,
      relatedPatternId: null,
      relatedMatchId: null,
      surfaces: ['in_app', 'email'],
      deliveredTo: [],
      scheduledFor,
      batchCount: 1,
    },
  });

  const metrics = await getOrCreateUserMetrics(params.authorId, 'operator');
  await trackEvent({
    anonymousUserId: metrics.anonymousUserId,
    eventType: EVENT_TYPES.ENGAGEMENT.NOTIFICATION_SENT,
    eventCategory: 'engagement',
    objectType: 'Contribution',
    objectId: params.contributionId,
    metadata: {
      trigger: params.trigger,
      notificationClass: classByTrigger[params.trigger],
      privacySafe: true,
    },
  });
}

export async function triggerReturnLoopForInteraction(params: {
  contributionId: string;
  authorId: string;
  actorId: string;
  interactionType: OperatorInteractionType;
}): Promise<void> {
  const allInteractions = await prisma.interaction.findMany({
    where: {
      contributionId: params.contributionId,
      displayStatus: { notIn: ['BLOCKED', 'SUPPRESSED'] },
    },
    select: { interactionType: true },
  });

  const normalized = allInteractions
    .map((i) => normalizeInteractionType(i.interactionType))
    .filter((type): type is OperatorInteractionType => Boolean(type));

  const seenCount = normalized.filter((type) => type === 'SEEN_THIS').length;
  const total = normalized.length;

  if (params.interactionType === 'SEEN_THIS' && seenCount === 1) {
    await createReturnLoopNotification({
      authorId: params.authorId,
      actorId: params.actorId,
      contributionId: params.contributionId,
      interactionType: params.interactionType,
      trigger: 'FIRST_VALIDATION',
    });
  }

  if (seenCount >= 3 || total >= 5) {
    await createReturnLoopNotification({
      authorId: params.authorId,
      actorId: params.actorId,
      contributionId: params.contributionId,
      interactionType: params.interactionType,
      trigger: 'MULTIPLE_VALIDATIONS',
    });
  }

  if (params.interactionType === 'WORKED_FOR_US') {
    await createReturnLoopNotification({
      authorId: params.authorId,
      actorId: params.actorId,
      contributionId: params.contributionId,
      interactionType: params.interactionType,
      trigger: 'WHAT_WORKED',
    });
  }

  if (params.interactionType === 'DIDNT_HOLD_UP') {
    await createReturnLoopNotification({
      authorId: params.authorId,
      actorId: params.actorId,
      contributionId: params.contributionId,
      interactionType: params.interactionType,
      trigger: 'DIDNT_HOLD_UP',
    });
  }

  if (params.interactionType === 'GOT_WORSE_LATER') {
    await createReturnLoopNotification({
      authorId: params.authorId,
      actorId: params.actorId,
      contributionId: params.contributionId,
      interactionType: params.interactionType,
      trigger: 'GOT_WORSE_LATER',
    });
  }

  if (total === 3 || total === 8) {
    await createReturnLoopNotification({
      authorId: params.authorId,
      actorId: params.actorId,
      contributionId: params.contributionId,
      interactionType: params.interactionType,
      trigger: 'PATTERN_MATURITY',
    });
  }

  if (params.interactionType !== 'SEEN_THIS') {
    await createReturnLoopNotification({
      authorId: params.authorId,
      actorId: params.actorId,
      contributionId: params.contributionId,
      interactionType: params.interactionType,
      trigger: 'REFLECTION_UPDATED',
    });
  }
}