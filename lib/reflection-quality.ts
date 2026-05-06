/**
 * REFLECTION QUALITY GATE
 * 
 * Ensures reflections meet minimum quality before reaching users.
 * 
 * Rules:
 * - Reject vague/generic outputs
 * - Enforce minimum specificity
 * - Require: Pattern Label, Context Tagging, Observed Workarounds, Confidence, Risk Direction
 * - Pattern names must be SPECIFIC and CAUSAL, not generic categories
 * 
 * "This is exactly my situation—and others are dealing with it too."
 */

import type { PatternMaturity } from './translation-engine';

// ==========================================
// TYPES
// ==========================================

export interface ReflectionQualityResult {
  passes: boolean;
  score: number; // 0-100
  failures: string[];
  fixes: QualityFix[];
}

export interface QualityFix {
  field: string;
  issue: string;
  suggestion: string;
}

export interface SpecificPatternName {
  patternLabel: string;
  patternName: string;      // e.g., "Screening Yield Collapse due to Over-Restricted Eligibility"
  causalChain: string;       // e.g., "Eligibility criteria → low screen fail rate → enrollment shortfall"
  isSpecific: boolean;
}

// ==========================================
// VAGUE OUTPUT DETECTION
// ==========================================

const VAGUE_PHRASES = [
  'this issue',
  'this situation',
  'this problem',
  'this concern',
  'this matter',
  'things like this',
  'similar issues',
  'this type of thing',
  'this kind of problem',
  'the situation',
  'the problem',
  'the issue',
];

const GENERIC_PATTERN_NAMES = [
  'enrollment issues',
  'protocol burden',
  'site overload',
  'staffing issues',
  'operational challenges',
  'data quality problems',
  'regulatory challenges',
  'patient burden',
  'timeline pressure',
  'training gaps',
  'resource constraints',
  'cro disconnect',
  'reimbursement issues',
];

// ==========================================
// PATTERN NAMING SYSTEM
// ==========================================

/**
 * Pattern naming templates — causal, specific, not generic
 * 
 * Instead of: "Enrollment Issues"
 * Use: "Screening Yield Collapse due to Over-Restricted Eligibility"
 * 
 * Each template is: [cause] → [mechanism] → [observed effect]
 */
const SPECIFIC_PATTERN_TEMPLATES: Record<string, string[]> = {
  'Enrollment': [
    'Screening Yield Collapse due to Over-Restricted Eligibility',
    'Enrollment Velocity Loss from Protocol Complexity Overhead',
    'Site Selection Mismatch Causing Consistent Underperformance',
    'Patient Funnel Narrowing from Overlapping Inclusion Criteria',
    'Enrollment Deadlines Creating Site-Level Shortcuts',
  ],
  'Protocol Burden': [
    'Protocol Complexity Drift Causing Site Workarounds',
    'Amendment Accumulation Eroding Site Compliance Capacity',
    'Visit Schedule Overload Driving Protocol Deviation Patterns',
    'Unnecessary Assessment Burden Creating Data Quality Degradation',
    'Protocol Rigidity Preventing Site-Level Adaptation',
  ],
  'Site Overload': [
    'Study Volume Overload Causing Multi-Protocol Coordination Failure',
    'Staff Capacity Exhaustion from Competing Trial Demands',
    'Site Infrastructure Strain from Protocol Requirements Exceeding Capability',
    'Key Person Dependency Creating Single-Point-of-Failure Risk',
    'Resource Allocation Collapse Under Concurrent Study Load',
  ],
  'Sponsor Expectations': [
    'Timeline Pressure Creating Data Integrity Compromise',
    'Sponsor-Site Expectation Mismatch Driving Unofficial Workarounds',
    'Aggressive Enrollment Targets Forcing Eligibility Boundary Testing',
    'Sponsor Monitoring Overhead Consuming Site Operational Capacity',
    'Unrealistic Milestone Pressure Generating Protocol Shortcuts',
  ],
  'Data Integrity': [
    'Data Quality Erosion from Inadequate EDC Training',
    'Query Backlog Accumulation Creating Resolution Delays',
    'Source Data Verification Gaps from Monitoring Resource Constraints',
    'Data Entry Shortcuts Under Time Pressure Generating Systematic Errors',
    'Cross-Site Data Inconsistency from Insufficient Standardization',
  ],
  'Staffing': [
    'CRC Turnover Causing Institutional Knowledge Loss',
    'Training Gaps Generating Systematic Protocol Deviations',
    'Cross-Study Staff Stretch Creating Error-Prone Handoffs',
    'New Staff Onboarding Deficit Creating Compliance Gaps',
    'Investigator Availability Constraints Delaying Sign-off Workflows',
  ],
  'Patient Retention': [
    'Visit Burden Accumulation Driving Patient Dropout',
    'Informed Consent Complexity Creating Post-Randomization Withdrawals',
    'Protocol Demands Exceeding Patient Tolerance Thresholds',
    'Lack of Patient-Centric Design Causing Engagement Erosion',
    'Travel and Logistical Burden Creating Systematic Attrition',
  ],
  'Budget/Reimbursement': [
    'Reimbursement Delays Creating Site Cash Flow Strain',
    'Budget Inadequacy Forcing Unofficial Cost Absorption',
    'Grant Payment Lag Eroding Site Participation Willingness',
    'Cost Shifting from Sponsor to Site Creating Unsustainable Burden',
    'Contract Negotiation Stalls Delaying Site Activation',
  ],
  'Regulatory': [
    'IRB Review Bottleneck Delaying Study Timelines',
    'Regulatory Submission Complexity Creating Compliance Fatigue',
    'Safety Reporting Overhead Consuming Operational Capacity',
    'Regulatory Interpretation Variance Across Sites',
    'GCP Compliance Erosion Under Operational Pressure',
  ],
  'Operational': [
    'Lack of Standardization Creating Cross-Site Variability',
    'Process Gaps Driving Unofficial Local Workarounds',
    'Communication Breakdown Between Stakeholders Causing Execution Drift',
    'Operational Debt Accumulation from Repeated Temporary Fixes',
    'Vendor Coordination Failure Creating Study-Level Delays',
  ],
};

/**
 * Generate a specific, causal pattern name
 * 
 * Instead of generic categories, produces names like:
 * "Screening Yield Collapse due to Over-Restricted Eligibility"
 */
export function generateSpecificPatternName(
  issueCategory: string,
  suppressedSignalType?: string,
  workaroundType?: string,
  emotionalSignalType?: string,
  burdenAbsorber?: string,
  decisionDistanceLevel?: string
): SpecificPatternName {
  const templates = SPECIFIC_PATTERN_TEMPLATES[issueCategory] || 
    SPECIFIC_PATTERN_TEMPLATES['Operational'] || 
    ['Operational Pattern Detected'];
  
  // Select template based on signal features to add specificity
  let templateIndex = 0;
  
  if (suppressedSignalType && suppressedSignalType !== 'UNKNOWN') {
    templateIndex = (templateIndex + 1) % templates.length;
  }
  if (workaroundType && workaroundType !== 'UNKNOWN') {
    templateIndex = (templateIndex + 1) % templates.length;
  }
  if (emotionalSignalType === 'OVERLOAD' || emotionalSignalType === 'RESIGNATION') {
    templateIndex = (templateIndex + 2) % templates.length;
  }
  if (decisionDistanceLevel === 'HIGH' || decisionDistanceLevel === 'CRITICAL') {
    templateIndex = (templateIndex + 1) % templates.length;
  }
  
  const patternName = templates[templateIndex];
  
  // Generate causal chain
  const causalChain = buildCausalChain(
    issueCategory,
    suppressedSignalType,
    workaroundType,
    burdenAbsorber
  );
  
  return {
    patternLabel: issueCategory.toLowerCase().replace(/\s+/g, '-'),
    patternName,
    causalChain,
    isSpecific: true
  };
}

/**
 * Build a causal chain string from signal features
 * e.g., "Over-restricted eligibility → low screen yield → enrollment shortfall"
 */
function buildCausalChain(
  issueCategory: string,
  suppressedSignalType?: string,
  workaroundType?: string,
  burdenAbsorber?: string
): string {
  const chains: Record<string, string[][]> = {
    'Enrollment': [
      ['over-restricted eligibility', 'low screen yield', 'enrollment shortfall'],
      ['protocol complexity', 'screening bottleneck', 'missed targets'],
      ['site capacity mismatch', 'recruitment delays', 'timeline pressure'],
    ],
    'Protocol Burden': [
      ['amendment accumulation', 'compliance fatigue', 'workaround normalization'],
      ['visit schedule overload', 'site shortcuts', 'deviation patterns'],
      ['unnecessary assessments', 'data quality erosion', 'monitoring gaps'],
    ],
    'Site Overload': [
      ['study volume growth', 'staff exhaustion', 'coordination failure'],
      ['competing demands', 'priority conflicts', 'quality compromise'],
      ['resource constraints', 'key person dependency', 'single-point failure risk'],
    ],
    'Sponsor Expectations': [
      ['unrealistic timelines', 'site shortcuts', 'integrity risk'],
      ['enrollment pressure', 'eligibility boundary testing', 'compliance drift'],
      ['monitoring overhead', 'operational capacity drain', 'workaround culture'],
    ],
    'Data Integrity': [
      ['time pressure', 'data entry shortcuts', 'systematic errors'],
      ['training gaps', 'EDC misuse', 'query accumulation'],
      ['monitoring constraints', 'verification gaps', 'undetected issues'],
    ],
    'Staffing': [
      ['turnover', 'institutional knowledge loss', 'compliance gaps'],
      ['training deficit', 'procedural errors', 'deviation patterns'],
      ['staff stretch', 'handoff failures', 'quality erosion'],
    ],
    'Patient Retention': [
      ['visit burden', 'patient fatigue', 'dropout escalation'],
      ['consent complexity', 'expectation mismatch', 'withdrawal'],
      ['logistical barriers', 'engagement erosion', 'attrition'],
    ],
    'Budget/Reimbursement': [
      ['payment delays', 'cash flow strain', 'participation decline'],
      ['budget inadequacy', 'cost absorption', 'workaround normalization'],
      ['contract stalls', 'activation delays', 'revenue loss'],
    ],
    'Regulatory': [
      ['review bottleneck', 'timeline delays', 'operational pressure'],
      ['reporting overhead', 'capacity drain', 'compliance fatigue'],
      ['interpretation variance', 'cross-site inconsistency', 'audit risk'],
    ],
    'Operational': [
      ['process gaps', 'local workarounds', 'variability increase'],
      ['communication breakdown', 'execution drift', 'alignment loss'],
      ['temporary fixes', 'technical debt', 'systemic degradation'],
    ],
  };

  const categoryChains = chains[issueCategory] || chains['Operational'];
  
  // Select chain based on signal features
  let chainIndex = 0;
  if (suppressedSignalType === 'NORMALIZED_WORKAROUND') chainIndex = 1;
  if (suppressedSignalType === 'ESCALATED_IGNORED') chainIndex = 2;
  if (workaroundType === 'PROCESS_SKIP') chainIndex = Math.min(chainIndex + 1, categoryChains.length - 1);
  
  const selectedChain = categoryChains[chainIndex];
  return selectedChain.join(' → ');
}

// ==========================================
// REFLECTION QUALITY GATE
// ==========================================

/**
 * Evaluate a reflection for quality before it reaches the user
 * 
 * Rejects reflections that are:
 * - Too vague/generic
 * - Missing required fields
 * - Using generic pattern names
 * - Lacking specificity
 */
export function evaluateReflectionQuality(reflection: {
  patternLabel?: string;
  patternName?: string;
  connections?: string[];
  peerObservations?: string[];
  observedWorkarounds?: string[];
  attemptedApproaches?: string[];
  failedApproaches?: string[];
  trajectoryAssessment?: string;
  classificationLabel?: string;
  confidenceLevel?: string;
  riskDirection?: string;
  contextTag?: string;
}): ReflectionQualityResult {
  const failures: string[] = [];
  const fixes: QualityFix[] = [];
  let score = 100;

  // 1. Check for vague language in connections
  if (reflection.connections) {
    for (const conn of reflection.connections) {
      for (const vague of VAGUE_PHRASES) {
        if (conn.toLowerCase().includes(vague)) {
          score -= 10;
          failures.push(`Vague language in connection: "${vague}"`);
          fixes.push({
            field: 'connections',
            issue: `Contains vague phrase: "${vague}"`,
            suggestion: 'Replace with specific reference to the actual issue, system, or constraint'
          });
          break; // One penalty per connection
        }
      }
    }
  }

  // 2. Check for generic pattern name
  if (reflection.patternName) {
    for (const generic of GENERIC_PATTERN_NAMES) {
      if (reflection.patternName.toLowerCase() === generic) {
        score -= 20;
        failures.push(`Generic pattern name: "${reflection.patternName}"`);
        fixes.push({
          field: 'patternName',
          issue: 'Pattern name is generic category, not specific causal name',
          suggestion: 'Use format: [Specific Effect] due to [Root Cause] (e.g., "Screening Yield Collapse due to Over-Restricted Eligibility")'
        });
        break;
      }
    }
  }

  // 3. Check for missing pattern name
  if (!reflection.patternName || reflection.patternName.trim() === '') {
    score -= 25;
    failures.push('Missing pattern name');
    fixes.push({
      field: 'patternName',
      issue: 'No pattern name provided',
      suggestion: 'Generate a specific, causal pattern name'
    });
  }

  // 4. Check for missing observed workarounds
  if (!reflection.observedWorkarounds || reflection.observedWorkarounds.length === 0) {
    score -= 15;
    failures.push('Missing observed workarounds');
    fixes.push({
      field: 'observedWorkarounds',
      issue: 'No observed workarounds listed',
      suggestion: 'Add 2-4 specific workarounds operators have reported for this type of issue'
    });
  }

  // 5. Check for missing confidence level
  if (!reflection.confidenceLevel || reflection.confidenceLevel.trim() === '') {
    score -= 10;
    failures.push('Missing confidence level');
    fixes.push({
      field: 'confidenceLevel',
      issue: 'No confidence level specified',
      suggestion: 'Set to Emerging, Repeating, or Strong'
    });
  }

  // 6. Check for missing context tag
  if (!reflection.contextTag || reflection.contextTag.trim() === '') {
    score -= 5;
    failures.push('Missing context tag');
    fixes.push({
      field: 'contextTag',
      issue: 'No context tag (TA/phase/role)',
      suggestion: 'Add context tag from extracted therapeutic area, phase, or role'
    });
  }

  // 7. Check peer observations aren't generic
  if (reflection.peerObservations) {
    const hasGenericObservation = reflection.peerObservations.some(obs => 
      obs.toLowerCase().includes('others have') && obs.toLowerCase().includes('similar') && obs.length < 60
    );
    if (hasGenericObservation) {
      score -= 10;
      failures.push('Generic peer observation — too short and vague');
      fixes.push({
        field: 'peerObservations',
        issue: 'Peer observation is generic and short',
        suggestion: 'Make peer observations specific to the type of issue, role, or context'
      });
    }
  }

  // 8. Check trajectory assessment specificity
  if (reflection.trajectoryAssessment) {
    const genericTrajectoryPhrases = [
      'this appears manageable',
      'this seems containable',
      'based on limited data',
    ];
    for (const phrase of genericTrajectoryPhrases) {
      if (reflection.trajectoryAssessment.toLowerCase().includes(phrase) && 
          reflection.trajectoryAssessment.length < 80) {
        score -= 5;
        failures.push('Trajectory assessment is too generic');
        fixes.push({
          field: 'trajectoryAssessment',
          issue: 'Trajectory assessment uses generic language',
          suggestion: 'Add specific risk factors or escalation indicators'
        });
        break;
      }
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  return {
    passes: score >= 60,
    score,
    failures,
    fixes
  };
}

/**
 * Build a context tag from extracted signal data
 * e.g., "Oncology • Phase III • CRA"
 */
export function buildContextTag(params: {
  therapeuticArea?: string;
  trialPhase?: string;
  roleCategory?: string;
}): string {
  const parts: string[] = [];
  if (params.therapeuticArea && params.therapeuticArea !== 'Other') {
    parts.push(params.therapeuticArea);
  }
  if (params.trialPhase && params.trialPhase !== 'Unknown') {
    parts.push(params.trialPhase);
  }
  if (params.roleCategory) {
    parts.push(params.roleCategory.toUpperCase());
  }
  return parts.join(' • ') || 'Clinical Operations';
}

/**
 * Map pattern maturity to user-facing confidence level
 * User sees: Emerging / Repeating / Strong
 * NOT: EMERGING / REPEATING / ESTABLISHED (internal terms)
 */
export function mapMaturityToConfidence(maturity: PatternMaturity): string {
  switch (maturity) {
    case 'EMERGING': return 'Emerging Pattern';
    case 'REPEATING': return 'Repeating Pattern';
    case 'ESTABLISHED': return 'Strong Pattern';
    default: return 'Emerging Pattern';
  }
}

/**
 * Determine risk direction from signal data
 * User-facing: "Stable" / "Worsening" / "Escalating" / "Critical"
 */
export function determineRiskDirection(params: {
  failureTrajectoryPrediction?: string;
  likelyDownstreamRisk?: string;
  workaroundPresent?: boolean;
  systemOfRecordMismatch?: boolean;
}): string {
  const { failureTrajectoryPrediction, likelyDownstreamRisk, workaroundPresent, systemOfRecordMismatch } = params;
  
  if (failureTrajectoryPrediction === 'HIGH_RISK_ESCALATION') return 'Critical';
  if (failureTrajectoryPrediction === 'LIKELY_ESCALATION') return 'Escalating';
  if (likelyDownstreamRisk === 'HIGH' || likelyDownstreamRisk === 'CRITICAL') return 'Worsening';
  if (workaroundPresent && systemOfRecordMismatch) return 'Worsening';
  if (workaroundPresent) return 'Stable but watched';
  return 'Stable';
}

export default {
  evaluateReflectionQuality,
  generateSpecificPatternName,
  buildContextTag,
  mapMaturityToConfidence,
  determineRiskDirection
};