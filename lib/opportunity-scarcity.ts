/**
 * SECTION 2: Opportunity Scarcity Engine
 * 
 * Controlled scarcity for opportunity access
 * Time-based tier release logic
 */

import { AccessTier, TIER_CONFIG, SignalScore } from './signal-score';
import { generateSecureLookupKey } from './capability-identity-secure';
import { 
  onOpportunityReleased, 
  onOpportunityMovingFast, 
  onOpportunityMissedClose,
  onOpportunityMissedAccess
} from './return-engine/integration';

// ==========================================
// TYPES
// ==========================================

/**
 * Opportunity release state
 */
export type ReleaseState = 'EXCLUSIVE' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'CLOSED';

/**
 * Opportunity with scarcity metadata
 */
export interface ScarceOpportunity {
  id: string;
  title: string;
  therapeuticArea: string;
  trialPhase: string;
  createdAt: Date;
  releaseState: ReleaseState;
  valueTier: 'HIGH' | 'MEDIUM' | 'STANDARD';
  minimumTierRequired: AccessTier;
  currentVisibleCount: number;  // How many operators can see this
  exclusivityEndsAt?: Date;
  tier2AccessAt?: Date;
  tier3AccessAt?: Date;
}

/**
 * Visibility limit result
 */
export interface VisibilityLimit {
  maxOpportunities: number;
  currentVisible: number;
  canShowMore: boolean;
  remainingSlots: number;
}

/**
 * Missed opportunity record
 */
export interface MissedOpportunity {
  opportunityId: string;
  operatorId: string;  // Hashed
  wasEligible: boolean;
  sawOpportunity: boolean;
  missedReason: 'TIER_TOO_LOW' | 'DELAYED_ACCESS' | 'CAP_REACHED' | 'FILLED_BEFORE_VISIBLE';
  higherPriorityCount: number;  // How many saw it first
  potentialValue?: number;
}

// ==========================================
// RELEASE LOGIC
// ==========================================

/**
 * Calculate release timeline for an opportunity
 */
export function calculateReleaseTimeline(params: {
  opportunityCreatedAt: Date;
  valueTier: 'HIGH' | 'MEDIUM' | 'STANDARD';
}): {
  exclusiveEnds: Date;
  tier2Access: Date;
  tier3Access: Date;
  releaseState: ReleaseState;
} {
  const { opportunityCreatedAt, valueTier } = params;
  
  // High-value opportunities have longer exclusivity
  const exclusivityHours = valueTier === 'HIGH' ? 24 : valueTier === 'MEDIUM' ? 12 : 6;
  
  const exclusiveEnds = new Date(opportunityCreatedAt.getTime() + exclusivityHours * 60 * 60 * 1000);
  const tier2Access = new Date(opportunityCreatedAt.getTime() + 6 * 60 * 60 * 1000);
  const tier3Access = new Date(opportunityCreatedAt.getTime() + 24 * 60 * 60 * 1000);
  
  const now = new Date();
  let releaseState: ReleaseState;
  
  if (now < exclusiveEnds) {
    releaseState = 'EXCLUSIVE';
  } else if (now < tier2Access) {
    releaseState = 'TIER_1';
  } else if (now < tier3Access) {
    releaseState = 'TIER_2';
  } else {
    releaseState = 'TIER_3';
  }
  
  return { exclusiveEnds, tier2Access, tier3Access, releaseState };
}

/**
 * Determine current release state
 */
export function getCurrentReleaseState(opportunity: ScarceOpportunity): ReleaseState {
  const now = new Date();
  
  if (opportunity.exclusivityEndsAt && now < opportunity.exclusivityEndsAt) {
    return 'EXCLUSIVE';
  }
  if (now < (opportunity.tier2AccessAt || new Date())) {
    return 'TIER_1';
  }
  if (now < (opportunity.tier3AccessAt || new Date())) {
    return 'TIER_2';
  }
  return 'TIER_3';
}

/**
 * Check if operator should see opportunity now
 */
export function shouldShowOpportunity(params: {
  opportunity: ScarceOpportunity;
  operatorTier: AccessTier;
  operatorVisibleCount: number;
  operatorMaxVisible: number;
}): {
  show: boolean;
  reason: string;
  delayHours?: number;
} {
  const { opportunity, operatorTier, operatorVisibleCount, operatorMaxVisible } = params;
  const now = new Date();
  
  // Check visibility cap
  if (operatorVisibleCount >= operatorMaxVisible) {
    return {
      show: false,
      reason: 'Visibility cap reached. Complete current opportunities to see more.'
    };
  }
  
  // Check tier-based access
  const tierOrder: AccessTier[] = ['TIER_1', 'TIER_2', 'TIER_3'];
  const operatorTierIndex = tierOrder.indexOf(operatorTier);
  
  // During exclusive period, only TIER_1
  if (opportunity.releaseState === 'EXCLUSIVE') {
    if (operatorTier !== 'TIER_1') {
      const hoursUntilAccess = opportunity.exclusivityEndsAt 
        ? Math.ceil((opportunity.exclusivityEndsAt.getTime() - now.getTime()) / (60 * 60 * 1000))
        : 0;
      return {
        show: false,
        reason: 'Exclusive access period for priority operators',
        delayHours: hoursUntilAccess
      };
    }
    return { show: true, reason: 'Exclusive access granted' };
  }
  
  // TIER_1 period
  if (opportunity.releaseState === 'TIER_1') {
    if (operatorTier === 'TIER_1') {
      return { show: true, reason: 'Priority access' };
    }
    const delayHours = opportunity.tier2AccessAt
      ? Math.ceil((opportunity.tier2AccessAt.getTime() - now.getTime()) / (60 * 60 * 1000))
      : 0;
    return {
      show: false,
      reason: 'Priority access period',
      delayHours: Math.max(0, delayHours)
    };
  }
  
  // TIER_2 period
  if (opportunity.releaseState === 'TIER_2') {
    if (operatorTier === 'TIER_1' || operatorTier === 'TIER_2') {
      return { show: true, reason: 'Access granted' };
    }
    const delayHours = opportunity.tier3AccessAt
      ? Math.ceil((opportunity.tier3AccessAt.getTime() - now.getTime()) / (60 * 60 * 1000))
      : 0;
    return {
      show: false,
      reason: 'Earlier access available with improved contribution quality',
      delayHours: Math.max(0, delayHours)
    };
  }
  
  // TIER_3 - everyone can see
  return { show: true, reason: 'General access' };
}

// ==========================================
// VISIBILITY LIMITS
// ==========================================

/**
 * Calculate visibility limit for an operator
 */
export function calculateVisibilityLimit(params: {
  operatorTier: AccessTier;
  currentVisibleCount: number;
}): VisibilityLimit {
  const tierConfig = TIER_CONFIG[params.operatorTier];
  const maxOpportunities = tierConfig.maxVisibleOpportunities;
  
  return {
    maxOpportunities,
    currentVisible: params.currentVisibleCount,
    canShowMore: params.currentVisibleCount < maxOpportunities,
    remainingSlots: Math.max(0, maxOpportunities - params.currentVisibleCount)
  };
}

// ==========================================
// MISSED OPPORTUNITY TRACKING
// ==========================================

/**
 * Missed opportunity tracker
 */
export interface MissedOpportunityTracker {
  operatorId: string;
  missedOpportunities: MissedOpportunity[];
  totalMissedValue: number;
  missedCount: number;
  topMissedReasons: Array<{ reason: string; count: number }>;
}

/**
 * Track a missed opportunity
 */
export function trackMissedOpportunity(params: {
  opportunityId: string;
  operatorId: string;
  operatorTier: AccessTier;
  opportunityValueTier: 'HIGH' | 'MEDIUM' | 'STANDARD';
  filledBeforeVisible: boolean;
}): MissedOpportunity {
  const { opportunityId, operatorId, operatorTier, opportunityValueTier, filledBeforeVisible } = params;
  
  let missedReason: MissedOpportunity['missedReason'];
  let wasEligible = true;
  
  if (operatorTier === 'TIER_3' && opportunityValueTier === 'HIGH') {
    missedReason = 'TIER_TOO_LOW';
    wasEligible = false;
  } else if (filledBeforeVisible) {
    missedReason = 'FILLED_BEFORE_VISIBLE';
  } else if (operatorTier === 'TIER_3') {
    missedReason = 'DELAYED_ACCESS';
  } else {
    missedReason = 'CAP_REACHED';
  }
  
  return {
    opportunityId,
    operatorId: generateSecureLookupKey(operatorId),
    wasEligible,
    sawOpportunity: false,
    missedReason,
    higherPriorityCount: operatorTier === 'TIER_1' ? 0 : operatorTier === 'TIER_2' ? 1 : 2
  };
}

/**
 * Generate missed opportunity summary
 */
export function generateMissedOpportunitySummary(tracker: MissedOpportunityTracker): string[] {
  const messages: string[] = [];
  
  if (tracker.missedCount > 0) {
    messages.push(`${tracker.missedCount} opportunities were accessed by higher-priority operators.`);
  }
  
  // Group by reason
  const reasonCounts = new Map<string, number>();
  tracker.missedOpportunities.forEach(m => {
    reasonCounts.set(m.missedReason, (reasonCounts.get(m.missedReason) || 0) + 1);
  });
  
  reasonCounts.forEach((count, reason) => {
    if (reason === 'TIER_TOO_LOW') {
      messages.push(`${count} high-value opportunities required higher access priority.`);
    } else if (reason === 'FILLED_BEFORE_VISIBLE') {
      messages.push(`${count} opportunities were filled before becoming visible.`);
    }
  });
  
  messages.push('Improve contribution quality to unlock earlier access.');
  
  return messages;
}

// ==========================================
// UI SIGNALS (SUBTLE, NOT GAMIFIED)
// ==========================================

/**
 * Generate subtle UI signals
 */
export function generateUISignal(params: {
  operatorTier: AccessTier;
  delayedAccess: boolean;
  missedOpportunities: number;
  improvementPossible: boolean;
}): {
  primaryMessage: string;
  secondaryMessage?: string;
  actionHint?: string;
} {
  const { operatorTier, delayedAccess, missedOpportunities, improvementPossible } = params;
  
  if (operatorTier === 'TIER_1') {
    return {
      primaryMessage: 'Priority access active',
      secondaryMessage: missedOpportunities > 0 
        ? `${missedOpportunities} opportunities were matched to other operators`
        : undefined
    };
  }
  
  if (delayedAccess) {
    return {
      primaryMessage: 'Higher priority operators were matched first',
      secondaryMessage: 'Improve contribution quality to unlock earlier access',
      actionHint: 'Focus on detailed, outcome-backed contributions'
    };
  }
  
  if (missedOpportunities > 0) {
    return {
      primaryMessage: `${missedOpportunities} opportunities had earlier access for priority operators`,
      secondaryMessage: 'Improve contribution quality to unlock earlier access'
    };
  }
  
  return {
    primaryMessage: 'Access active',
    secondaryMessage: improvementPossible 
      ? 'Higher access priority available with improved contributions'
      : undefined
  };
}

// ==========================================
// RETURN ENGINE INTEGRATION
// ==========================================

/**
 * Fire opportunity release triggers for matched users
 * Call this when a new opportunity becomes visible
 */
export async function notifyOpportunityRelease(params: {
  opportunityId: string;
  matchedUsers: Array<{
    userId: string;
    matchScore: number;
    tier: AccessTier;
  }>;
}): Promise<void> {
  const { opportunityId, matchedUsers } = params;
  
  // Fire triggers in background
  onOpportunityReleased({
    opportunityId,
    matchedUserIds: matchedUsers
  }).catch(err => console.error('Return Engine trigger error:', err));
}

/**
 * Fire opportunity moving fast trigger
 * Call when an opportunity receives rapid interest
 */
export async function notifyOpportunityMovingFast(params: {
  opportunityId: string;
  matchedUserIds: string[];
  interestCount: number;
  timeSinceRelease: number; // hours
}): Promise<void> {
  const { opportunityId, matchedUserIds, interestCount, timeSinceRelease } = params;
  
  // Fire trigger in background
  onOpportunityMovingFast({
    opportunityId,
    matchedUserIds,
    interestCount,
    timeSinceRelease
  }).catch(err => console.error('Return Engine trigger error:', err));
}

/**
 * Fire missed opportunity triggers
 * Call when tracking a missed opportunity
 */
export async function notifyMissedOpportunity(params: {
  userId: string;
  opportunityId: string;
  operatorTier: AccessTier;
  missedReason: MissedOpportunity['missedReason'];
  matchScore?: number;
  thresholdScore?: number;
}): Promise<void> {
  const { userId, opportunityId, operatorTier, missedReason, matchScore, thresholdScore } = params;
  
  // Fire appropriate trigger based on reason
  if (missedReason === 'FILLED_BEFORE_VISIBLE' && matchScore && thresholdScore) {
    const gap = thresholdScore - matchScore;
    if (gap <= 0.05) { // Within 5%
      onOpportunityMissedClose({
        userId,
        opportunityId,
        matchScore,
        thresholdScore
      }).catch(err => console.error('Return Engine trigger error:', err));
    }
  } else if (missedReason === 'TIER_TOO_LOW') {
    onOpportunityMissedAccess({
      userId,
      opportunityId,
      tier: operatorTier,
      higherPriorityOperators: operatorTier === 'TIER_2' ? 1 : 2
    }).catch(err => console.error('Return Engine trigger error:', err));
  }
}

// ==========================================
// EXPORTS
// ==========================================

export const OpportunityScarcityEngine = {
  calculateReleaseTimeline,
  getCurrentReleaseState,
  shouldShowOpportunity,
  calculateVisibilityLimit,
  trackMissedOpportunity,
  generateMissedOpportunitySummary,
  generateUISignal,
  notifyOpportunityRelease,
  notifyOpportunityMovingFast,
  notifyMissedOpportunity
};