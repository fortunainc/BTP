/**
 * SECTION 4: Organization Control Layer
 * 
 * Organization dashboard, ROI tracking, and decision support
 * View matched CapabilityIdentities ONLY - no browsing pool
 */

import { generateSecureLookupKey } from './capability-identity-secure';
import { AccessTier } from './signal-score';

// ==========================================
// TYPES
// ==========================================

/**
 * Match view for organization (sanitized)
 */
export interface OrganizationMatchView {
  matchId: string;
  capabilityIdentity: {
    profileId: string;           // Anonymous profile ID
    matchScore: number;
    executionContextReasoning: string;
    patternFitExplanation: string;
    outcomeBackedJustification: string;
    therapeuticAreas: string[];  // Bands, not exact
    experienceBand: string;
    reliabilityBand: string;
    outcomeBand: string;
  };
  matchCreatedAt: Date;
  status: 'NEW' | 'VIEWED' | 'INTERVIEW_REQUESTED' | 'HIRED' | 'PASSED';
  responseStatus?: 'PENDING' | 'INTERESTED' | 'DECLINED';
}

/**
 * Organization dashboard metrics
 */
export interface OrganizationMetrics {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  
  // Match metrics
  totalMatches: number;
  newMatches: number;
  avgMatchScore: number;
  
  // Response metrics
  responseRate: number;           // % of matches responded to
  avgResponseTime: number;        // hours
  interviewRequestRate: number;   // % of matches interviewed
  
  // Hiring metrics
  hiresCompleted: number;
  avgTimeToHire: number;          // days
  hireConversionRate: number;     // matches → hires
  
  // Outcome metrics
  successfulOutcomes: number;
  avgOperatorRating: number;
  rehireRate: number;
}

/**
 * ROI comparison data
 */
export interface ROIComparison {
  metric: string;
  btpValue: number;
  baselineValue: number;
  improvement: number;            // percentage
  unit: string;
}

/**
 * ROI dashboard data
 */
export interface ROIDashboard {
  organizationId: string;
  comparisonPeriod: {
    start: Date;
    end: Date;
  };
  
  comparisons: ROIComparison[];
  
  summary: {
    timeToHireImprovement: number;    // %
    retentionImprovement: number;      // %
    outcomeQualityImprovement: number; // %
    costSavings: number;               // estimated $
  };
  
  totalFeesPaid: number;
  totalContractValue: number;
  roiPercentage: number;              // (value - fees) / fees
}

/**
 * Decision support indicator
 */
export interface DecisionSupportIndicator {
  matchId: string;
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'CONSIDER' | 'PASS';
  confidence: number;
  factors: string[];
  riskFlags: RiskFlag[];
}

/**
 * Risk flag
 */
export interface RiskFlag {
  type: 'LOW_RELIABILITY' | 'LOW_OUTCOME_HISTORY' | 'CAPABILITY_GAP' | 'AVAILABILITY_ISSUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  mitigationSuggestion?: string;
}

/**
 * Time-to-hire tracking
 */
export interface TimeToHireRecord {
  matchId: string;
  organizationId: string;
  stages: {
    matchCreated: Date;
    firstViewed?: Date;
    interviewRequested?: Date;
    interviewCompleted?: Date;
    hireConfirmed?: Date;
  };
  totalDays?: number;
  bottleneck?: string;
}

// ==========================================
// ORGANIZATION DASHBOARD
// ==========================================

/**
 * Generate organization dashboard view
 */
export function generateOrganizationDashboard(params: {
  organizationId: string;
  matches: OrganizationMatchView[];
  metrics: OrganizationMetrics;
  recentActivity: Array<{
    type: string;
    timestamp: Date;
    description: string;
  }>;
}): {
  summary: {
    newMatches: number;
    pendingResponses: number;
    activeInterviews: number;
    recentHires: number;
  };
  matches: OrganizationMatchView[];
  metrics: OrganizationMetrics;
  alerts: string[];
} {
  const newMatches = params.matches.filter(m => m.status === 'NEW');
  const pendingResponses = params.matches.filter(m => m.status === 'VIEWED' && !m.responseStatus);
  const activeInterviews = params.matches.filter(m => m.status === 'INTERVIEW_REQUESTED');
  const recentHires = params.matches.filter(m => m.status === 'HIRED');
  
  const alerts: string[] = [];
  
  // Generate alerts based on metrics
  if (params.metrics.responseRate < 0.5) {
    alerts.push('Response rate is below 50%. Responding to matches improves future matching quality.');
  }
  
  if (newMatches.length > 10) {
    alerts.push(`${newMatches.length} new matches awaiting review.`);
  }
  
  return {
    summary: {
      newMatches: newMatches.length,
      pendingResponses: pendingResponses.length,
      activeInterviews: activeInterviews.length,
      recentHires: recentHires.length
    },
    matches: params.matches,
    metrics: params.metrics,
    alerts
  };
}

/**
 * Sanitize match reasoning for organization view
 * Ensures no correlation risk
 */
export function sanitizeMatchReasoning(reasoning: string): string {
  // Remove any potential identifiers
  let sanitized = reasoning;
  
  // Remove specific site names
  sanitized = sanitized.replace(/at\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g, 'at a clinical site');
  
  // Remove sponsor references
  sanitized = sanitized.replace(/with\s+[A-Z][a-z]+/g, 'with a sponsor');
  
  // Remove specific dates
  sanitized = sanitized.replace(/\d{4}-\d{2}-\d{2}/g, '[DATE]');
  
  return sanitized;
}

// ==========================================
// ROI DASHBOARD
// ==========================================

/**
 * Calculate ROI comparisons
 */
export function calculateROIComparisons(params: {
  btpMetrics: {
    avgTimeToHire: number;
    retentionRate: number;
    outcomeQualityScore: number;
  };
  baselineMetrics: {
    avgTimeToHire: number;
    retentionRate: number;
    outcomeQualityScore: number;
  };
}): ROIComparison[] {
  const { btpMetrics, baselineMetrics } = params;
  
  return [
    {
      metric: 'Time to Hire',
      btpValue: btpMetrics.avgTimeToHire,
      baselineValue: baselineMetrics.avgTimeToHire,
      improvement: ((baselineMetrics.avgTimeToHire - btpMetrics.avgTimeToHire) / baselineMetrics.avgTimeToHire) * 100,
      unit: 'days'
    },
    {
      metric: 'Retention Rate',
      btpValue: btpMetrics.retentionRate,
      baselineValue: baselineMetrics.retentionRate,
      improvement: ((btpMetrics.retentionRate - baselineMetrics.retentionRate) / baselineMetrics.retentionRate) * 100,
      unit: '%'
    },
    {
      metric: 'Outcome Quality',
      btpValue: btpMetrics.outcomeQualityScore,
      baselineValue: baselineMetrics.outcomeQualityScore,
      improvement: ((btpMetrics.outcomeQualityScore - baselineMetrics.outcomeQualityScore) / baselineMetrics.outcomeQualityScore) * 100,
      unit: 'score'
    }
  ];
}

/**
 * Generate ROI dashboard
 */
export function generateROIDashboard(params: {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  totalFeesPaid: number;
  totalContractValue: number;
  btpMetrics: {
    avgTimeToHire: number;
    retentionRate: number;
    outcomeQualityScore: number;
  };
  industryBenchmarks: {
    avgTimeToHire: number;
    retentionRate: number;
    outcomeQualityScore: number;
  };
}): ROIDashboard {
  const comparisons = calculateROIComparisons({
    btpMetrics: params.btpMetrics,
    baselineMetrics: params.industryBenchmarks
  });
  
  const roiPercentage = params.totalFeesPaid > 0
    ? ((params.totalContractValue - params.totalFeesPaid) / params.totalFeesPaid) * 100
    : 0;
  
  return {
    organizationId: params.organizationId,
    comparisonPeriod: {
      start: params.periodStart,
      end: params.periodEnd
    },
    comparisons,
    summary: {
      timeToHireImprovement: comparisons[0].improvement,
      retentionImprovement: comparisons[1].improvement,
      outcomeQualityImprovement: comparisons[2].improvement,
      costSavings: (params.industryBenchmarks.avgTimeToHire - params.btpMetrics.avgTimeToHire) * 500 // estimated $500/day cost
    },
    totalFeesPaid: params.totalFeesPaid,
    totalContractValue: params.totalContractValue,
    roiPercentage
  };
}

// ==========================================
// DECISION SUPPORT
// ==========================================

/**
 * Generate decision support indicators for a match
 */
export function generateDecisionSupport(params: {
  matchId: string;
  matchScore: number;
  reliabilityBand: string;
  outcomeBand: string;
  experienceBand: string;
  capabilityGaps: string[];
  availabilityStatus: 'AVAILABLE' | 'LIMITED' | 'UNKNOWN';
}): DecisionSupportIndicator {
  const factors: string[] = [];
  const riskFlags: RiskFlag[] = [];
  let recommendation: DecisionSupportIndicator['recommendation'];
  let confidence = params.matchScore;
  
  // Evaluate reliability
  if (params.reliabilityBand === 'proven') {
    factors.push('Proven reliability track record');
  } else if (params.reliabilityBand === 'developing') {
    riskFlags.push({
      type: 'LOW_RELIABILITY',
      severity: 'MEDIUM',
      description: 'Operator has limited reliability history',
      mitigationSuggestion: 'Consider starting with a smaller scope project'
    });
    confidence -= 0.1;
  }
  
  // Evaluate outcome history
  if (params.outcomeBand === 'exceptional') {
    factors.push('Exceptional outcome history');
  } else if (params.outcomeBand === 'standard') {
    riskFlags.push({
      type: 'LOW_OUTCOME_HISTORY',
      severity: 'LOW',
      description: 'Limited outcome data available'
    });
    confidence -= 0.05;
  }
  
  // Check capability gaps
  if (params.capabilityGaps.length > 0) {
    riskFlags.push({
      type: 'CAPABILITY_GAP',
      severity: params.capabilityGaps.length > 2 ? 'HIGH' : 'MEDIUM',
      description: `Missing capabilities: ${params.capabilityGaps.join(', ')}`,
      mitigationSuggestion: 'Consider additional support or training resources'
    });
    confidence -= 0.1 * params.capabilityGaps.length;
  }
  
  // Check availability
  if (params.availabilityStatus === 'LIMITED') {
    riskFlags.push({
      type: 'AVAILABILITY_ISSUE',
      severity: 'MEDIUM',
      description: 'Operator has limited availability',
      mitigationSuggestion: 'Discuss timeline expectations before hiring'
    });
    confidence -= 0.05;
  }
  
  // Determine recommendation
  if (confidence >= 0.85 && riskFlags.filter(r => r.severity === 'HIGH').length === 0) {
    recommendation = 'STRONG_HIRE';
  } else if (confidence >= 0.75 && riskFlags.filter(r => r.severity === 'HIGH').length === 0) {
    recommendation = 'HIRE';
  } else if (confidence >= 0.60) {
    recommendation = 'CONSIDER';
  } else {
    recommendation = 'PASS';
  }
  
  return {
    matchId: params.matchId,
    recommendation,
    confidence: Math.max(0, confidence),
    factors,
    riskFlags
  };
}

/**
 * Batch decision support for multiple matches
 */
export function batchDecisionSupport(
  matches: Array<{
    matchId: string;
    matchScore: number;
    reliabilityBand: string;
    outcomeBand: string;
    experienceBand: string;
    capabilityGaps: string[];
    availabilityStatus: 'AVAILABLE' | 'LIMITED' | 'UNKNOWN';
  }>
): DecisionSupportIndicator[] {
  return matches.map(m => generateDecisionSupport(m));
}

// ==========================================
// TIME-TO-HIRE TRACKING
// ==========================================

/**
 * Track time-to-hire for a match
 */
export function trackTimeToHire(params: {
  matchId: string;
  organizationId: string;
  stages: TimeToHireRecord['stages'];
}): TimeToHireRecord {
  const { stages } = params;
  let totalDays: number | undefined;
  let bottleneck: string | undefined;
  
  if (stages.matchCreated && stages.hireConfirmed) {
    totalDays = (stages.hireConfirmed.getTime() - stages.matchCreated.getTime()) / (1000 * 60 * 60 * 24);
  }
  
  // Identify bottleneck
  if (stages.matchCreated && stages.firstViewed) {
    const viewTime = (stages.firstViewed.getTime() - stages.matchCreated.getTime()) / (1000 * 60 * 60);
    if (viewTime > 24) {
      bottleneck = 'Match review';
    }
  }
  
  if (stages.firstViewed && stages.interviewRequested) {
    const requestTime = (stages.interviewRequested.getTime() - stages.firstViewed.getTime()) / (1000 * 60 * 60);
    if (requestTime > 48) {
      bottleneck = 'Interview request';
    }
  }
  
  if (stages.interviewCompleted && stages.hireConfirmed) {
    const decisionTime = (stages.hireConfirmed.getTime() - stages.interviewCompleted.getTime()) / (1000 * 60 * 60);
    if (decisionTime > 48) {
      bottleneck = 'Hiring decision';
    }
  }
  
  return {
    matchId: params.matchId,
    organizationId: params.organizationId,
    stages,
    totalDays,
    bottleneck
  };
}

// ==========================================
// EXPORTS
// ==========================================

export const OrganizationControlEngine = {
  generateOrganizationDashboard,
  sanitizeMatchReasoning,
  calculateROIComparisons,
  generateROIDashboard,
  generateDecisionSupport,
  batchDecisionSupport,
  trackTimeToHire
};