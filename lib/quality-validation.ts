/**
 * Phase 4: Matching Quality Validation
 * Validates matching quality through multiple metrics
 */

import { ExecutionContext, generatePatternSignature } from './execution-context';

// Quality Metrics
export interface QualityMetrics {
  precision: number;          // How many recommended matches were actually relevant
  recall: number;             // How many relevant matches were found
  diversity: number;          // How diverse are the match recommendations
  coverage: number;           // Are all capability areas being matched
  consistency: number;        // Do similar jobs get similar match quality
  anonymityScore: number;     // How well protected are the operators
}

export interface MatchFeedback {
  matchId: string;
  wasHired: boolean;
  projectOutcome: 'success' | 'partial' | 'failure' | 'unknown';
  operatorRating?: number;    // 1-5 stars
  wouldRehire?: boolean;
  feedbackText?: string;
}

export interface QualityThreshold {
  minimum: number;
  target: number;
  excellent: number;
}

// Quality thresholds for each metric
export const QUALITY_THRESHOLDS: Record<keyof QualityMetrics, QualityThreshold> = {
  precision: { minimum: 0.60, target: 0.75, excellent: 0.90 },
  recall: { minimum: 0.50, target: 0.70, excellent: 0.85 },
  diversity: { minimum: 0.70, target: 0.80, excellent: 0.95 },
  coverage: { minimum: 0.60, target: 0.75, excellent: 0.90 },
  consistency: { minimum: 0.75, target: 0.85, excellent: 0.95 },
  anonymityScore: { minimum: 0.90, target: 0.95, excellent: 0.99 }
};

/**
 * Calculate precision from feedback data
 */
export function calculatePrecision(feedback: MatchFeedback[]): number {
  if (feedback.length === 0) return 0;
  
  const relevantMatches = feedback.filter(f => 
    f.wasHired && (f.projectOutcome === 'success' || f.projectOutcome === 'partial')
  );
  
  const hiredMatches = feedback.filter(f => f.wasHired);
  
  if (hiredMatches.length === 0) return 0;
  
  return relevantMatches.length / hiredMatches.length;
}

/**
 * Calculate recall from feedback and total available operators
 */
export function calculateRecall(
  feedback: MatchFeedback[],
  totalRelevantOperators: number
): number {
  if (totalRelevantOperators === 0) return 0;
  
  const foundRelevant = feedback.filter(f => 
    f.wasHired && (f.projectOutcome === 'success' || f.projectOutcome === 'partial')
  ).length;
  
  return Math.min(foundRelevant / totalRelevantOperators, 1);
}

/**
 * Calculate diversity of match recommendations
 * Uses Simpson's Diversity Index
 */
export function calculateDiversity(
  matches: Array<{ profileId: string; capabilities: string[] }>
): number {
  if (matches.length === 0) return 0;
  
  // Count capability occurrences
  const capabilityCounts = new Map<string, number>();
  let totalCapabilities = 0;
  
  matches.forEach(match => {
    match.capabilities.forEach(cap => {
      capabilityCounts.set(cap, (capabilityCounts.get(cap) || 0) + 1);
      totalCapabilities++;
    });
  });
  
  if (totalCapabilities === 0) return 0;
  
  // Calculate Simpson's Diversity Index
  let sumSquaredProportions = 0;
  capabilityCounts.forEach(count => {
    const proportion = count / totalCapabilities;
    sumSquaredProportions += proportion * proportion;
  });
  
  // Diversity = 1 - sum of squared proportions (higher = more diverse)
  return 1 - sumSquaredProportions;
}

/**
 * Calculate coverage of capability areas
 */
export function calculateCoverage(
  matches: Array<{ profileId: string; capabilities: string[] }>,
  requiredCapabilities: string[]
): number {
  if (requiredCapabilities.length === 0) return 1;
  
  const coveredCapabilities = new Set<string>();
  
  matches.forEach(match => {
    match.capabilities.forEach(cap => {
      if (requiredCapabilities.includes(cap)) {
        coveredCapabilities.add(cap);
      }
    });
  });
  
  return coveredCapabilities.size / requiredCapabilities.length;
}

/**
 * Calculate consistency of match quality across similar jobs
 */
export function calculateConsistency(
  matchScores: Array<{ jobId: string; jobSignature: string; avgScore: number }>
): number {
  // Group by job signature
  const signatureGroups = new Map<string, number[]>();
  
  matchScores.forEach(({ jobSignature, avgScore }) => {
    if (!signatureGroups.has(jobSignature)) {
      signatureGroups.set(jobSignature, []);
    }
    signatureGroups.get(jobSignature)!.push(avgScore);
  });
  
  // Calculate coefficient of variation for each group
  let totalInverseCV = 0;
  let groupCount = 0;
  
  signatureGroups.forEach(scores => {
    if (scores.length < 2) return;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => 
      sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower CV = higher consistency
    if (mean > 0) {
      const cv = stdDev / mean;
      totalInverseCV += Math.max(0, 1 - cv); // Invert so higher = better
      groupCount++;
    }
  });
  
  if (groupCount === 0) return 1;
  return totalInverseCV / groupCount;
}

/**
 * Evaluate quality against thresholds
 */
export function evaluateQuality(
  metrics: QualityMetrics
): {
  overall: 'failing' | 'acceptable' | 'good' | 'excellent';
  details: Record<keyof QualityMetrics, {
    status: 'failing' | 'acceptable' | 'good' | 'excellent';
    value: number;
    threshold: QualityThreshold;
    gap: number;
  }>;
  recommendations: string[];
} {
  const details: Record<string, any> = {};
  const recommendations: string[] = [];
  let failingCount = 0;
  let excellentCount = 0;
  
  for (const [key, value] of Object.entries(metrics) as [keyof QualityMetrics, number][]) {
    const threshold = QUALITY_THRESHOLDS[key];
    
    let status: 'failing' | 'acceptable' | 'good' | 'excellent';
    if (value < threshold.minimum) {
      status = 'failing';
      failingCount++;
      recommendations.push(`${key} (${(value * 100).toFixed(1)}%) is below minimum threshold (${(threshold.minimum * 100).toFixed(1)}%)`);
    } else if (value >= threshold.excellent) {
      status = 'excellent';
      excellentCount++;
    } else if (value >= threshold.target) {
      status = 'good';
    } else {
      status = 'acceptable';
    }
    
    details[key] = {
      status,
      value,
      threshold,
      gap: value - threshold.target
    };
  }
  
  let overall: 'failing' | 'acceptable' | 'good' | 'excellent';
  if (failingCount > 0) {
    overall = 'failing';
  } else if (excellentCount === Object.keys(metrics).length) {
    overall = 'excellent';
  } else if (excellentCount >= Object.keys(metrics).length / 2) {
    overall = 'good';
  } else {
    overall = 'acceptable';
  }
  
  // Add specific recommendations
  if (metrics.precision < QUALITY_THRESHOLDS.precision.target) {
    recommendations.push('Consider tightening execution context matching criteria');
  }
  if (metrics.diversity < QUALITY_THRESHOLDS.diversity.target) {
    recommendations.push('Increase decoy variety in anonymity engine');
  }
  if (metrics.anonymityScore < QUALITY_THRESHOLDS.anonymityScore.target) {
    recommendations.push('Review anonymity protections - operator identity may be at risk');
  }
  
  return { overall, details, recommendations };
}

/**
 * Run comprehensive quality validation
 */
export function runQualityValidation(params: {
  matchFeedback: MatchFeedback[];
  matches: Array<{ profileId: string; capabilities: string[] }>;
  requiredCapabilities: string[];
  totalRelevantOperators: number;
  matchScores: Array<{ jobId: string; jobSignature: string; avgScore: number }>;
  anonymitySimulationResult: { secure: boolean; confidence: number };
}): {
  metrics: QualityMetrics;
  evaluation: ReturnType<typeof evaluateQuality>;
  passed: boolean;
} {
  const metrics: QualityMetrics = {
    precision: calculatePrecision(params.matchFeedback),
    recall: calculateRecall(params.matchFeedback, params.totalRelevantOperators),
    diversity: calculateDiversity(params.matches),
    coverage: calculateCoverage(params.matches, params.requiredCapabilities),
    consistency: calculateConsistency(params.matchScores),
    anonymityScore: params.anonymitySimulationResult.confidence
  };
  
  const evaluation = evaluateQuality(metrics);
  
  return {
    metrics,
    evaluation,
    passed: evaluation.overall !== 'failing' && 
            metrics.anonymityScore >= QUALITY_THRESHOLDS.anonymityScore.minimum
  };
}