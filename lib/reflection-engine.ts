/**
 * REFLECTION ENGINE — Upgraded
 * 
 * Reflection must TRANSLATE — not summarize.
 * 
 * Provides:
 * - "What this connects to" — pattern linkage
 * - "What others are seeing" — peer validation (anonymized)
 * - "What people tried" — solution attempts
 * - "What didn't hold up" — failed approaches
 * - "What this may turn into" — trajectory prediction
 * 
 * Classification:
 * - "This is commonly managed locally"
 * - "This tends to escalate into real execution risk"
 * 
 * Tone: Human, cautious, no overconfidence.
 * NEVER uses internal system language (no "SQS", "signal", "extraction").
 */

import { prisma } from './prisma';
import { ExecutionSignal, FailureTrajectory, PatternMaturity } from './translation-engine';
import {
  generateSpecificPatternName,
  buildContextTag,
  mapMaturityToConfidence,
  determineRiskDirection,
  evaluateReflectionQuality
} from './reflection-quality';

// ==========================================
// TYPES
// ==========================================

export type ReflectionClassification = 'commonly_managed_locally' | 'tends_to_escalate';

export interface ReflectionContent {
  // ── PATTERN LABEL (specific, causal — NOT generic category) ──
  patternName: string;           // e.g., "Screening Yield Collapse due to Over-Restricted Eligibility"
  causalChain: string;           // e.g., "over-restricted eligibility → low screen yield → enrollment shortfall"
  
  // ── CONTEXT TAGGING (invisible to user in raw form, used for display) ──
  contextTag: string;            // e.g., "Oncology • Phase III • CRA"
  
  // ── OBSERVED WORKAROUNDS (2-4 specific, real-feeling) ──
  observedWorkarounds: string[];
  
  // What this connects to
  connections: string[];
  
  // What others are seeing
  peerObservations: string[];
  
  // What people tried
  attemptedApproaches: string[];
  
  // What didn't hold up
  failedApproaches: string[];
  
  // What this may turn into
  trajectoryAssessment: string;
  
  // Classification
  classification: ReflectionClassification;
  classificationLabel: string;
  
  // ── PATTERN CONFIDENCE SIGNAL (user-facing) ──
  confidenceLevel: string;       // "Emerging Pattern" | "Repeating Pattern" | "Strong Pattern"
  
  // Confidence qualifier (internal, shown as subtle text)
  confidenceQualifier: string;
  
  // ── RISK DIRECTION ──
  riskDirection: string;         // "Stable" | "Stable but watched" | "Worsening" | "Escalating" | "Critical"
}

// ==========================================
// REFLECTION TEMPLATES
// ==========================================

const CONNECTION_TEMPLATES: Record<string, string[]> = {
  'Enrollment': [
    'This comes up a lot in enrollment conversations',
    'This connects to broader enrollment pressure patterns',
    'Similar enrollment challenges have been raised across multiple therapeutic areas'
  ],
  'Protocol Burden': [
    'Protocol complexity keeps appearing as a connected issue',
    'This links to a pattern of increasing protocol demands',
    'The protocol burden angle keeps showing up in different contexts'
  ],
  'Site Overload': [
    'Site capacity strain is a recurring theme with this type of issue',
    'This connects to the broader pattern of sites being stretched thin',
    'Multiple operators have flagged similar site capacity concerns'
  ],
  'Sponsor Expectations': [
    'Sponsor-operator misalignment is a pattern here',
    'This connects to ongoing tension between sponsor timelines and site reality',
    'The gap between what\'s expected and what\'s feasible keeps appearing'
  ],
  'Data Integrity': [
    'Data quality concerns often surface alongside this type of issue',
    'This connects to patterns of data quality being compromised under pressure',
    'The data integrity angle has been raised in similar contexts'
  ],
  'Staffing': [
    'Staffing strain is deeply connected to this issue',
    'This links to the pattern of key person dependencies at sites',
    'The human resource angle keeps coming up in similar situations'
  ],
  'Operational': [
    'Operational friction is a common thread here',
    'This connects to broader operational challenges in trial execution',
    'Similar operational patterns have been observed across sites'
  ],
  'Regulatory': [
    'Regulatory complexity often underlies this type of concern',
    'This connects to compliance challenges that keep emerging',
    'The regulatory burden angle is a recurring connection'
  ],
  'Patient Retention': [
    'Patient burden and retention are closely linked to this',
    'This connects to patterns of patients bearing increasing trial demands',
    'The patient impact angle has been highlighted in similar cases'
  ]
};

const PEER_OBSERVATION_TEMPLATES: Record<string, string[]> = {
  'workaround': [
    'Other operators have reported using similar workarounds',
    'This kind of workaround is more common than officially acknowledged',
    'Several people have described finding their own ways around this'
  ],
  'suppressed': [
    'Others have mentioned being hesitant to raise this formally',
    'This kind of concern often goes unreported through official channels',
    'More people are experiencing this than the numbers suggest'
  ],
  'mismatch': [
    'The gap between what\'s on paper and what\'s happening is widely felt',
    'Others have noted similar disconnects between official and actual practice',
    'This mismatch between system and reality is a shared experience'
  ],
  'burden': [
    'Many operators describe absorbing similar burdens without formal acknowledgment',
    'The hidden workload around this is something others have flagged too',
    'The real cost of this type of issue is often borne by the people closest to it'
  ],
  'general': [
    'Others in similar roles have raised related concerns',
    'This resonates with what multiple operators have described',
    'This is not an isolated experience'
  ]
};

const ATTEMPTED_APPROACHES: Record<string, string[]> = {
  'Enrollment': [
    'Some have tried adjusting screening criteria while staying within protocol',
    'Community outreach partnerships have been explored in similar cases',
    'Protocol amendments to reduce visit burden have been proposed'
  ],
  'Protocol Burden': [
    'Some sites have negotiated protocol modifications through amendments',
    'Risk-based approaches to reduce unnecessary assessments have been suggested',
    'Centralized monitoring has been tried to reduce on-site burden'
  ],
  'Site Overload': [
    'Prioritization frameworks for study workload have been attempted',
    'Some have brought in temporary support during peak periods',
    'Delegation strategies within the site team have been explored'
  ],
  'Sponsor Expectations': [
    'More frequent alignment calls have been tried by some teams',
    'Setting clearer expectations upfront has helped in some cases',
    'Documenting timeline constraints with data has been effective for some'
  ],
  'Staffing': [
    'Cross-training team members has been one approach',
    'Some sites have established backup coverage plans',
    'Contract support has been used as a bridge in similar situations'
  ],
  'general': [
    'Different approaches have been tried with varying success',
    'Some have found partial relief through process adjustments',
    'Local adaptations have worked in some contexts but not others'
  ]
};

const FAILED_APPROACHES: Record<string, string[]> = {
  'escalation': [
    'Escalating through official channels has not consistently led to change',
    'Formal reporting hasn\'t always resulted in action',
    'Raising concerns through standard pathways has sometimes led nowhere'
  ],
  'workaround_fix': [
    'Workarounds tend to become permanent rather than temporary',
    'Local fixes don\'t scale when the issue is systemic',
    'Ad hoc solutions often create new problems downstream'
  ],
  'communication': [
    'Simply communicating the issue hasn\'t been enough in most cases',
    'One-off conversations about this tend to fade without structural change',
    'Awareness alone doesn\'t seem to address the underlying cause'
  ],
  'general': [
    'Standard approaches haven\'t fully resolved this type of issue',
    'What works in one context doesn\'t always transfer to another',
    'Partial solutions tend to degrade over time'
  ]
};

const TRAJECTORY_TEMPLATES: Record<FailureTrajectory, string[]> = {
  'NONE': [
    'This appears manageable with standard attention',
    'This doesn\'t show signs of escalation at this point',
    'Based on what\'s described, this seems containable'
  ],
  'LIKELY_ESCALATION': [
    'Based on similar patterns, this has the potential to escalate if left unaddressed',
    'This type of situation has been observed to grow when not actively managed',
    'There are indicators here that suggest this could intensify — worth monitoring'
  ],
  'HIGH_RISK_ESCALATION': [
    'The combination of factors here is consistent with situations that escalate into real execution risk',
    'Similar patterns have been observed to develop into significant operational challenges',
    'This warrants close attention — the compound signals here are concerning'
  ]
};

const CLASSIFICATION_LABELS: Record<ReflectionClassification, string> = {
  'commonly_managed_locally': 'This is commonly managed locally',
  'tends_to_escalate': 'This tends to escalate into real execution risk'
};

// ==========================================
// MAIN FUNCTION
// ==========================================

/**
 * Generate reflection content for a contribution
 * 
 * The reflection TRANSLATES the submission into something actionable
 * without making the operator do any additional work.
 * 
 * QUALITY GATE: Reflection is evaluated before returning.
 * If it fails quality check, fallback specifics are injected.
 */
export async function generateReflection(
  contributionId: string,
  signal: ExecutionSignal,
  issueCategory: string,
  contextParams?: {
    therapeuticArea?: string;
    trialPhase?: string;
    roleCategory?: string;
  },
  patternMaturity?: PatternMaturity
): Promise<ReflectionContent> {
  // Fetch related data for richer reflection
  const relatedContributions = await findRelatedContributions(contributionId, issueCategory);
  const interactionData = await getInteractionPatterns(issueCategory);
  
  // ── PATTERN NAMING (specific, causal) ──
  const patternInfo = generateSpecificPatternName(
    issueCategory,
    signal.suppressedSignalType,
    signal.workaroundType ?? undefined,
    signal.emotionalSignalType,
    signal.burdenAbsorber,
    signal.decisionDistanceLevel
  );
  
  // ── CONTEXT TAG ──
  const contextTag = buildContextTag(contextParams || {});
  
  // ── OBSERVED WORKAROUNDS ──
  const observedWorkarounds = buildObservedWorkarounds(issueCategory, signal);
  
  // Build each reflection layer
  const connections = buildConnections(issueCategory, signal, relatedContributions);
  const peerObservations = buildPeerObservations(signal, interactionData);
  const attemptedApproaches = buildAttemptedApproaches(issueCategory, signal);
  const failedApproaches = buildFailedApproaches(signal, interactionData);
  const trajectoryAssessment = buildTrajectoryAssessment(signal);
  const classification = determineClassification(signal);
  const confidenceQualifier = determineConfidenceQualifier(signal);
  const confidenceLevel = mapMaturityToConfidence(patternMaturity || 'EMERGING');
  const riskDirection = determineRiskDirection({
    failureTrajectoryPrediction: signal.failureTrajectoryPrediction,
    likelyDownstreamRisk: signal.likelyDownstreamRisk,
    workaroundPresent: signal.workaroundPresent,
    systemOfRecordMismatch: signal.systemOfRecordMismatch
  });
  
  const reflection: ReflectionContent = {
    patternName: patternInfo.patternName,
    causalChain: patternInfo.causalChain,
    contextTag,
    observedWorkarounds,
    connections,
    peerObservations,
    attemptedApproaches,
    failedApproaches,
    trajectoryAssessment,
    classification,
    classificationLabel: CLASSIFICATION_LABELS[classification],
    confidenceLevel,
    confidenceQualifier,
    riskDirection
  };
  
  // ── QUALITY GATE ──
  const qualityResult = evaluateReflectionQuality(reflection);
  if (!qualityResult.passes) {
    console.warn(`Reflection quality gate failed (score: ${qualityResult.score}). Applying fixes.`);
    // Apply fixes where possible
    for (const fix of qualityResult.fixes) {
      if (fix.field === 'observedWorkarounds' && reflection.observedWorkarounds.length === 0) {
        reflection.observedWorkarounds = buildFallbackWorkarounds(issueCategory);
      }
      if (fix.field === 'contextTag' && !reflection.contextTag) {
        reflection.contextTag = 'Clinical Operations';
      }
    }
  }
  
  return reflection;
}

/**
 * Generate a simplified reflection for the confirmation screen
 * (Used immediately after submission, before full async processing)
 * 
 * QUALITY GATE: Same quality standards as full reflection.
 */
export function generateQuickReflection(
  signal: ExecutionSignal,
  issueCategory: string,
  contextParams?: {
    therapeuticArea?: string;
    trialPhase?: string;
    roleCategory?: string;
  }
): ReflectionContent {
  // ── PATTERN NAMING (specific, causal) ──
  const patternInfo = generateSpecificPatternName(
    issueCategory,
    signal.suppressedSignalType,
    signal.workaroundType ?? undefined,
    signal.emotionalSignalType,
    signal.burdenAbsorber,
    signal.decisionDistanceLevel
  );
  
  // ── CONTEXT TAG ──
  const contextTag = buildContextTag(contextParams || {});
  
  // ── OBSERVED WORKAROUNDS ──
  const observedWorkarounds = buildObservedWorkarounds(issueCategory, signal);
  
  const connections = buildConnections(issueCategory, signal, 0);
  const peerObservations = buildPeerObservations(signal, null);
  const attemptedApproaches = buildAttemptedApproaches(issueCategory, signal);
  const failedApproaches = buildFailedApproaches(signal, null);
  const trajectoryAssessment = buildTrajectoryAssessment(signal);
  const classification = determineClassification(signal);
  const confidenceQualifier = determineConfidenceQualifier(signal);
  const confidenceLevel = mapMaturityToConfidence('EMERGING'); // New = always Emerging
  const riskDirection = determineRiskDirection({
    failureTrajectoryPrediction: signal.failureTrajectoryPrediction,
    likelyDownstreamRisk: signal.likelyDownstreamRisk,
    workaroundPresent: signal.workaroundPresent,
    systemOfRecordMismatch: signal.systemOfRecordMismatch
  });
  
  const reflection: ReflectionContent = {
    patternName: patternInfo.patternName,
    causalChain: patternInfo.causalChain,
    contextTag,
    observedWorkarounds,
    connections,
    peerObservations,
    attemptedApproaches,
    failedApproaches,
    trajectoryAssessment,
    classification,
    classificationLabel: CLASSIFICATION_LABELS[classification],
    confidenceLevel,
    confidenceQualifier,
    riskDirection
  };
  
  // ── QUALITY GATE ──
  const qualityResult = evaluateReflectionQuality(reflection);
  if (!qualityResult.passes) {
    // Apply fallback fixes
    if (reflection.observedWorkarounds.length === 0) {
      reflection.observedWorkarounds = buildFallbackWorkarounds(issueCategory);
    }
    if (!reflection.contextTag) {
      reflection.contextTag = 'Clinical Operations';
    }
  }
  
  return reflection;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function findRelatedContributions(
  excludeId: string,
  issueCategory: string
): Promise<number> {
  try {
    // SQS FILTER: Only count MEDIUM+ quality contributions for pattern reflection
    const count = await prisma.contribution.count({
      where: {
        id: { not: excludeId },
        contributionType: 'situation',
        isHidden: false,
        isFlagged: false,
        signalQualityScore: { in: ['HIGH', 'MEDIUM'] },
        issueCategory
      }
    });
    return count;
  } catch {
    return 0;
  }
}

async function getInteractionPatterns(
  issueCategory: string
): Promise<{ hasWorkaroundInteractions: boolean; hasEscalationInteractions: boolean } | null> {
  try {
    // SQS FILTER: Only use MEDIUM+ quality contributions for interaction patterns
    const contributions = await prisma.contribution.findMany({
      where: {
        contributionType: 'situation',
        isHidden: false,
        isFlagged: false,
        signalQualityScore: { in: ['HIGH', 'MEDIUM'] },
        issueCategory
      },
      select: {
        workaroundPresent: true,
        suppressedSignalType: true,
      },
      take: 20
    });
    
    return {
      hasWorkaroundInteractions: contributions.some(c => c.workaroundPresent),
      hasEscalationInteractions: contributions.some(c => c.suppressedSignalType !== null && c.suppressedSignalType !== 'UNKNOWN')
    };
  } catch {
    return null;
  }
}

function buildConnections(
  issueCategory: string,
  signal: ExecutionSignal,
  relatedCount: number
): string[] {
  const templates = CONNECTION_TEMPLATES[issueCategory] || CONNECTION_TEMPLATES['Operational'];
  const connections: string[] = [];
  
  // Pick 1-2 templates
  const idx = Math.floor(Math.random() * templates.length);
  connections.push(templates[idx]);
  
  // Add drift-informed connection if drift detected
  if (signal.driftIndicators.length > 0) {
    connections.push('There are signs of gradual shift here — this isn\'t static');
  }
  
  // Add mismatch connection if detected
  if (signal.systemOfRecordMismatch) {
    connections.push('The disconnect between what\'s recorded and what\'s happening is a key thread');
  }
  
  // If there are related contributions, mention scale
  if (relatedCount > 3) {
    connections.push('This issue has come up multiple times from different people');
  }
  
  return connections.slice(0, 3);
}

function buildPeerObservations(
  signal: ExecutionSignal,
  interactionData: { hasWorkaroundInteractions: boolean; hasEscalationInteractions: boolean } | null
): string[] {
  const observations: string[] = [];
  
  // Determine which peer observation category to use
  let category = 'general';
  if (signal.workaroundPresent) category = 'workaround';
  else if (signal.suppressedSignalType !== 'UNKNOWN') category = 'suppressed';
  else if (signal.systemOfRecordMismatch) category = 'mismatch';
  else if (signal.burdenAbsorber !== 'UNKNOWN') category = 'burden';
  
  const templates = PEER_OBSERVATION_TEMPLATES[category] || PEER_OBSERVATION_TEMPLATES['general'];
  const idx = Math.floor(Math.random() * templates.length);
  observations.push(templates[idx]);
  
  // Add emotion-informed observation
  if (signal.emotionalSignalType === 'OVERLOAD' || signal.emotionalSignalType === 'RESIGNATION') {
    observations.push('The strain in this situation is something others have described too');
  } else if (signal.emotionalSignalType === 'SILENCED' || signal.emotionalSignalType === 'ESCALATION_FEAR') {
    observations.push('The reluctance to speak up about this is more common than it might seem');
  }
  
  // Add data-backed observation if interaction data supports it
  if (interactionData?.hasWorkaroundInteractions && signal.workaroundPresent) {
    observations.push('Similar workarounds have been noted by others in this area');
  }
  
  return observations.slice(0, 2);
}

function buildAttemptedApproaches(
  issueCategory: string,
  signal: ExecutionSignal
): string[] {
  const templates = ATTEMPTED_APPROACHES[issueCategory] || ATTEMPTED_APPROACHES['general'];
  const approaches: string[] = [];
  
  const idx = Math.floor(Math.random() * templates.length);
  approaches.push(templates[idx]);
  
  // If workaround present, mention that people have tried alternatives
  if (signal.workaroundPresent) {
    approaches.push('Some have developed local approaches to navigate around this');
  }
  
  return approaches.slice(0, 2);
}

function buildFailedApproaches(
  signal: ExecutionSignal,
  interactionData: { hasWorkaroundInteractions: boolean; hasEscalationInteractions: boolean } | null
): string[] {
  const approaches: string[] = [];
  
  // Default category
  let category = 'general';
  if (signal.suppressedSignalType === 'ESCALATED_IGNORED') category = 'escalation';
  else if (signal.workaroundPresent) category = 'workaround_fix';
  else if (signal.systemOfRecordMismatch) category = 'communication';
  
  const templates = FAILED_APPROACHES[category] || FAILED_APPROACHES['general'];
  const idx = Math.floor(Math.random() * templates.length);
  approaches.push(templates[idx]);
  
  return approaches.slice(0, 1);
}

function buildTrajectoryAssessment(signal: ExecutionSignal): string {
  const templates = TRAJECTORY_TEMPLATES[signal.failureTrajectoryPrediction];
  const idx = Math.floor(Math.random() * templates.length);
  return templates[idx];
}

function determineClassification(signal: ExecutionSignal): ReflectionClassification {
  // Tends to escalate if:
  // - High failure trajectory
  // - Suppressed signal with workaround
  // - Multiple compound risk factors
  if (signal.failureTrajectoryPrediction === 'HIGH_RISK_ESCALATION') return 'tends_to_escalate';
  if (signal.failureTrajectoryPrediction === 'LIKELY_ESCALATION' && signal.suppressedSignalType !== 'UNKNOWN') return 'tends_to_escalate';
  if (signal.workaroundPresent && signal.systemOfRecordMismatch && signal.suppressedSignalType !== 'UNKNOWN') return 'tends_to_escalate';
  if (signal.likelyDownstreamRisk === 'CRITICAL' || signal.likelyDownstreamRisk === 'HIGH') return 'tends_to_escalate';
  
  return 'commonly_managed_locally';
}

function determineConfidenceQualifier(signal: ExecutionSignal): string {
  if (signal.confidenceScore >= 0.8) return 'based on strong pattern indicators';
  if (signal.confidenceScore >= 0.6) return 'based on moderate pattern indicators';
  if (signal.confidenceScore >= 0.4) return 'based on early pattern indicators';
  return 'based on limited data — this assessment may change as more information becomes available';
}

// ==========================================
// OBSERVED WORKAROUNDS BUILDER
// ==========================================

/**
 * Build 2-4 specific observed workarounds for the reflection
 * 
 * These must feel REAL — like things operators actually do
 * Not generic "some have tried process adjustments"
 */
const WORKAROUND_TEMPLATES: Record<string, string[]> = {
  'Enrollment': [
    'Broadening screening outreach beyond traditional referral channels',
    'Pre-screening candidates informally before formal enrollment steps',
    'Relaxing inclusion criteria through protocol amendments where possible',
    'Cross-site patient sharing arrangements to meet enrollment targets',
  ],
  'Protocol Burden': [
    'Skipping non-critical visit assessments to stay on schedule',
    'Using unofficial data entry shortcuts in EDC to save time',
    'Delegating protocol-mandated tasks to unqualified staff under pressure',
    'Batch-entering data from source documents instead of real-time capture',
  ],
  'Site Overload': [
    'Splitting coordinator duties across concurrent studies despite capacity limits',
    'Using temporary or contract staff to fill critical CRC gaps',
    'Deprioritizing lower-enrolling studies to keep higher-priority ones afloat',
    'Deferring regulatory document updates to manage immediate operational fires',
  ],
  'Sponsor Expectations': [
    'Adjusting reported timelines upward to set more realistic expectations',
    'Documenting timeline constraints with data to push back on sponsor pressure',
    'Creating parallel internal tracking that reflects reality vs. what\'s reported',
    'Escalating concerns through unofficial channels when formal ones fail',
  ],
  'Data Integrity': [
    'Running local data quality checks before official monitoring visits',
    'Creating shadow correction logs to track EDC fixes informally',
    'Pre-filling routine CRF data to reduce per-patient entry burden',
    'Cross-referencing source documents manually when EDC queries are backlogged',
  ],
  'Staffing': [
    'Cross-training team members across study roles for emergency coverage',
    'Building informal backup coverage plans that aren\'t in the delegation log',
    'Using study-specific checklists to reduce training gaps for new staff',
    'Documenting key institutional knowledge before coordinator turnover hits',
  ],
  'Patient Retention': [
    'Adding flexible visit windows to reduce patient travel burden',
    'Implementing patient navigation support to handle logistics barriers',
    'Using telehealth options where protocol allows to reduce visit burden',
    'Creating patient-friendly visit schedules that deviate from default templates',
  ],
  'Budget/Reimbursement': [
    'Front-loading critical study costs before budget approval delays hit',
    'Using internal cost tracking that accounts for actual vs. budgeted amounts',
    'Negotiating milestone-based payments to improve cash flow predictability',
    'Cross-subsidizing study costs from operational overhead where possible',
  ],
  'Regulatory': [
    'Pre-preparing regulatory submissions using templates to reduce cycle time',
    'Building relationships with IRB coordinators to anticipate review bottlenecks',
    'Creating internal compliance checklists that exceed minimum GCP requirements',
    'Batching safety reports to reduce individual submission overhead',
  ],
  'Operational': [
    'Creating local standard operating procedures where global SOPs are too generic',
    'Building informal communication channels when official ones are too slow',
    'Using shared tracking documents when CTMS doesn\'t capture operational reality',
    'Deferring non-critical updates to focus on immediate execution priorities',
  ],
};

function buildObservedWorkarounds(
  issueCategory: string,
  signal: ExecutionSignal
): string[] {
  const templates = WORKAROUND_TEMPLATES[issueCategory] || WORKAROUND_TEMPLATES['Operational'];
  const workarounds: string[] = [];
  
  // Always pick at least 2, up to 4
  // Use signal features to select relevant ones
  const indices = new Set<number>();
  
  // Seed selection based on signal features
  if (signal.workaroundPresent) {
    // If workaround detected, pick ones most related to the workaround type
    indices.add(0);
    indices.add(1);
  }
  if (signal.systemOfRecordMismatch) {
    indices.add(1);  // Data-related workaround
  }
  if (signal.burdenAbsorber === 'SITE' || signal.burdenAbsorber === 'OPERATOR') {
    indices.add(2);  // Staff/capacity-related workaround
  }
  if (signal.suppressedSignalType === 'NORMALIZED_WORKAROUND') {
    indices.add(3);  // The normalized workaround
  }
  
  // Fill remaining slots
  while (indices.size < 2) {
    indices.add(Math.floor(Math.random() * templates.length));
  }
  while (indices.size < Math.min(4, templates.length)) {
    indices.add(Math.floor(Math.random() * templates.length));
  }
  
  for (const idx of indices) {
    if (idx < templates.length) {
      workarounds.push(templates[idx]);
    }
  }
  
  return workarounds.slice(0, 4);
}

/**
 * Fallback workarounds when quality gate fails and observed workarounds are empty
 */
function buildFallbackWorkarounds(issueCategory: string): string[] {
  const templates = WORKAROUND_TEMPLATES[issueCategory] || WORKAROUND_TEMPLATES['Operational'];
  return templates.slice(0, 2); // Return first 2 as safe defaults
}

export default {
  generateReflection,
  generateQuickReflection
};