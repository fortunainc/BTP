/**
 * SECTION 6: Matching Engine Finalization
 * 
 * Extend current matching with:
 * - Execution failure pattern matching
 * - Outcome-weighted scoring boost
 * - Recency decay logic
 * - Reasoning snapshot storage
 */

import { ExecutionContext, generatePatternSignature } from './execution-context';
import { TrustVector } from './signal-score';

// ==========================================
// TYPES
// ==========================================

/**
 * Execution failure pattern
 */
export interface ExecutionFailurePattern {
  id: string;
  patternType: 'ENROLLMENT_STALL' | 'DATA_DISCREPANCY' | 'PROTOCOL_DEVIATION' | 'REGULATORY_DELAY' | 'VENDOR_ISSUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  frequency: number;              // How often this pattern appears
  context: {
    therapeuticArea: string;
    trialPhase: string;
    environment: string;
  };
  resolution?: {
    successful: boolean;
    resolutionType: string;
  };
}

/**
 * Enhanced match result with finalization features
 */
export interface EnhancedMatchResult {
  profileId: string;
  matchScore: number;
  
  // Original components
  executionContextMatch: number;
  breakdownPatternMatch: number;
  therapeuticPhaseMatch: number;
  trustReliability: number;
  outcomeReinforcement: number;
  
  // New components
  failurePatternMatch: number;        // Bonus for handling similar failures
  outcomeWeightedBoost: number;       // Boost based on outcome history
  recencyDecay: number;               // Decay factor for recency
  
  // Reasoning
  executionContextReasoning: string;
  patternFitExplanation: string;
  outcomeBackedJustification: string;
  failurePatternReasoning?: string;
  
  // Metadata
  matchCreatedAt: Date;
  reasoningSnapshotId: string;
  truthAuditPassed: boolean;
}

/**
 * Reasoning snapshot
 * Stored for audit trail
 */
export interface ReasoningSnapshot {
  id: string;
  matchId: string;
  timestamp: Date;
  
  // Input data (sanitized)
  jobExecutionContext: ExecutionContext;
  operatorExecutionContext: ExecutionContext;
  operatorTrustVector: TrustVector;
  
  // Calculations
  componentScores: {
    executionContext: number;
    breakdownPattern: number;
    therapeuticPhase: number;
    trustReliability: number;
    outcomeReinforcement: number;
    failurePattern: number;
    outcomeWeighted: number;
    recencyDecay: number;
  };
  
  // Final reasoning
  finalScore: number;
  reasoning: string;
  
  // Audit status
  truthAuditPassed: boolean;
  auditTimestamp?: Date;
}

/**
 * Recency configuration
 */
export const RECENCY_CONFIG = {
  // Decay half-life in days
  halfLifeDays: 90,
  
  // Minimum recency score
  minScore: 0.5,
  
  // Boost for recent activity
  recentActivityDays: 30,
  recentActivityBoost: 0.1
};

// ==========================================
// EXECUTION FAILURE PATTERN MATCHING
// ==========================================

/**
 * Extract failure patterns from contribution
 */
export function extractFailurePatterns(contribution: {
  situation: string;
  pattern: string;
  solution: string;
}): ExecutionFailurePattern[] {
  const patterns: ExecutionFailurePattern[] = [];
  const text = `${contribution.situation} ${contribution.pattern} ${contribution.solution}`.toLowerCase();
  
  // Pattern detection keywords
  const patternKeywords: Record<ExecutionFailurePattern['patternType'], string[]> = {
    ENROLLMENT_STALL: ['enrollment', 'recruitment', 'patient', 'screening', 'slow', 'stall'],
    DATA_DISCREPANCY: ['data', 'discrepancy', 'query', 'inconsistent', 'missing', 'error'],
    PROTOCOL_DEVIATION: ['deviation', 'protocol', 'amendment', 'violation', 'non-compliance'],
    REGULATORY_DELAY: ['regulatory', 'irb', 'fda', 'delay', 'approval', 'submission'],
    VENDOR_ISSUE: ['vendor', 'contractor', 'cru', 'site', 'coordination', 'handoff']
  };
  
  // Detect patterns
  Object.entries(patternKeywords).forEach(([patternType, keywords]) => {
    const matchCount = keywords.filter(kw => text.includes(kw)).length;
    
    if (matchCount >= 2) {
      patterns.push({
        id: `pattern-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        patternType: patternType as ExecutionFailurePattern['patternType'],
        severity: matchCount >= 4 ? 'HIGH' : matchCount >= 3 ? 'MEDIUM' : 'LOW',
        frequency: matchCount,
        context: {
          therapeuticArea: 'unknown',
          trialPhase: 'unknown',
          environment: 'unknown'
        }
      });
    }
  });
  
  return patterns;
}

/**
 * Match failure patterns between job and operator
 */
export function matchFailurePatterns(params: {
  jobFailurePatterns: ExecutionFailurePattern[];
  operatorFailurePatterns: ExecutionFailurePattern[];
}): {
  matchScore: number;
  matchedPatterns: Array<{
    patternType: ExecutionFailurePattern['patternType'];
    severity: ExecutionFailurePattern['severity'];
    operatorResolved: boolean;
  }>;
  reasoning: string;
} {
  const { jobFailurePatterns, operatorFailurePatterns } = params;
  
  if (jobFailurePatterns.length === 0) {
    return {
      matchScore: 0,
      matchedPatterns: [],
      reasoning: 'No specific failure patterns identified in job requirements.'
    };
  }
  
  const matchedPatterns: Array<{
    patternType: ExecutionFailurePattern['patternType'];
    severity: ExecutionFailurePattern['severity'];
    operatorResolved: boolean;
  }> = [];
  
  let totalMatchScore = 0;
  
  jobFailurePatterns.forEach(jobPattern => {
    // Find matching operator patterns
    const operatorMatches = operatorFailurePatterns.filter(
      op => op.patternType === jobPattern.patternType
    );
    
    if (operatorMatches.length > 0) {
      const hasSuccessfulResolution = operatorMatches.some(
        op => op.resolution?.successful
      );
      
      matchedPatterns.push({
        patternType: jobPattern.patternType,
        severity: jobPattern.severity,
        operatorResolved: hasSuccessfulResolution
      });
      
      // Score based on severity and resolution
      const severityWeight = jobPattern.severity === 'HIGH' ? 0.3 : 
                           jobPattern.severity === 'MEDIUM' ? 0.2 : 0.1;
      const resolutionBonus = hasSuccessfulResolution ? 0.1 : 0;
      
      totalMatchScore += severityWeight + resolutionBonus;
    }
  });
  
  // Normalize to 0-1
  const matchScore = Math.min(1, totalMatchScore);
  
  // Generate reasoning
  const reasoning = matchedPatterns.length > 0
    ? `Operator has experience with ${matchedPatterns.length} failure pattern(s) relevant to this job: ` +
      matchedPatterns.map(p => `${p.patternType} (${p.severity})`).join(', ') +
      (matchedPatterns.some(p => p.operatorResolved) ? '. Includes successful resolutions.' : '.')
    : 'No matching failure patterns found.';
  
  return { matchScore, matchedPatterns, reasoning };
}

// ==========================================
// OUTCOME-WEIGHTED SCORING
// ==========================================

/**
 * Calculate outcome-weighted boost
 */
export function calculateOutcomeWeightedBoost(params: {
  trustVector: TrustVector;
  outcomeHistory: Array<{
    successful: boolean;
    outcomeType: string;
    rating?: number;
  }>;
}): {
  boost: number;
  reasoning: string;
} {
  const { trustVector, outcomeHistory } = params;
  
  if (outcomeHistory.length === 0) {
    return {
      boost: 0,
      reasoning: 'No outcome history available.'
    };
  }
  
  // Calculate success rate
  const successfulOutcomes = outcomeHistory.filter(o => o.successful).length;
  const successRate = successfulOutcomes / outcomeHistory.length;
  
  // Calculate average rating
  const ratings = outcomeHistory.filter(o => o.rating).map(o => o.rating!);
  const avgRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
    : 0;
  
  // Calculate boost
  const successBoost = successRate * 0.15;  // Max 0.15
  const ratingBoost = (avgRating / 5) * 0.10;  // Max 0.10
  const trustBoost = trustVector.outcome * 0.05;  // Max 0.05
  
  const totalBoost = successBoost + ratingBoost + trustBoost;
  
  // Generate reasoning
  const reasoning = `Outcome-weighted boost: ${Math.round(successRate * 100)}% success rate` +
    (avgRating > 0 ? `, ${avgRating.toFixed(1)}/5 average rating` : '') +
    `, ${Math.round(trustVector.outcome * 100)}% outcome trust score.`;
  
  return { boost: totalBoost, reasoning };
}

// ==========================================
// RECENCY DECAY LOGIC
// ==========================================

/**
 * Calculate recency decay factor
 */
export function calculateRecencyDecay(params: {
  lastActivityDate: Date;
  currentDate?: Date;
}): {
  decayFactor: number;
  daysSinceActivity: number;
  reasoning: string;
} {
  const { lastActivityDate, currentDate = new Date() } = params;
  
  const daysSinceActivity = (currentDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Exponential decay
  const decayFactor = Math.max(
    RECENCY_CONFIG.minScore,
    Math.exp(-daysSinceActivity / RECENCY_CONFIG.halfLifeDays)
  );
  
  // Check for recent activity boost
  const isRecent = daysSinceActivity <= RECENCY_CONFIG.recentActivityDays;
  const finalDecayFactor = isRecent 
    ? Math.min(1, decayFactor + RECENCY_CONFIG.recentActivityBoost)
    : decayFactor;
  
  // Generate reasoning
  let reasoning = `Recency factor: ${finalDecayFactor.toFixed(2)} based on ${Math.round(daysSinceActivity)} days since last activity.`;
  if (isRecent) {
    reasoning += ' Recent activity boost applied.';
  }
  
  return {
    decayFactor: finalDecayFactor,
    daysSinceActivity,
    reasoning
  };
}

// ==========================================
// REASONING SNAPSHOT STORAGE
// ==========================================

/**
 * Create reasoning snapshot
 */
export function createReasoningSnapshot(params: {
  matchId: string;
  jobExecutionContext: ExecutionContext;
  operatorExecutionContext: ExecutionContext;
  operatorTrustVector: TrustVector;
  componentScores: ReasoningSnapshot['componentScores'];
  finalScore: number;
  reasoning: string;
}): ReasoningSnapshot {
  return {
    id: `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    matchId: params.matchId,
    timestamp: new Date(),
    jobExecutionContext: params.jobExecutionContext,
    operatorExecutionContext: params.operatorExecutionContext,
    operatorTrustVector: params.operatorTrustVector,
    componentScores: params.componentScores,
    finalScore: params.finalScore,
    reasoning: params.reasoning,
    truthAuditPassed: false  // Will be set after audit
  };
}

/**
 * Update snapshot with audit result
 */
export function updateSnapshotAudit(params: {
  snapshot: ReasoningSnapshot;
  auditPassed: boolean;
}): ReasoningSnapshot {
  return {
    ...params.snapshot,
    truthAuditPassed: params.auditPassed,
    auditTimestamp: new Date()
  };
}

// ==========================================
// ENHANCED MATCHING
// ==========================================

/**
 * Calculate enhanced match score
 */
export function calculateEnhancedMatch(params: {
  baseScores: {
    executionContextMatch: number;
    breakdownPatternMatch: number;
    therapeuticPhaseMatch: number;
    trustReliability: number;
    outcomeReinforcement: number;
  };
  failurePatternMatch: number;
  outcomeWeightedBoost: number;
  recencyDecay: number;
}): {
  finalScore: number;
  componentBreakdown: EnhancedMatchResult;
} {
  const { baseScores, failurePatternMatch, outcomeWeightedBoost, recencyDecay } = params;
  
  // Apply recency decay to all components
  const decayedScores = {
    executionContextMatch: baseScores.executionContextMatch * recencyDecay,
    breakdownPatternMatch: baseScores.breakdownPatternMatch * recencyDecay,
    therapeuticPhaseMatch: baseScores.therapeuticPhaseMatch * recencyDecay,
    trustReliability: baseScores.trustReliability * recencyDecay,
    outcomeReinforcement: baseScores.outcomeReinforcement * recencyDecay
  };
  
  // Calculate final score
  const finalScore = 
    decayedScores.executionContextMatch +
    decayedScores.breakdownPatternMatch +
    decayedScores.therapeuticPhaseMatch +
    decayedScores.trustReliability +
    decayedScores.outcomeReinforcement +
    failurePatternMatch +
    outcomeWeightedBoost;
  
  // Clamp to 0-1
  const clampedScore = Math.max(0, Math.min(1, finalScore));
  
  return {
    finalScore: clampedScore,
    componentBreakdown: {
      profileId: '',  // To be filled by caller
      matchScore: clampedScore,
      executionContextMatch: decayedScores.executionContextMatch,
      breakdownPatternMatch: decayedScores.breakdownPatternMatch,
      therapeuticPhaseMatch: decayedScores.therapeuticPhaseMatch,
      trustReliability: decayedScores.trustReliability,
      outcomeReinforcement: decayedScores.outcomeReinforcement,
      failurePatternMatch,
      outcomeWeightedBoost,
      recencyDecay,
      executionContextReasoning: '',  // To be filled by caller
      patternFitExplanation: '',
      outcomeBackedJustification: '',
      matchCreatedAt: new Date(),
      reasoningSnapshotId: '',
      truthAuditPassed: false
    }
  };
}

// ==========================================
// EXPORTS
// ==========================================

export const MatchingFinalizationEngine = {
  extractFailurePatterns,
  matchFailurePatterns,
  calculateOutcomeWeightedBoost,
  calculateRecencyDecay,
  createReasoningSnapshot,
  updateSnapshotAudit,
  calculateEnhancedMatch
};