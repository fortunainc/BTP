/**
 * SECTION 5: Behavioral Pressure System
 * 
 * NOT social. NOT visible clout.
 * System-level behavioral enforcement only.
 * 
 * No Likes / No Followers / No Public Metrics
 */

import { AccessTier, SignalScore } from './signal-score';

// ==========================================
// TYPES
// ==========================================

/**
 * Feedback loop type
 */
export type FeedbackLoopType = 
  | 'WEEKLY_SUMMARY'
  | 'ACCESS_CHANGE'
  | 'MISSED_OPPORTUNITY'
  | 'CONTRIBUTION_IMPACT'
  | 'IMPROVEMENT_HINT';

/**
 * System message (not social notification)
 */
export interface SystemMessage {
  id: string;
  operatorId: string;  // Hashed
  type: FeedbackLoopType;
  timestamp: Date;
  title: string;
  content: string;
  read: boolean;
  actionable: boolean;
  actionHint?: string;
}

/**
 * Weekly summary data
 */
export interface WeeklySummary {
  operatorId: string;
  weekStart: Date;
  weekEnd: Date;
  
  // Contribution impact
  contributionsMade: number;
  contributionImpact: number;       // 0-1 score
  
  // Opportunity access
  opportunitiesUnlocked: number;
  opportunitiesMissed: number;
  accessPriorityChange: number;     // -1 to +1
  
  // Trust vector changes
  reliabilityChange: number;
  qualityChange: number;
  outcomeChange: number;
  
  // Dynamic signals
  accessPriorityImproved: boolean;
  signalQualityDropped: boolean;
  peerComparison: string;           // "Operators with similar profiles..."
  
  // Generated message
  message: string;
}

/**
 * Dynamic signal type
 */
export interface DynamicSignal {
  type: 'ACCESS_IMPROVED' | 'ACCESS_DECLINED' | 'SIGNAL_DROPPED' | 'PEER_OUTPERFORMING';
  message: string;
  timestamp: Date;
  actionable: boolean;
  actionHint?: string;
}

/**
 * Contribution impact summary
 */
export interface ContributionImpactSummary {
  period: {
    start: Date;
    end: Date;
  };
  totalContributions: number;
  approvedContributions: number;
  impactScore: number;              // 0-100
  impactOnAccess: number;           // How much this affected access tier
  keyAreas: Array<{
    area: string;
    contributionCount: number;
    impactScore: number;
  }>;
}

/**
 * Peer comparison data (anonymized)
 */
export interface PeerComparison {
  operatorPercentile: number;
  similarProfileCount: number;      // Number of operators in similar profile bucket
  averageScoreInBucket: number;
  operatorScore: number;
  outperformingPercentage: number;  // What % of peers they're outperforming
  message: string;
}

// ==========================================
// WEEKLY FEEDBACK LOOPS
// ==========================================

/**
 * Generate weekly system summary
 */
export function generateWeeklySummary(params: {
  operatorId: string;
  weekStart: Date;
  weekEnd: Date;
  contributionsMade: number;
  contributionImpact: number;
  opportunitiesUnlocked: number;
  opportunitiesMissed: number;
  previousSignalScore: number;
  currentSignalScore: number;
  trustVectorChanges: {
    reliability: number;
    quality: number;
    outcome: number;
  };
}): WeeklySummary {
  const {
    operatorId,
    weekStart,
    weekEnd,
    contributionsMade,
    contributionImpact,
    opportunitiesUnlocked,
    opportunitiesMissed,
    previousSignalScore,
    currentSignalScore,
    trustVectorChanges
  } = params;
  
  // Calculate changes
  const accessPriorityChange = (currentSignalScore - previousSignalScore) / 100;
  const accessPriorityImproved = currentSignalScore > previousSignalScore;
  const signalQualityDropped = currentSignalScore < previousSignalScore;
  
  // Generate peer comparison message
  const peerComparison = generatePeerComparisonMessage(currentSignalScore, contributionsMade);
  
  // Generate main message
  const message = generateWeeklyMessage({
    contributionsMade,
    contributionImpact,
    opportunitiesUnlocked,
    opportunitiesMissed,
    accessPriorityImproved,
    signalQualityDropped,
    peerComparison
  });
  
  return {
    operatorId,
    weekStart,
    weekEnd,
    contributionsMade,
    contributionImpact,
    opportunitiesUnlocked,
    opportunitiesMissed,
    accessPriorityChange,
    reliabilityChange: trustVectorChanges.reliability,
    qualityChange: trustVectorChanges.quality,
    outcomeChange: trustVectorChanges.outcome,
    accessPriorityImproved,
    signalQualityDropped,
    peerComparison,
    message
  };
}

/**
 * Generate weekly message
 */
function generateWeeklyMessage(params: {
  contributionsMade: number;
  contributionImpact: number;
  opportunitiesUnlocked: number;
  opportunitiesMissed: number;
  accessPriorityImproved: boolean;
  signalQualityDropped: boolean;
  peerComparison: string;
}): string {
  const lines: string[] = [];
  
  // Contribution impact
  if (params.contributionsMade > 0) {
    lines.push(`This week, you made ${params.contributionsMade} contributions with an impact score of ${Math.round(params.contributionImpact * 100)}%.`);
  } else {
    lines.push('No contributions were made this week.');
  }
  
  // Opportunity access
  if (params.opportunitiesUnlocked > 0) {
    lines.push(`Your contributions unlocked ${params.opportunitiesUnlocked} priority opportunities.`);
  }
  
  if (params.opportunitiesMissed > 0) {
    lines.push(`${params.opportunitiesMissed} opportunities were accessed by higher-priority operators first.`);
  }
  
  // Access change
  if (params.accessPriorityImproved) {
    lines.push('Your access priority improved.');
  } else if (params.signalQualityDropped) {
    lines.push('Your signal quality decreased this week.');
    lines.push('Focus on detailed, outcome-backed contributions to improve access.');
  }
  
  return lines.join(' ');
}

/**
 * Generate peer comparison message
 */
function generatePeerComparisonMessage(signalScore: number, contributions: number): string {
  if (signalScore >= 80) {
    return 'You are among the highest-priority operators in your capability area.';
  } else if (signalScore >= 60) {
    return 'Operators with similar profiles are increasing their contribution frequency.';
  } else if (contributions < 2) {
    return 'Operators with similar profiles are outperforming in contribution frequency.';
  }
  return 'Your contribution pace is steady. Increase frequency for higher access priority.';
}

// ==========================================
// DYNAMIC SIGNALS
// ==========================================

/**
 * Generate access improvement signal
 */
export function generateAccessImprovedSignal(params: {
  previousTier: AccessTier;
  newTier: AccessTier;
}): DynamicSignal {
  return {
    type: 'ACCESS_IMPROVED',
    message: `Your access priority has improved. You now have ${getTierDescription(params.newTier)}.`,
    timestamp: new Date(),
    actionable: false
  };
}

/**
 * Generate access declined signal
 */
export function generateAccessDeclinedSignal(params: {
  previousTier: AccessTier;
  newTier: AccessTier;
}): DynamicSignal {
  return {
    type: 'ACCESS_DECLINED',
    message: 'Your access priority has decreased. Improve contribution quality to restore access.',
    timestamp: new Date(),
    actionable: true,
    actionHint: 'Focus on detailed, outcome-backed contributions with specific examples.'
  };
}

/**
 * Generate signal dropped notification
 */
export function generateSignalDroppedSignal(params: {
  previousScore: number;
  currentScore: number;
}): DynamicSignal {
  const drop = params.previousScore - params.currentScore;
  
  return {
    type: 'SIGNAL_DROPPED',
    message: `Your signal quality dropped by ${drop} points. This may affect opportunity access.`,
    timestamp: new Date(),
    actionable: true,
    actionHint: 'Review recent contributions for completeness and outcome details.'
  };
}

/**
 * Generate peer outperforming signal
 */
export function generatePeerOutperformingSignal(params: {
  operatorPercentile: number;
  gapToNextTier: number;
}): DynamicSignal {
  return {
    type: 'PEER_OUTPERFORMING',
    message: `Operators with similar profiles are outperforming. You're ${params.gapToNextTier} points from the next access level.`,
    timestamp: new Date(),
    actionable: true,
    actionHint: 'Increase contribution frequency and focus on outcome documentation.'
  };
}

/**
 * Get tier description for signals
 */
function getTierDescription(tier: AccessTier): string {
  switch (tier) {
    case 'TIER_1':
      return 'immediate access to all opportunities with exclusive early access';
    case 'TIER_2':
      return 'priority access to most opportunities with minimal delay';
    case 'TIER_3':
      return 'standard access to opportunities';
  }
}

// ==========================================
// CONTRIBUTION IMPACT TRACKING
// ==========================================

/**
 * Calculate contribution impact summary
 */
export function calculateContributionImpact(params: {
  operatorId: string;
  periodStart: Date;
  periodEnd: Date;
  contributions: Array<{
    id: string;
    area: string;
    impactScore: number;
    approved: boolean;
  }>;
  previousSignalScore: number;
  currentSignalScore: number;
}): ContributionImpactSummary {
  const { operatorId, periodStart, periodEnd, contributions, previousSignalScore, currentSignalScore } = params;
  
  const totalContributions = contributions.length;
  const approvedContributions = contributions.filter(c => c.approved).length;
  const impactScore = contributions.reduce((sum, c) => sum + c.impactScore, 0) / Math.max(1, totalContributions) * 100;
  const impactOnAccess = (currentSignalScore - previousSignalScore) / 100;
  
  // Group by area
  const areaMap = new Map<string, { count: number; totalImpact: number }>();
  contributions.forEach(c => {
    const existing = areaMap.get(c.area) || { count: 0, totalImpact: 0 };
    areaMap.set(c.area, {
      count: existing.count + 1,
      totalImpact: existing.totalImpact + c.impactScore
    });
  });
  
  const keyAreas = Array.from(areaMap.entries()).map(([area, data]) => ({
    area,
    contributionCount: data.count,
    impactScore: data.totalImpact / data.count
  }));
  
  return {
    period: { start: periodStart, end: periodEnd },
    totalContributions,
    approvedContributions,
    impactScore,
    impactOnAccess,
    keyAreas: keyAreas.sort((a, b) => b.impactScore - a.impactScore).slice(0, 5)
  };
}

// ==========================================
// SYSTEM MESSAGE GENERATION
// ==========================================

/**
 * Create system message from feedback
 */
export function createSystemMessage(params: {
  operatorId: string;
  type: FeedbackLoopType;
  content: string;
  actionable?: boolean;
  actionHint?: string;
}): SystemMessage {
  const titles: Record<FeedbackLoopType, string> = {
    WEEKLY_SUMMARY: 'Weekly Impact Summary',
    ACCESS_CHANGE: 'Access Priority Update',
    MISSED_OPPORTUNITY: 'Opportunity Access Update',
    CONTRIBUTION_IMPACT: 'Contribution Impact Report',
    IMPROVEMENT_HINT: 'Improvement Suggestion'
  };
  
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    operatorId: params.operatorId,
    type: params.type,
    timestamp: new Date(),
    title: titles[params.type],
    content: params.content,
    read: false,
    actionable: params.actionable ?? false,
    actionHint: params.actionHint
  };
}

/**
 * Generate batch system messages for operator
 */
export function generateOperatorMessages(params: {
  operatorId: string;
  weeklySummary?: WeeklySummary;
  accessChange?: { previous: AccessTier; current: AccessTier };
  signalChange?: { previous: number; current: number };
  missedOpportunities?: number;
}): SystemMessage[] {
  const messages: SystemMessage[] = [];
  
  // Weekly summary
  if (params.weeklySummary) {
    messages.push(createSystemMessage({
      operatorId: params.operatorId,
      type: 'WEEKLY_SUMMARY',
      content: params.weeklySummary.message,
      actionable: params.weeklySummary.signalQualityDropped,
      actionHint: params.weeklySummary.signalQualityDropped 
        ? 'Focus on detailed, outcome-backed contributions' 
        : undefined
    }));
  }
  
  // Access change
  if (params.accessChange && params.accessChange.previous !== params.accessChange.current) {
    const improved = getTierOrder(params.accessChange.current) < getTierOrder(params.accessChange.previous);
    const signal = improved 
      ? generateAccessImprovedSignal({
          previousTier: params.accessChange.previous,
          newTier: params.accessChange.current
        })
      : generateAccessDeclinedSignal({
          previousTier: params.accessChange.previous,
          newTier: params.accessChange.current
        });
    
    messages.push(createSystemMessage({
      operatorId: params.operatorId,
      type: 'ACCESS_CHANGE',
      content: signal.message,
      actionable: signal.actionable,
      actionHint: signal.actionHint
    }));
  }
  
  // Missed opportunities
  if (params.missedOpportunities && params.missedOpportunities > 0) {
    messages.push(createSystemMessage({
      operatorId: params.operatorId,
      type: 'MISSED_OPPORTUNITY',
      content: `${params.missedOpportunities} opportunities were accessed by higher-priority operators first.`,
      actionable: true,
      actionHint: 'Improve contribution quality to unlock earlier access'
    }));
  }
  
  return messages;
}

/**
 * Get tier order (lower = better)
 */
function getTierOrder(tier: AccessTier): number {
  switch (tier) {
    case 'TIER_1': return 1;
    case 'TIER_2': return 2;
    case 'TIER_3': return 3;
  }
}

// ==========================================
// ENFORCEMENT: NO SOCIAL FEATURES
// ==========================================

/**
 * Verify no social features exist
 * This is a validation function to ensure the platform stays non-social
 */
export function validateNoSocialFeatures(params: {
  features: Array<{
    name: string;
    type: string;
  }>;
}): { valid: boolean; violations: string[] } {
  const socialTypes = [
    'LIKE', 'FOLLOW', 'SHARE', 'COMMENT', 'MENTION', 
    'PROFILE_VISIT', 'PUBLIC_SCORE', 'LEADERBOARD', 'BADGE'
  ];
  
  const violations: string[] = [];
  
  params.features.forEach(feature => {
    if (socialTypes.includes(feature.type.toUpperCase())) {
      violations.push(`Social feature detected: ${feature.name} (${feature.type})`);
    }
  });
  
  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * List of prohibited social features
 */
export const PROHIBITED_FEATURES = [
  'Likes',
  'Followers',
  'Following',
  'Public Profiles',
  'Public Scores',
  'Leaderboards',
  'Badges',
  'Achievements (Public)',
  'Social Sharing',
  'Comments on Profiles',
  'Mentions',
  'Endorsements'
] as const;

// ==========================================
// EXPORTS
// ==========================================

export const BehavioralPressureEngine = {
  generateWeeklySummary,
  generateAccessImprovedSignal,
  generateAccessDeclinedSignal,
  generateSignalDroppedSignal,
  generatePeerOutperformingSignal,
  calculateContributionImpact,
  createSystemMessage,
  generateOperatorMessages,
  validateNoSocialFeatures
};