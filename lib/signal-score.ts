/**
 * SECTION 1: Economic Dependency Engine
 * 
 * Signal Score (SS) - Internal metric derived from TrustVector
 * NOT exposed publicly - used for access control and opportunity gating
 */

import { createHash } from 'crypto';
import { onTierImproved, onTierProximityBelow } from './return-engine/integration';

// ==========================================
// CORE TYPES
// ==========================================

/**
 * TrustVector - Multi-dimensional trust assessment
 * Internal representation, never exposed to UI
 */
export interface TrustVector {
  reliability: number;        // 0-1: Follow-through consistency
  quality: number;            // 0-1: Output quality rating
  outcome: number;            // 0-1: Successful project outcomes
  responsiveness: number;     // 0-1: Response time and engagement
  depth: number;              // 0-1: Contribution depth/quality
}

/**
 * SignalScore - Normalized 0-100 score
 * Derived from TrustVector, used for internal gating
 */
export interface SignalScore {
  score: number;              // 0-100 normalized
  percentile: number;         // 0-100 ranking among all operators
  tier: AccessTier;
  lastUpdated: Date;
  components: {
    reliabilityWeight: number;
    qualityWeight: number;
    outcomeWeight: number;
    responsivenessWeight: number;
    depthWeight: number;
  };
}

/**
 * AccessTier - Internal tier system
 * NOT displayed to users
 */
export type AccessTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

/**
 * Tier configuration
 */
export const TIER_CONFIG: Record<AccessTier, {
  percentileRange: [number, number];
  accessDelay: number;        // hours before opportunity visibility
  maxVisibleOpportunities: number;
  exclusivityWindow: number;  // hours of exclusive access
}> = {
  TIER_1: {
    percentileRange: [80, 100],
    accessDelay: 0,           // Immediate access
    maxVisibleOpportunities: 50,
    exclusivityWindow: 24     // 24 hours exclusive access
  },
  TIER_2: {
    percentileRange: [40, 79],
    accessDelay: 6,           // 6 hour delay
    maxVisibleOpportunities: 30,
    exclusivityWindow: 0
  },
  TIER_3: {
    percentileRange: [0, 39],
    accessDelay: 24,          // 24 hour delay
    maxVisibleOpportunities: 15,
    exclusivityWindow: 0
  }
};

/**
 * Weight configuration for SS calculation
 */
const TRUST_WEIGHTS = {
  reliabilityWeight: 0.25,
  qualityWeight: 0.25,
  outcomeWeight: 0.20,
  responsivenessWeight: 0.15,
  depthWeight: 0.15
};

// ==========================================
// SIGNAL SCORE CALCULATION
// ==========================================

/**
 * Calculate Signal Score from TrustVector
 */
export function calculateSignalScore(
  trustVector: TrustVector,
  allOperatorScores?: number[]  // For percentile calculation
): SignalScore {
  // Calculate weighted score
  const weightedScore = 
    trustVector.reliability * TRUST_WEIGHTS.reliabilityWeight +
    trustVector.quality * TRUST_WEIGHTS.qualityWeight +
    trustVector.outcome * TRUST_WEIGHTS.outcomeWeight +
    trustVector.responsiveness * TRUST_WEIGHTS.responsivenessWeight +
    trustVector.depth * TRUST_WEIGHTS.depthWeight;

  // Normalize to 0-100
  const score = Math.round(weightedScore * 100);

  // Calculate percentile
  let percentile = 50;
  if (allOperatorScores && allOperatorScores.length > 0) {
    const belowCount = allOperatorScores.filter(s => s < score).length;
    percentile = Math.round((belowCount / allOperatorScores.length) * 100);
  }

  // Determine tier
  const tier = determineTier(percentile);

  return {
    score,
    percentile,
    tier,
    lastUpdated: new Date(),
    components: { ...TRUST_WEIGHTS }
  };
}

/**
 * Determine access tier from percentile
 */
export function determineTier(percentile: number): AccessTier {
  if (percentile >= TIER_CONFIG.TIER_1.percentileRange[0]) {
    return 'TIER_1';
  } else if (percentile >= TIER_CONFIG.TIER_2.percentileRange[0]) {
    return 'TIER_2';
  }
  return 'TIER_3';
}

/**
 * Get tier configuration
 */
export function getTierConfig(tier: AccessTier): typeof TIER_CONFIG[AccessTier] {
  return TIER_CONFIG[tier];
}

// ==========================================
// ACCESS GATING
// ==========================================

/**
 * Opportunity access result
 */
export interface AccessResult {
  granted: boolean;
  tier: AccessTier;
  delayHours: number;
  reason: string;
  exclusivityWindow?: number;
  maxVisible: number;
}

/**
 * Check if operator can access an opportunity
 */
export function checkOpportunityAccess(params: {
  operatorSignalScore: SignalScore;
  opportunityTier: AccessTier;  // Minimum tier required
  opportunityCreatedAt: Date;
  currentValueThreshold?: number;  // For high-value opportunities
}): AccessResult {
  const { operatorSignalScore, opportunityTier, opportunityCreatedAt, currentValueThreshold } = params;
  const tierConfig = TIER_CONFIG[operatorSignalScore.tier];

  // Hard gate: Check if operator's tier meets minimum
  const tierOrder: AccessTier[] = ['TIER_1', 'TIER_2', 'TIER_3'];
  const operatorTierIndex = tierOrder.indexOf(operatorSignalScore.tier);
  const requiredTierIndex = tierOrder.indexOf(opportunityTier);

  if (operatorTierIndex > requiredTierIndex) {
    return {
      granted: false,
      tier: operatorSignalScore.tier,
      delayHours: -1,
      reason: 'Insufficient access tier for this opportunity',
      maxVisible: tierConfig.maxVisibleOpportunities
    };
  }

  // Check time-based access
  const now = new Date();
  const opportunityAge = (now.getTime() - opportunityCreatedAt.getTime()) / (1000 * 60 * 60); // hours
  
  if (opportunityAge < tierConfig.accessDelay) {
    return {
      granted: false,
      tier: operatorSignalScore.tier,
      delayHours: tierConfig.accessDelay - opportunityAge,
      reason: `Access available in ${Math.ceil(tierConfig.accessDelay - opportunityAge)} hours`,
      maxVisible: tierConfig.maxVisibleOpportunities
    };
  }

  return {
    granted: true,
    tier: operatorSignalScore.tier,
    delayHours: 0,
    reason: 'Access granted',
    exclusivityWindow: tierConfig.exclusivityWindow,
    maxVisible: tierConfig.maxVisibleOpportunities
  };
}

// ==========================================
// INCOME COUPLING
// ==========================================

/**
 * Income impact record
 * Tracks opportunities unlocked/missed due to SS
 */
export interface IncomeImpactRecord {
  id: string;
  operatorId: string;  // Hashed
  timestamp: Date;
  type: 'UNLOCKED' | 'MISSED' | 'DELAYED';
  opportunityId: string;
  opportunityValue?: number;
  signalScoreAtTime: number;
  tierAtTime: AccessTier;
  reason: string;
}

/**
 * Generate income impact summary for operator
 */
export interface IncomeImpactSummary {
  operatorId: string;
  periodStart: Date;
  periodEnd: Date;
  unlockedCount: number;
  missedCount: number;
  delayedCount: number;
  estimatedValueUnlocked: number;
  estimatedValueMissed: number;
  currentSignalScore: number;
  currentTier: AccessTier;
  message: string;
}

/**
 * Generate private income impact message
 * Shown only to the operator, not public
 */
export function generateIncomeImpactMessage(summary: IncomeImpactSummary): string {
  const lines: string[] = [];
  
  if (summary.missedCount > 0) {
    lines.push(`This period, ${summary.missedCount} opportunities were accessed by higher-priority operators first.`);
  }
  
  if (summary.unlockedCount > 0) {
    lines.push(`Your contribution quality unlocked ${summary.unlockedCount} priority opportunities.`);
  }
  
  if (summary.delayedCount > 0) {
    lines.push(`${summary.delayedCount} opportunities had delayed visibility due to access timing.`);
  }

  // Improvement suggestion
  if (summary.currentTier !== 'TIER_1') {
    const nextTier = summary.currentTier === 'TIER_3' ? 'TIER_2' : 'TIER_1';
    lines.push(`Improve contribution quality to unlock earlier access.`);
  }

  return lines.join(' ');
}

// ==========================================
// OPPORTUNTIY VISIBILITY TRACKING
// ==========================================

/**
 * Track opportunity visibility for an operator
 */
export interface OpportunityVisibilityRecord {
  opportunityId: string;
  operatorId: string;  // Hashed
  visibleAt?: Date;
  accessDelay: number;
  wasMissed: boolean;
  missedReason?: string;
  higherPriorityOperators?: number;  // Count of operators who saw it first
}

/**
 * Calculate when an operator should see an opportunity
 */
export function calculateVisibilityTime(params: {
  opportunityCreatedAt: Date;
  operatorTier: AccessTier;
}): Date {
  const tierConfig = TIER_CONFIG[params.operatorTier];
  const delayMs = tierConfig.accessDelay * 60 * 60 * 1000;
  return new Date(params.opportunityCreatedAt.getTime() + delayMs);
}

// ==========================================
// TIER TRACKING
// ==========================================

/**
 * Track tier changes and fire Return Engine triggers
 * Call this after updating a user's signal score
 */
export async function trackTierChange(params: {
  userId: string;
  previousScore: number;
  newScore: number;
  previousTier?: AccessTier;
}): Promise<void> {
  const { userId, previousScore, newScore, previousTier } = params;
  
  // Calculate new tier
  const newTier = determineTier(newScore);
  
  // If previous tier was provided, check for improvement
  if (previousTier && previousTier !== newTier) {
    const tierOrder: AccessTier[] = ['TIER_1', 'TIER_2', 'TIER_3'];
    const previousIndex = tierOrder.indexOf(previousTier);
    const newIndex = tierOrder.indexOf(newTier);
    
    // Tier improved (lower index = better)
    if (newIndex < previousIndex) {
      // Fire tier improvement trigger in background
      onTierImproved({
        userId,
        previousTier,
        newTier
      }).catch(err => console.error('Return Engine trigger error:', err));
    }
  }
  
  // Check if user is close to dropping a tier (proximity warning)
  const tierThresholds = {
    'TIER_1': 80,  // Below 80 drops to TIER_2
    'TIER_2': 40,  // Below 40 drops to TIER_3
    'TIER_3': 0    // Can't drop further
  };
  
  const threshold = tierThresholds[newTier];
  const gap = newScore - threshold;
  
  // If within 10 points of dropping, fire proximity warning
  if (gap > 0 && gap <= 10) {
    onTierProximityBelow({
      userId,
      currentScore: newScore,
      thresholdScore: threshold,
      gap: gap / 100  // Normalize to 0-1
    }).catch(err => console.error('Return Engine trigger error:', err));
  }
}

// ==========================================
// EXPORTS
// ==========================================

export const SignalScoreEngine = {
  calculateSignalScore,
  determineTier,
  getTierConfig,
  checkOpportunityAccess,
  calculateVisibilityTime,
  generateIncomeImpactMessage,
  trackTierChange
};