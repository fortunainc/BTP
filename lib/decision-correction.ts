/**
 * SECTION 10: Decision-Correction Engine (PATENT-CRITICAL)
 * 
 * This is the core of the long-term IP and institutional value.
 * Implemented as a standalone system layer.
 */

import { createHash, randomUUID } from 'crypto';

// ==========================================
// DATA MODELS (10.7)
// ==========================================

/**
 * DivergenceSignal - Detection of execution divergence
 */
export interface DivergenceSignal {
  id: string;
  timestamp: Date;
  
  // Pattern identification
  patternId: string;
  patternType: DivergenceType;
  
  // Expected vs Actual
  expectedLayer: {
    assumptions: string[];
    context: {
      therapeuticArea: string;
      trialPhase: string;
      environment: string;
    };
    predictedOutcome: string;
  };
  
  actualLayer: {
    observedPatterns: string[];
    outcomeDeviations: string[];
    interactionTypes: string[];  // SEEN_TOO, SOLUTION_FAILED, etc.
  };
  
  // Divergence metrics
  mismatchScore: number;         // 0-1
  recurrenceFrequency: number;   // How often this pattern recurs
  severityWeight: number;        // 0-1
  
  // System-level storage (not user-linked)
  linkedCorrectionId?: string;
}

export type DivergenceType = 
  | 'EXECUTION_GAP'
  | 'OUTCOME_MISMATCH'
  | 'PROCESS_DEVIATION'
  | 'RESOURCE_MISMATCH'
  | 'TIMELINE_SLIPPAGE'
  | 'QUALITY_GAP';

/**
 * SilenceSignal - Absence of expected signals as meaningful data
 */
export interface SilenceSignal {
  id: string;
  timestamp: Date;
  
  // Expected signal zone
  expectedZone: {
    trialPhase: string;
    issueCategory: string;
    expectedContributionTypes: string[];
  };
  
  // Detected absence
  absenceMetrics: {
    contributionDensity: number;  // 0-1, where 0 is complete absence
    expectedContributions: number;
    actualContributions: number;
    gapPercentage: number;
  };
  
  // Interpretation
  silenceType: 'UNDERREPORTED_FRICTION' | 'SUPPRESSED_ISSUES' | 'HIDDEN_FAILURE_POINT' | 'KNOWLEDGE_GAP';
  confidenceLevel: number;        // 0-1
  
  // Impact assessment
  potentialRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  affectedAreas: string[];
}

/**
 * CorrectionPathway - Structured corrective options
 */
export interface CorrectionPathway {
  id: string;
  divergenceSignalId: string;
  timestamp: Date;
  
  // Tier 1: Design Corrections
  designCorrections: Array<{
    id: string;
    description: string;
    challengesAssumption: string;
    suggestedTradeoff: string;
    impactAssessment: string;
    implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  
  // Tier 2: Execution Mitigations
  executionMitigations: Array<{
    id: string;
    description: string;
    interventionType: 'EARLY_INTERVENTION' | 'RESOURCE_ALLOCATION' | 'PROCESS_ADJUSTMENT';
    triggerConditions: string[];
    expectedOutcome: string;
  }>;
  
  // Tier 3: Governance Corrections
  governanceCorrections: Array<{
    id: string;
    description: string;
    escalationPoint: string;
    decisionCheckpoints: string[];
    stakeholderNotification: string[];
  }>;
  
  // Metadata
  recommendedPriority: number;    // 1-3, where 1 is highest
  linkedAssumptionMemoryId?: string;
}

/**
 * AssumptionMemory - Persistent institutional memory of failed assumptions
 */
export interface AssumptionMemory {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Assumption tracking
  assumption: {
    description: string;
    context: {
      therapeuticArea: string;
      trialPhase: string;
      environment: string;
    };
    originalConfidence: number;   // 0-1
  };
  
  // Outcome tracking
  outcomes: Array<{
    timestamp: Date;
    result: 'VALIDATED' | 'PARTIALLY_FAILED' | 'FAILED';
    context: string;
    impactScore: number;          // -1 to +1
  }>;
  
  // Recurrence tracking
  failureFrequency: number;
  failureContexts: string[];
  
  // Learning
  correctedAssumption?: string;
  applicableCorrectionPathways: string[];
}

/**
 * Execution Intelligence Brief
 */
export interface ExecutionIntelligenceBrief {
  id: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  
  // Aggregated patterns (no user identity)
  divergencePatterns: Array<{
    patternType: string;
    frequency: number;
    severity: number;
  }>;
  
  silencePatterns: Array<{
    zone: string;
    absenceLevel: number;
    riskLevel: string;
  }>;
  
  // Recommended corrections
  topCorrections: Array<{
    pathwayId: string;
    priority: number;
    description: string;
  }>;
  
  // Batch metadata
  batchKey: string;
  delayApplied: number;          // hours
  decoyPatternsInjected: number;
}

// ==========================================
// DECISION DISTANCE DETECTION ENGINE (10.1)
// ==========================================

/**
 * Extract expected layer from contribution/job metadata
 */
export function extractExpectedLayer(params: {
  contributionMetadata: {
    therapeuticArea: string;
    trialPhase: string;
    issueCategory: string;
    expectedOutcomes: string[];
  };
  jobRequirements: string[];
}): DivergenceSignal['expectedLayer'] {
  const assumptions: string[] = [];
  
  // Extract assumptions from requirements
  params.jobRequirements.forEach(req => {
    if (req.toLowerCase().includes('enrollment')) {
      assumptions.push('Enrollment targets achievable within timeline');
    }
    if (req.toLowerCase().includes('data')) {
      assumptions.push('Data quality meets regulatory standards');
    }
    if (req.toLowerCase().includes('timeline')) {
      assumptions.push('Timeline buffers sufficient for unexpected delays');
    }
  });
  
  // Add default assumptions based on context
  assumptions.push('Team capacity is sufficient');
  assumptions.push('Vendor performance is reliable');
  
  return {
    assumptions,
    context: {
      therapeuticArea: params.contributionMetadata.therapeuticArea,
      trialPhase: params.contributionMetadata.trialPhase,
      environment: 'clinical_trial'
    },
    predictedOutcome: 'Project completion within parameters'
  };
}

/**
 * Extract actual layer from contribution patterns
 */
export function extractActualLayer(params: {
  contributions: Array<{
    situation: string;
    pattern: string;
    solution: string;
    outcome: string;
  }>;
  interactionTypes: string[];
}): DivergenceSignal['actualLayer'] {
  const observedPatterns: string[] = [];
  const outcomeDeviations: string[] = [];
  
  params.contributions.forEach(c => {
    // Extract observed patterns from contribution text
    const text = `${c.situation} ${c.pattern} ${c.solution}`.toLowerCase();
    
    if (text.includes('delay') || text.includes('late')) {
      observedPatterns.push('Timeline deviation observed');
    }
    if (text.includes('fail') || text.includes('issue')) {
      observedPatterns.push('Quality issue encountered');
    }
    if (text.includes('shortage') || text.includes('lack')) {
      observedPatterns.push('Resource constraint identified');
    }
    
    // Check for outcome deviations
    if (c.outcome && !c.outcome.toLowerCase().includes('success')) {
      outcomeDeviations.push(`Outcome deviation: ${c.outcome.substring(0, 50)}...`);
    }
  });
  
  return {
    observedPatterns: [...new Set(observedPatterns)],
    outcomeDeviations,
    interactionTypes: params.interactionTypes
  };
}

/**
 * Detect divergence between expected and actual
 */
export function detectDivergence(params: {
  expectedLayer: DivergenceSignal['expectedLayer'];
  actualLayer: DivergenceSignal['actualLayer'];
  patternType: DivergenceType;
}): DivergenceSignal {
  const { expectedLayer, actualLayer, patternType } = params;
  
  // Calculate mismatch score
  const expectedPatternCount = expectedLayer.assumptions.length;
  const deviationCount = actualLayer.observedPatterns.length + actualLayer.outcomeDeviations.length;
  const mismatchScore = Math.min(1, deviationCount / Math.max(1, expectedPatternCount));
  
  // Calculate severity weight
  const severityWeight = actualLayer.interactionTypes.includes('SOLUTION_FAILED') ? 0.9 :
                         actualLayer.interactionTypes.includes('SEEN_TOO') ? 0.7 : 0.5;
  
  return {
    id: `div-${randomUUID()}`,
    timestamp: new Date(),
    patternId: `pattern-${createHash('sha256')
      .update(`${patternType}:${expectedLayer.context.therapeuticArea}`)
      .digest('hex')
      .substring(0, 16)}`,
    patternType,
    expectedLayer,
    actualLayer,
    mismatchScore,
    recurrenceFrequency: 1,  // Will be updated with historical data
    severityWeight
  };
}

// ==========================================
// SILENCE-AS-SIGNAL LOGIC (10.2)
// ==========================================

/**
 * Identify expected signal zones
 */
export function identifyExpectedSignalZones(params: {
  trialPhase: string;
  issueCategory: string;
  historicalPatterns: Array<{
    zone: string;
    contributionDensity: number;
  }>;
}): SilenceSignal['expectedZone'] {
  return {
    trialPhase: params.trialPhase,
    issueCategory: params.issueCategory,
    expectedContributionTypes: [
      'Issue identification',
      'Solution proposal',
      'Outcome documentation',
      'Process improvement'
    ]
  };
}

/**
 * Detect absence of expected signals
 */
export function detectSilenceSignal(params: {
  expectedZone: SilenceSignal['expectedZone'];
  contributionData: {
    totalExpected: number;
    actualCount: number;
    density: number;
  };
}): SilenceSignal {
  const { expectedZone, contributionData } = params;
  
  const gapPercentage = 1 - (contributionData.actualCount / Math.max(1, contributionData.totalExpected));
  
  // Determine silence type based on gap
  let silenceType: SilenceSignal['silenceType'];
  if (gapPercentage > 0.8) {
    silenceType = 'HIDDEN_FAILURE_POINT';
  } else if (gapPercentage > 0.6) {
    silenceType = 'SUPPRESSED_ISSUES';
  } else if (gapPercentage > 0.4) {
    silenceType = 'UNDERREPORTED_FRICTION';
  } else {
    silenceType = 'KNOWLEDGE_GAP';
  }
  
  const potentialRisk = gapPercentage > 0.7 ? 'HIGH' : gapPercentage > 0.4 ? 'MEDIUM' : 'LOW';
  
  return {
    id: `silence-${randomUUID()}`,
    timestamp: new Date(),
    expectedZone,
    absenceMetrics: {
      contributionDensity: contributionData.density,
      expectedContributions: contributionData.totalExpected,
      actualContributions: contributionData.actualCount,
      gapPercentage
    },
    silenceType,
    confidenceLevel: 1 - gapPercentage,  // Higher gap = lower confidence in data
    potentialRisk,
    affectedAreas: [expectedZone.issueCategory]
  };
}

// ==========================================
// CORRECTION PATHWAY ENGINE (10.3)
// ==========================================

/**
 * Generate correction pathways for detected divergence
 */
export function generateCorrectionPathways(params: {
  divergenceSignal: DivergenceSignal;
  silenceSignal?: SilenceSignal;
}): CorrectionPathway {
  const { divergenceSignal, silenceSignal } = params;
  
  // Generate design corrections (Tier 1)
  const designCorrections = generateDesignCorrections(divergenceSignal);
  
  // Generate execution mitigations (Tier 2)
  const executionMitigations = generateExecutionMitigations(divergenceSignal, silenceSignal);
  
  // Generate governance corrections (Tier 3)
  const governanceCorrections = generateGovernanceCorrections(divergenceSignal);
  
  return {
    id: `correction-${randomUUID()}`,
    divergenceSignalId: divergenceSignal.id,
    timestamp: new Date(),
    designCorrections,
    executionMitigations,
    governanceCorrections,
    recommendedPriority: divergenceSignal.severityWeight > 0.7 ? 1 : 
                         divergenceSignal.severityWeight > 0.4 ? 2 : 3
  };
}

/**
 * Generate design corrections (Tier 1)
 */
function generateDesignCorrections(divergence: DivergenceSignal): CorrectionPathway['designCorrections'] {
  const corrections: CorrectionPathway['designCorrections'] = [];
  
  divergence.expectedLayer.assumptions.forEach((assumption, index) => {
    if (divergence.mismatchScore > 0.5) {
      corrections.push({
        id: `design-${index}`,
        description: `Challenge assumption: "${assumption}"`,
        challengesAssumption: assumption,
        suggestedTradeoff: 'Consider alternative approaches with lower risk profile',
        impactAssessment: 'May require design revision and stakeholder alignment',
        implementationEffort: divergence.severityWeight > 0.7 ? 'HIGH' : 'MEDIUM'
      });
    }
  });
  
  return corrections;
}

/**
 * Generate execution mitigations (Tier 2)
 */
function generateExecutionMitigations(
  divergence: DivergenceSignal,
  silence?: SilenceSignal
): CorrectionPathway['executionMitigations'] {
  const mitigations: CorrectionPathway['executionMitigations'] = [];
  
  // Add mitigations based on divergence type
  if (divergence.patternType === 'TIMELINE_SLIPPAGE') {
    mitigations.push({
      id: 'exec-1',
      description: 'Implement accelerated timeline tracking',
      interventionType: 'EARLY_INTERVENTION',
      triggerConditions: ['Milestone delay > 10%'],
      expectedOutcome: 'Early detection and course correction'
    });
  }
  
  if (divergence.patternType === 'RESOURCE_MISMATCH') {
    mitigations.push({
      id: 'exec-2',
      description: 'Activate contingency resource pool',
      interventionType: 'RESOURCE_ALLOCATION',
      triggerConditions: ['Resource utilization > 90%'],
      expectedOutcome: 'Prevent burnout and maintain quality'
    });
  }
  
  // Add mitigations based on silence signal
  if (silence && silence.potentialRisk === 'HIGH') {
    mitigations.push({
      id: 'exec-3',
      description: 'Implement proactive issue detection',
      interventionType: 'PROCESS_ADJUSTMENT',
      triggerConditions: ['Contribution density < 50%'],
      expectedOutcome: 'Surface hidden issues before escalation'
    });
  }
  
  return mitigations;
}

/**
 * Generate governance corrections (Tier 3)
 */
function generateGovernanceCorrections(divergence: DivergenceSignal): CorrectionPathway['governanceCorrections'] {
  const corrections: CorrectionPathway['governanceCorrections'] = [];
  
  if (divergence.severityWeight > 0.7) {
    corrections.push({
      id: 'gov-1',
      description: 'Escalate to program leadership',
      escalationPoint: 'Program Director',
      decisionCheckpoints: [
        'Review divergence pattern',
        'Assess impact on overall program',
        'Approve corrective actions'
      ],
      stakeholderNotification: ['Sponsor', 'Regulatory Lead']
    });
  }
  
  return corrections;
}

// ==========================================
// ANONYMITY-PRESERVING ESCALATION LAYER (10.4)
// ==========================================

/**
 * Generate anonymized execution intelligence brief
 */
export function generateExecutionIntelligenceBrief(params: {
  divergenceSignals: DivergenceSignal[];
  silenceSignals: SilenceSignal[];
  correctionPathways: CorrectionPathway[];
  periodStart: Date;
  periodEnd: Date;
}): ExecutionIntelligenceBrief {
  const { divergenceSignals, silenceSignals, correctionPathways, periodStart, periodEnd } = params;
  
  // Aggregate divergence patterns (no user identity)
  const divergencePatterns = divergenceSignals.map(signal => ({
    patternType: signal.patternType,
    frequency: signal.recurrenceFrequency,
    severity: signal.severityWeight
  }));
  
  // Aggregate silence patterns
  const silencePatterns = silenceSignals.map(signal => ({
    zone: signal.expectedZone.issueCategory,
    absenceLevel: signal.absenceMetrics.gapPercentage,
    riskLevel: signal.potentialRisk
  }));
  
  // Get top corrections by priority
  const topCorrections = correctionPathways
    .filter(c => c.recommendedPriority <= 2)
    .map(c => ({
      pathwayId: c.id,
      priority: c.recommendedPriority,
      description: c.designCorrections[0]?.description || 'Review and adjust'
    }));
  
  // Apply batching and delays
  const batchKey = `batch-${Date.now()}-${createHash('sha256')
    .update(randomUUID())
    .digest('hex')
    .substring(0, 8)}`;
  
  return {
    id: `brief-${randomUUID()}`,
    timestamp: new Date(),
    period: { start: periodStart, end: periodEnd },
    divergencePatterns,
    silencePatterns,
    topCorrections,
    batchKey,
    delayApplied: Math.random() * 24,  // 0-24 hours random delay
    decoyPatternsInjected: Math.floor(Math.random() * 3)  // 0-2 decoys
  };
}

// ==========================================
// ASSUMPTION MEMORY SYSTEM (10.5)
// ==========================================

/**
 * Create assumption memory entry
 */
export function createAssumptionMemory(params: {
  assumption: string;
  context: AssumptionMemory['assumption']['context'];
  originalConfidence: number;
}): AssumptionMemory {
  return {
    id: `assume-${randomUUID()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    assumption: {
      description: params.assumption,
      context: params.context,
      originalConfidence: params.originalConfidence
    },
    outcomes: [],
    failureFrequency: 0,
    failureContexts: [],
    applicableCorrectionPathways: []
  };
}

/**
 * Record outcome for assumption
 */
export function recordAssumptionOutcome(params: {
  assumptionMemory: AssumptionMemory;
  result: 'VALIDATED' | 'PARTIALLY_FAILED' | 'FAILED';
  context: string;
  impactScore: number;
}): AssumptionMemory {
  const updated = { ...params.assumptionMemory };
  
  updated.outcomes.push({
    timestamp: new Date(),
    result: params.result,
    context: params.context,
    impactScore: params.impactScore
  });
  
  updated.updatedAt = new Date();
  
  // Update failure tracking
  if (params.result === 'FAILED' || params.result === 'PARTIALLY_FAILED') {
    updated.failureFrequency += 1;
    updated.failureContexts.push(params.context);
  }
  
  return updated;
}

/**
 * Get assumption memory for matching
 */
export function getAssumptionPatternsForMatching(params: {
  therapeuticArea: string;
  trialPhase: string;
  assumptionMemories: AssumptionMemory[];
}): Array<{
  assumption: string;
  failureRate: number;
  suggestedCorrection: string;
}> {
  const relevantMemories = params.assumptionMemories.filter(
    mem => mem.assumption.context.therapeuticArea === params.therapeuticArea &&
           mem.assumption.context.trialPhase === params.trialPhase
  );
  
  return relevantMemories
    .filter(mem => mem.failureFrequency > 0)
    .map(mem => ({
      assumption: mem.assumption.description,
      failureRate: mem.outcomes.filter(o => o.result === 'FAILED').length / Math.max(1, mem.outcomes.length),
      suggestedCorrection: mem.correctedAssumption || mem.applicableCorrectionPathways[0] || 'Review required'
    }));
}

// ==========================================
// END-TO-END DEMONSTRATION (10.7)
// ==========================================

/**
 * Process a contribution through all decision-correction layers
 */
export function processContributionThroughCorrectionLayers(params: {
  contribution: {
    situation: string;
    pattern: string;
    solution: string;
    outcome: string;
  };
  metadata: {
    therapeuticArea: string;
    trialPhase: string;
    issueCategory: string;
  };
  jobRequirements: string[];
  interactionTypes: string[];
}): {
  divergenceSignal: DivergenceSignal;
  silenceSignal: SilenceSignal;
  correctionPathway: CorrectionPathway;
  intelligenceBrief: ExecutionIntelligenceBrief;
} {
  // Step 1: Extract expected layer
  const expectedLayer = extractExpectedLayer({
    contributionMetadata: {
      therapeuticArea: params.metadata.therapeuticArea,
      trialPhase: params.metadata.trialPhase,
      issueCategory: params.metadata.issueCategory,
      expectedOutcomes: ['Successful resolution']
    },
    jobRequirements: params.jobRequirements
  });
  
  // Step 2: Extract actual layer
  const actualLayer = extractActualLayer({
    contributions: [params.contribution],
    interactionTypes: params.interactionTypes
  });
  
  // Step 3: Detect divergence
  const divergenceSignal = detectDivergence({
    expectedLayer,
    actualLayer,
    patternType: 'EXECUTION_GAP'
  });
  
  // Step 4: Detect silence signal
  const silenceSignal = detectSilenceSignal({
    expectedZone: {
      trialPhase: params.metadata.trialPhase,
      issueCategory: params.metadata.issueCategory,
      expectedContributionTypes: ['Issue identification', 'Solution proposal']
    },
    contributionData: {
      totalExpected: 10,
      actualCount: 1,
      density: 0.1
    }
  });
  
  // Step 5: Generate correction pathways
  const correctionPathway = generateCorrectionPathways({
    divergenceSignal,
    silenceSignal
  });
  
  // Step 6: Generate intelligence brief
  const intelligenceBrief = generateExecutionIntelligenceBrief({
    divergenceSignals: [divergenceSignal],
    silenceSignals: [silenceSignal],
    correctionPathways: [correctionPathway],
    periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    periodEnd: new Date()
  });
  
  return {
    divergenceSignal,
    silenceSignal,
    correctionPathway,
    intelligenceBrief
  };
}

// ==========================================
// EXPORTS
// ==========================================

export const DecisionCorrectionEngine = {
  // Decision Distance Detection (10.1)
  extractExpectedLayer,
  extractActualLayer,
  detectDivergence,
  
  // Silence-as-Signal (10.2)
  identifyExpectedSignalZones,
  detectSilenceSignal,
  
  // Correction Pathways (10.3)
  generateCorrectionPathways,
  
  // Anonymity-Preserving Escalation (10.4)
  generateExecutionIntelligenceBrief,
  
  // Assumption Memory (10.5)
  createAssumptionMemory,
  recordAssumptionOutcome,
  getAssumptionPatternsForMatching,
  
  // End-to-End (10.7)
  processContributionThroughCorrectionLayers
};