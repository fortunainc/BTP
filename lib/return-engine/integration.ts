/**
 * BTP Return Engine - Integration Layer
 * 
 * Integrates the Return Engine with existing BTP systems:
 * - Signal Score / Trust Vector
 * - Hiring Loop
 * - Matching Engine
 * - Behavioral Pressure
 * - Opportunity Scarcity
 * 
 * This is where triggers are wired to real events.
 */

import { returnEngine } from './engine';
import { TriggerContext, TriggerEvent } from './types';
import { getTrustVector, updateTrustVector, getTrustWeight as getTrustWeightFromVector } from '../trust-vector';
import { calculateSignalScore, determineTier, AccessTier } from '../signal-score';
import { advanceMatchStage, HiringStage } from '../hiring-loop';

// ==========================================
// POSTING INTEGRATION
// ==========================================

/**
 * Trigger: User creates a post
 * 
 * Generates: Momentum notification (if streak)
 */
export async function onPostCreated(params: {
  userId: string;
  postId: string;
  contributionId: string;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'POST_CREATED',
    timestamp: new Date(),
    actorId: params.userId,
    actorTrustWeight: await getTrustWeight(params.userId),
    targetUserId: params.userId,
    postId: params.postId,
    contributionId: params.contributionId,
  };

  await returnEngine.processTrigger(context);
}

// ==========================================
// INTERACTION INTEGRATION
// ==========================================

/**
 * Trigger: User marks "Seen this before"
 * 
 * Generates: Validation alerts for author
 */
export async function onSeenThisBefore(params: {
  actorId: string;
  authorId: string;
  postId: string;
  contributionId: string;
  isFirstConfirmation: boolean;
  isUniqueConfirmer: boolean;
  confirmationCount: number;
  isHighWeight: boolean;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'SEEN_THIS_BEFORE',
    timestamp: new Date(),
    actorId: params.actorId,
    actorTrustWeight: await getTrustWeight(params.actorId),
    targetUserId: params.authorId,
    postId: params.postId,
    contributionId: params.contributionId,
    eventData: {
      isFirstConfirmation: params.isFirstConfirmation,
      isUniqueConfirmer: params.isUniqueConfirmer,
      confirmationCount: params.confirmationCount,
      isHighWeight: params.isHighWeight,
    },
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: User marks "This is accurate"
 * 
 * Generates: Validation alert for author
 */
export async function onThisIsAccurate(params: {
  actorId: string;
  authorId: string;
  postId: string;
  contributionId: string;
  isHighWeight: boolean;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'THIS_IS_ACCURATE',
    timestamp: new Date(),
    actorId: params.actorId,
    actorTrustWeight: await getTrustWeight(params.actorId),
    targetUserId: params.authorId,
    postId: params.postId,
    contributionId: params.contributionId,
    eventData: {
      isHighWeight: params.isHighWeight,
    },
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: User marks "This worked"
 * 
 * Generates: Expansion alert for author
 */
export async function onThisWorked(params: {
  actorId: string;
  authorId: string;
  postId: string;
  contributionId: string;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'THIS_WORKED',
    timestamp: new Date(),
    actorId: params.actorId,
    actorTrustWeight: await getTrustWeight(params.actorId),
    targetUserId: params.authorId,
    postId: params.postId,
    contributionId: params.contributionId,
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: User marks "Didn't work"
 * 
 * Generates: Expansion alert for author
 */
export async function onDidntWork(params: {
  actorId: string;
  authorId: string;
  postId: string;
  contributionId: string;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'DIDNT_WORK',
    timestamp: new Date(),
    actorId: params.actorId,
    actorTrustWeight: await getTrustWeight(params.actorId),
    targetUserId: params.authorId,
    postId: params.postId,
    contributionId: params.contributionId,
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: User adds context
 * 
 * Generates: Expansion alert for author and thread participants
 */
export async function onAddContext(params: {
  actorId: string;
  authorId: string;
  postId: string;
  contributionId: string;
  threadParticipantIds: string[];
}): Promise<void> {
  // Notify author
  const authorContext: TriggerContext = {
    event: 'ADD_CONTEXT',
    timestamp: new Date(),
    actorId: params.actorId,
    actorTrustWeight: await getTrustWeight(params.actorId),
    targetUserId: params.authorId,
    postId: params.postId,
    contributionId: params.contributionId,
  };

  await returnEngine.processTrigger(authorContext);

  // Notify thread participants (excluding actor and author)
  for (const participantId of params.threadParticipantIds) {
    if (participantId !== params.actorId && participantId !== params.authorId) {
      const participantContext: TriggerContext = {
        event: 'ADD_CONTEXT',
        timestamp: new Date(),
        actorId: params.actorId,
        actorTrustWeight: await getTrustWeight(params.actorId),
        targetUserId: participantId,
        postId: params.postId,
        contributionId: params.contributionId,
      };

      await returnEngine.processTrigger(participantContext);
    }
  }
}

/**
 * Trigger: User identifies different cause
 * 
 * Generates: Expansion alert for author
 */
export async function onDifferentCause(params: {
  actorId: string;
  authorId: string;
  postId: string;
  contributionId: string;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'DIFFERENT_CAUSE',
    timestamp: new Date(),
    actorId: params.actorId,
    actorTrustWeight: await getTrustWeight(params.actorId),
    targetUserId: params.authorId,
    postId: params.postId,
    contributionId: params.contributionId,
  };

  await returnEngine.processTrigger(context);
}

// ==========================================
// PATTERN STATE INTEGRATION
// ==========================================

/**
 * Trigger: Pattern is forming around posts
 * 
 * Generates: Validation alerts for all participants
 */
export async function onPatternForming(params: {
  patternId: string;
  participantIds: string[];
  postIds: string[];
}): Promise<void> {
  for (const participantId of params.participantIds) {
    const context: TriggerContext = {
      event: 'PATTERN_FORMING',
      timestamp: new Date(),
      actorId: 'system',
      actorTrustWeight: 1.0,
      targetUserId: participantId,
      patternId: params.patternId,
      postId: params.postIds[0], // Primary post
    };

    await returnEngine.processTrigger(context);
  }
}

/**
 * Trigger: Pattern connects to another pattern
 * 
 * Generates: Expansion alerts for participants
 */
export async function onPatternConnected(params: {
  patternId: string;
  connectedPatternId: string;
  participantIds: string[];
}): Promise<void> {
  for (const participantId of params.participantIds) {
    const context: TriggerContext = {
      event: 'PATTERN_CONNECTED',
      timestamp: new Date(),
      actorId: 'system',
      actorTrustWeight: 1.0,
      targetUserId: participantId,
      patternId: params.patternId,
    };

    await returnEngine.processTrigger(context);
  }
}

// ==========================================
// MOMENTUM / ACCESS INTEGRATION
// ==========================================

/**
 * Trigger: Trust vector increases significantly
 * 
 * Generates: Momentum alert
 */
export async function onTrustIncreased(params: {
  userId: string;
  previousScore: number;
  newScore: number;
  increasePercentage: number;
}): Promise<void> {
  // Only notify if increase is significant (> 5%)
  if (params.increasePercentage < 0.05) return;

  const context: TriggerContext = {
    event: 'TRUST_INCREASED',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.userId,
    eventData: {
      previousScore: params.previousScore,
      newScore: params.newScore,
    },
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: User's access tier improves
 * 
 * Generates: Momentum alert
 */
export async function onTierImproved(params: {
  userId: string;
  previousTier: AccessTier;
  newTier: AccessTier;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'TIER_IMPROVED',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.userId,
    eventData: {
      previousTier: params.previousTier,
      newTier: params.newTier,
    },
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: User's access priority improves
 * 
 * Generates: Momentum alert
 */
export async function onAccessPriorityUp(params: {
  userId: string;
  domain?: string;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'ACCESS_PRIORITY_UP',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.userId,
    eventData: {
      domain: params.domain,
    },
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: User's domain strength increases
 * 
 * Generates: Momentum alert
 */
export async function onDomainStrengthened(params: {
  userId: string;
  domain: string;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'DOMAIN_STRENGTHENED',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.userId,
    eventData: {
      domain: params.domain,
    },
  };

  await returnEngine.processTrigger(context);
}

// ==========================================
// PRESSURE INTEGRATION
// ==========================================

/**
 * Trigger: User missed a high-fit opportunity
 * 
 * Generates: Pressure alert
 */
export async function onOpportunityMissedClose(params: {
  userId: string;
  opportunityId: string;
  matchScore: number;
  thresholdScore: number;
}): Promise<void> {
  // Only notify if they were close (within 5%)
  const gap = params.thresholdScore - params.matchScore;
  if (gap > 0.05) return;

  const context: TriggerContext = {
    event: 'OPPORTUNITY_MISSED_CLOSE',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.userId,
    opportunityId: params.opportunityId,
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: User missed opportunity due to access delay
 * 
 * Generates: Pressure alert
 */
export async function onOpportunityMissedAccess(params: {
  userId: string;
  opportunityId: string;
  tier: AccessTier;
  higherPriorityOperators: number;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'OPPORTUNITY_MISSED_ACCESS',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.userId,
    opportunityId: params.opportunityId,
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: User has been inactive
 * 
 * Generates: Pressure alert
 */
export async function onInactivityWarning(params: {
  userId: string;
  inactiveDays: number;
}): Promise<void> {
  // Only warn after 5+ days
  if (params.inactiveDays < 5) return;

  const context: TriggerContext = {
    event: 'INACTIVITY_WARNING',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.userId,
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: User is just below tier threshold
 * 
 * Generates: Pressure alert (digest only)
 */
export async function onTierProximityBelow(params: {
  userId: string;
  currentScore: number;
  thresholdScore: number;
  gap: number;
}): Promise<void> {
  // Only notify if within 10%
  if (params.gap > 0.1) return;

  const context: TriggerContext = {
    event: 'TIER_PROXIMITY_BELOW',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.userId,
    eventData: {
      previousScore: params.currentScore,
      newScore: params.thresholdScore,
    },
  };

  await returnEngine.processTrigger(context);
}

// ==========================================
// OPPORTUNITY INTEGRATION
// ==========================================

/**
 * Trigger: New opportunity released
 * 
 * Generates: Opportunity alerts for matched users
 */
export async function onOpportunityReleased(params: {
  opportunityId: string;
  matchedUserIds: Array<{
    userId: string;
    matchScore: number;
    tier: AccessTier;
  }>;
}): Promise<void> {
  for (const match of params.matchedUserIds) {
    // Determine which variant based on match quality
    let event: TriggerEvent = 'OPPORTUNITY_RELEASED';
    
    if (match.matchScore > 0.8) {
      event = 'OPPORTUNITY_HIGH_FIT';
    } else if (match.tier === 'TIER_1' || match.tier === 'TIER_2') {
      event = 'OPPORTUNITY_EARLY_WINDOW';
    }

    const context: TriggerContext = {
      event,
      timestamp: new Date(),
      actorId: 'system',
      actorTrustWeight: 1.0,
      targetUserId: match.userId,
      opportunityId: params.opportunityId,
      eventData: {
        fitScore: match.matchScore,
      },
    };

    await returnEngine.processTrigger(context);
  }
}

/**
 * Trigger: Opportunity is moving fast (receiving rapid interest)
 * 
 * Generates: Opportunity alert
 */
export async function onOpportunityMovingFast(params: {
  opportunityId: string;
  matchedUserIds: string[];
  interestCount: number;
  timeSinceRelease: number; // hours
}): Promise<void> {
  // Only notify if significant interest (> 3) in short time (< 24 hours)
  if (params.interestCount < 3 || params.timeSinceRelease > 24) return;

  for (const userId of params.matchedUserIds) {
    const context: TriggerContext = {
      event: 'OPPORTUNITY_MOVING_FAST',
      timestamp: new Date(),
      actorId: 'system',
      actorTrustWeight: 1.0,
      targetUserId: userId,
      opportunityId: params.opportunityId,
    };

    await returnEngine.processTrigger(context);
  }
}

/**
 * Trigger: Opportunity matches user's domain expertise
 * 
 * Generates: Opportunity alert
 */
export async function onOpportunityDomainMatch(params: {
  opportunityId: string;
  userId: string;
  domain: string;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'OPPORTUNITY_DOMAIN_MATCH',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.userId,
    opportunityId: params.opportunityId,
    eventData: {
      domain: params.domain,
    },
  };

  await returnEngine.processTrigger(context);
}

// ==========================================
// HIRING LOOP INTEGRATION
// ==========================================

/**
 * Trigger: Match created
 * 
 * Generates: Opportunity alert for operator
 */
export async function onMatchCreated(params: {
  matchId: string;
  operatorId: string;
  organizationId: string;
  matchScore: number;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'OPPORTUNITY_RELEASED',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.operatorId,
    opportunityId: params.matchId,
    eventData: {
      fitScore: params.matchScore,
    },
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: Interest expressed
 * 
 * Generates: Momentum alert for operator
 */
export async function onInterestExpressed(params: {
  matchId: string;
  operatorId: string;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'OPPORTUNITY_RELEASED',
    timestamp: new Date(),
    actorId: params.operatorId,
    actorTrustWeight: await getTrustWeight(params.operatorId),
    targetUserId: params.operatorId,
    opportunityId: params.matchId,
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: Interview requested
 * 
 * Generates: Momentum alert for operator
 */
export async function onInterviewRequested(params: {
  matchId: string;
  operatorId: string;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'OPPORTUNITY_RELEASED',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.operatorId,
    opportunityId: params.matchId,
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: Hire confirmed
 * 
 * Generates: Momentum alert for operator
 */
export async function onHired(params: {
  matchId: string;
  operatorId: string;
  organizationId: string;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'HIRED',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.operatorId,
    opportunityId: params.matchId,
  };

  await returnEngine.processTrigger(context);
}

/**
 * Trigger: Hire completed with outcome
 * 
 * Generates: Momentum/Pressure alerts based on outcome
 */
export async function onHireCompleted(params: {
  matchId: string;
  operatorId: string;
  organizationId: string;
  wasSuccessful: boolean;
  wouldRehire?: boolean;
}): Promise<void> {
  const context: TriggerContext = {
    event: 'OUTCOME_RECORDED',
    timestamp: new Date(),
    actorId: 'system',
    actorTrustWeight: 1.0,
    targetUserId: params.operatorId,
    opportunityId: params.matchId,
    eventData: {
      wasSuccessful: params.wasSuccessful,
      wouldRehire: params.wouldRehire,
    },
  };

  await returnEngine.processTrigger(context);
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get trust weight for a user
 */
async function getTrustWeight(userId: string): Promise<number> {
  const trustVector = await getTrustVector(userId);
  return trustVector?.overallWeight ?? 0.5;
}

/**
 * Check if user is close to tier threshold
 */
export async function checkTierProximity(userId: string): Promise<{
  isClose: boolean;
  currentScore: number;
  thresholdScore: number;
  gap: number;
} | null> {
  const trustVector = await getTrustVector(userId);
  if (!trustVector) return null;

  // Map TrustVectorData to signal-score's TrustVector format
  const mappedVector = {
    reliability: trustVector.vector.reliability,
    quality: trustVector.vector.quality,
    outcome: trustVector.vector.outcomeReinforcement,
    responsiveness: trustVector.vector.recency,
    depth: trustVector.vector.peerConfidence,
  };

  const signalScore = calculateSignalScore(mappedVector);
  const currentTier = determineTier(signalScore.percentile);

  // Get next tier threshold
  let thresholdScore: number;
  if (currentTier === 'TIER_3') {
    thresholdScore = 40; // TIER_2 threshold
  } else if (currentTier === 'TIER_2') {
    thresholdScore = 80; // TIER_1 threshold
  } else {
    return null; // Already at top tier
  }

  const gap = thresholdScore - signalScore.score;
  const isClose = gap <= 10; // Within 10 points

  return {
    isClose,
    currentScore: signalScore.score,
    thresholdScore,
    gap: gap / 100, // Normalize to 0-1
  };
}

/**
 * Check for missed opportunities
 */
export async function checkMissedOpportunities(userId: string): Promise<{
  missedClose: number;
  missedAccess: number;
}> {
  // In production, this would query the database for missed opportunities
  // For now, return placeholder
  return {
    missedClose: 0,
    missedAccess: 0,
  };
}

// ==========================================
// EXPORTS
// ==========================================

export const ReturnEngineIntegration = {
  // Posting
  onPostCreated,

  // Interactions
  onSeenThisBefore,
  onThisIsAccurate,
  onThisWorked,
  onDidntWork,
  onAddContext,
  onDifferentCause,

  // Pattern state
  onPatternForming,
  onPatternConnected,

  // Momentum/Access
  onTrustIncreased,
  onTierImproved,
  onAccessPriorityUp,
  onDomainStrengthened,

  // Pressure
  onOpportunityMissedClose,
  onOpportunityMissedAccess,
  onInactivityWarning,
  onTierProximityBelow,

  // Opportunities
  onOpportunityReleased,
  onOpportunityMovingFast,
  onOpportunityDomainMatch,

  // Hiring loop
  onMatchCreated,
  onInterestExpressed,
  onInterviewRequested,
  onHired,
  onHireCompleted,

  // Helpers
  checkTierProximity,
  checkMissedOpportunities,
};