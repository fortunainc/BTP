/**
 * Failure Pathway Model (Section 9)
 * 
 * Tracks causal chains: EARLY → ACTIVE → FAILURE → OUTCOME
 * 
 * Detects sequences like:
 * - workaround → overload → deviation
 * - suppression → escalation → failure
 * - burden → burnout → turnover
 * - drift → protocol violation
 * 
 * Links contributions and follow-ups into pathways
 * that reveal how operational failures develop over time.
 */

import { prisma } from './prisma';
import type { ExecutionSignal } from './translation-engine';

// ==========================================
// TYPES
// ==========================================

export type PathwayType = 
  | 'workaround_overload_deviation'
  | 'suppression_escalation_failure'
  | 'burden_burnout_turnover'
  | 'drift_protocol_violation';

export type PathwayStage = 'EARLY' | 'ACTIVE' | 'FAILURE' | 'OUTCOME';

export interface PathwayDetectionResult {
  pathwayType: PathwayType;
  stage: PathwayStage;
  contributionIds: string[];
  triggerSignals: Record<string, unknown>;
  pathwayRisk: number;
  confidenceScore: number;
}

export interface PathwayProgression {
  fromStage: PathwayStage;
  toStage: PathwayStage;
  trigger: string;
  contributionId: string;
}

// ==========================================
// PATHWAY DETECTION RULES
// ==========================================

interface PathwayRule {
  type: PathwayType;
  earlySignals: string[];
  activeSignals: string[];
  failureSignals: string[];
  outcomeSignals: string[];
  riskMultiplier: number;
}

const PATHWAY_RULES: PathwayRule[] = [
  {
    type: 'workaround_overload_deviation',
    earlySignals: ['workaround_present', 'process_skip', 'data_shortcut'],
    activeSignals: ['overload', 'burden_time', 'burden_operational'],
    failureSignals: ['deviation', 'protocol_violation', 'data_integrity'],
    outcomeSignals: ['caused_delay_deviation_dropout', 'resolved'],
    riskMultiplier: 1.3
  },
  {
    type: 'suppression_escalation_failure',
    earlySignals: ['not_escalated', 'fear_of_pushback', 'sponsor_pressure'],
    activeSignals: ['escalation_fear', 'frustration', 'resignation'],
    failureSignals: ['high_risk_escalation', 'critical_downstream'],
    outcomeSignals: ['got_worse', 'caused_delay_deviation_dropout'],
    riskMultiplier: 1.5
  },
  {
    type: 'burden_burnout_turnover',
    earlySignals: ['burden_time', 'burden_complexity', 'invisible_work'],
    activeSignals: ['overload', 'resignation', 'emotional_burden'],
    failureSignals: ['site_overload', 'staffing', 'turnover'],
    outcomeSignals: ['caused_delay_deviation_dropout', 'resolved'],
    riskMultiplier: 1.2
  },
  {
    type: 'drift_protocol_violation',
    earlySignals: ['system_mismatch', 'reality_gap', 'drift_detected'],
    activeSignals: ['workaround_present', 'off_label_procedure', 'manual_workaround'],
    failureSignals: ['protocol_violation', 'data_integrity', 'regulatory'],
    outcomeSignals: ['caused_delay_deviation_dropout', 'got_worse'],
    riskMultiplier: 1.4
  }
];

// ==========================================
// MAIN EXPORTS
// ==========================================

/**
 * Detect which failure pathway(s) a contribution belongs to
 * Called when a new contribution is created
 */
export function detectPathways(signal: ExecutionSignal): PathwayDetectionResult[] {
  const results: PathwayDetectionResult[] = [];

  for (const rule of PATHWAY_RULES) {
    const detection = evaluatePathwayRule(rule, signal);
    if (detection) {
      results.push(detection);
    }
  }

  return results;
}

/**
 * Evaluate a single pathway rule against a signal
 */
function evaluatePathwayRule(rule: PathwayRule, signal: ExecutionSignal): PathwayDetectionResult | null {
  const signalFeatures = extractSignalFeatures(signal);
  
  // Count matches at each stage
  const earlyMatches = countMatches(signalFeatures, rule.earlySignals);
  const activeMatches = countMatches(signalFeatures, rule.activeSignals);
  const failureMatches = countMatches(signalFeatures, rule.failureSignals);

  // Determine the stage
  let stage: PathwayStage;
  let totalMatches: number;
  
  if (failureMatches > 0) {
    stage = 'FAILURE';
    totalMatches = failureMatches + activeMatches + earlyMatches;
  } else if (activeMatches > 0) {
    stage = 'ACTIVE';
    totalMatches = activeMatches + earlyMatches;
  } else if (earlyMatches > 0) {
    stage = 'EARLY';
    totalMatches = earlyMatches;
  } else {
    return null; // No match for this pathway
  }

  // Calculate risk and confidence
  const baseRisk = totalMatches / (rule.earlySignals.length + rule.activeSignals.length + rule.failureSignals.length);
  const pathwayRisk = Math.min(1.0, baseRisk * rule.riskMultiplier);
  
  // Confidence increases with more signal matches
  const confidenceScore = Math.min(0.95, 0.3 + (totalMatches * 0.15));

  // Build trigger signals
  const triggerSignals: Record<string, unknown> = {};
  if (earlyMatches > 0) triggerSignals.early = signalFeatures.filter(f => rule.earlySignals.includes(f));
  if (activeMatches > 0) triggerSignals.active = signalFeatures.filter(f => rule.activeSignals.includes(f));
  if (failureMatches > 0) triggerSignals.failure = signalFeatures.filter(f => rule.failureSignals.includes(f));

  return {
    pathwayType: rule.type,
    stage,
    contributionIds: [],
    triggerSignals,
    pathwayRisk,
    confidenceScore
  };
}

/**
 * Extract signal features from an ExecutionSignal for pathway matching
 */
function extractSignalFeatures(signal: ExecutionSignal): string[] {
  const features: string[] = [];

  // Workaround signals
  if (signal.workaroundPresent) {
    features.push('workaround_present');
    if (signal.workaroundType === 'PROCESS_SKIP') features.push('process_skip');
    if (signal.workaroundType === 'DATA_SHORTCUT') features.push('data_shortcut');
    if (signal.workaroundType === 'OFF_LABEL_PROCEDURE') features.push('off_label_procedure');
    if (signal.workaroundType === 'MANUAL_WORKAROUND') features.push('manual_workaround');
  }

  // Suppressed signal types
  if (signal.suppressedSignalType === 'NOT_ESCALATED') features.push('not_escalated');
  if (signal.suppressedSignalType === 'FEAR_OF_PUSHBACK') features.push('fear_of_pushback');
  if (signal.suppressedSignalType === 'SPONSOR_PRESSURE') features.push('sponsor_pressure');
  if (signal.suppressedSignalType === 'ESCALATED_IGNORED') features.push('escalated_ignored');

  // Emotional signals
  if (signal.emotionalSignalType === 'OVERLOAD') features.push('overload');
  if (signal.emotionalSignalType === 'FRUSTRATION') features.push('frustration');
  if (signal.emotionalSignalType === 'RESIGNATION') features.push('resignation');
  if (signal.emotionalSignalType === 'ESCALATION_FEAR') features.push('escalation_fear');

  // Burden signals
  if (signal.burdenAbsorber !== 'UNKNOWN') features.push('burden_absorber');
  if (signal.burdenType === 'TIME') features.push('burden_time');
  if (signal.burdenType === 'COMPLEXITY') features.push('burden_complexity');
  if (signal.burdenType === 'EMOTIONAL') features.push('emotional_burden');
  if (signal.burdenType === 'OPERATIONAL') features.push('burden_operational');

  // System mismatch
  if (signal.systemOfRecordMismatch) {
    features.push('system_mismatch');
    features.push('reality_gap');
  }

  // Invisible work
  if (signal.invisibleWorkType !== 'UNKNOWN') features.push('invisible_work');

  // Downstream risk
  if (signal.likelyDownstreamRisk === 'HIGH' || signal.likelyDownstreamRisk === 'CRITICAL') {
    features.push('critical_downstream');
  }

  // Failure trajectory
  if (signal.failureTrajectoryPrediction === 'HIGH_RISK_ESCALATION') {
    features.push('high_risk_escalation');
  }

  // Drift indicators
  if (signal.driftIndicators && signal.driftIndicators.length > 0) {
    features.push('drift_detected');
  }

  return features;
}

/**
 * Count how many of the target patterns match the signal features
 */
function countMatches(features: string[], targets: string[]): number {
  return features.filter(f => targets.includes(f)).length;
}

/**
 * Create FailurePathway records for a new contribution
 * Called after contribution creation
 */
export async function createPathwaysForContribution(
  contributionId: string,
  signal: ExecutionSignal
): Promise<void> {
  try {
    const detections = detectPathways(signal);

    for (const detection of detections) {
      // Check if an active pathway of this type already exists
      const existingPathway = await prisma.failurePathway.findFirst({
        where: {
          pathwayType: detection.pathwayType,
          isActive: true,
          stage: detection.stage
        },
        orderBy: { detectedAt: 'desc' }
      });

      if (existingPathway) {
        // Add this contribution to the existing pathway
        const mergedSignals = {
          ...(existingPathway.triggerSignals as Record<string, unknown> || {}),
          newContribution: detection.triggerSignals as unknown as Record<string, unknown>
        };
        await prisma.failurePathway.update({
          where: { id: existingPathway.id },
          data: {
            contributionIds: { push: contributionId },
            pathwayRisk: Math.max(existingPathway.pathwayRisk, detection.pathwayRisk),
            confidenceScore: Math.max(existingPathway.confidenceScore, detection.confidenceScore),
            triggerSignals: mergedSignals as any
          }
        });
      } else {
        // Create a new pathway
        await prisma.failurePathway.create({
          data: {
            pathwayType: detection.pathwayType,
            stage: detection.stage,
            contributionIds: [contributionId],
            triggerSignals: detection.triggerSignals as any,
            pathwayRisk: detection.pathwayRisk,
            confidenceScore: detection.confidenceScore,
            isActive: true
          }
        });
      }
    }
  } catch (error) {
    console.error('Error creating failure pathways:', error);
  }
}

/**
 * Progress a pathway to the next stage based on follow-up data
 * Called when a follow-up is submitted
 */
export async function progressPathway(
  contributionId: string,
  statusChange: string
): Promise<void> {
  try {
    // Find pathways that include this contribution
    const pathways = await prisma.failurePathway.findMany({
      where: {
        contributionIds: { has: contributionId },
        isActive: true
      }
    });

    for (const pathway of pathways) {
      let newStage: PathwayStage | null = null;

      // Determine stage progression based on follow-up
      if (statusChange === 'got_worse') {
        if (pathway.stage === 'EARLY') newStage = 'ACTIVE';
        else if (pathway.stage === 'ACTIVE') newStage = 'FAILURE';
      } else if (statusChange === 'caused_delay_deviation_dropout') {
        newStage = 'OUTCOME';
      } else if (statusChange === 'resolved') {
        // Resolution ends the pathway
        await prisma.failurePathway.update({
          where: { id: pathway.id },
          data: {
            isActive: false,
            confirmedAt: new Date(),
            outcomeSignal: { statusChange, contributionId, resolvedAt: new Date().toISOString() } as any
          }
        });
        continue;
      }

      if (newStage) {
        const intermediateData = {
          ...(pathway.intermediateSignals as Record<string, unknown> || {}),
          [newStage]: { statusChange, contributionId, timestamp: new Date().toISOString() }
        };
        await prisma.failurePathway.update({
          where: { id: pathway.id },
          data: {
            stage: newStage,
            intermediateSignals: intermediateData as any,
            pathwayRisk: Math.min(1.0, pathway.pathwayRisk * 1.2) // Risk increases with progression
          }
        });
      }
    }
  } catch (error) {
    console.error('Error progressing pathway:', error);
  }
}

/**
 * Get active pathways for admin/analytical view
 */
export async function getActivePathways(options?: {
  pathwayType?: PathwayType;
  stage?: PathwayStage;
  minRisk?: number;
}): Promise<Array<{
  id: string;
  pathwayType: string;
  stage: string;
  contributionCount: number;
  pathwayRisk: number;
  confidenceScore: number;
  detectedAt: Date;
}>> {
  try {
    const where: Record<string, unknown> = { isActive: true };

    if (options?.pathwayType) where.pathwayType = options.pathwayType;
    if (options?.stage) where.stage = options.stage;
    if (options?.minRisk) where.pathwayRisk = { gte: options.minRisk };

    const pathways = await prisma.failurePathway.findMany({
      where,
      orderBy: { pathwayRisk: 'desc' },
      take: 50
    });

    return pathways.map(p => ({
      id: p.id,
      pathwayType: p.pathwayType,
      stage: p.stage,
      contributionCount: p.contributionIds.length,
      pathwayRisk: p.pathwayRisk,
      confidenceScore: p.confidenceScore,
      detectedAt: p.detectedAt
    }));
  } catch (error) {
    console.error('Error getting active pathways:', error);
    return [];
  }
}

export default {
  detectPathways,
  createPathwaysForContribution,
  progressPathway,
  getActivePathways
};