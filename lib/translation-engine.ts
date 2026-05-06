/**
 * TRANSLATION ENGINE — Core System
 * 
 * Converts raw operator truth into structured Execution Intelligence.
 * 
 * This is NOT a summarizer. This is a TRANSLATOR.
 * Raw text → Structured signal → Predictive insight → Economic opportunity
 * 
 * Architecture:
 * - Deterministic keyword + pattern extraction (no LLM dependency)
 * - Multi-layer signal detection
 * - Suppressed signal, emotional signal, workaround, mismatch detection
 * - Failure trajectory prediction
 * - Signal quality scoring
 */

import { structureSubmission, StructuringResult } from './ai-structuring';

// ==========================================
// TYPES
// ==========================================

export type SuppressedSignalType =
  | 'NOT_ESCALATED'
  | 'ESCALATED_IGNORED'
  | 'NORMALIZED_WORKAROUND'
  | 'FEAR_OF_PUSHBACK'
  | 'SPONSOR_PRESSURE'
  | 'CRO_PRESSURE'
  | 'SITE_SILENCE'
  | 'UNKNOWN';

export type EmotionalSignalType =
  | 'OVERLOAD'
  | 'FRUSTRATION'
  | 'RESIGNATION'
  | 'SILENCED'
  | 'ESCALATION_FEAR'
  | 'UNKNOWN';

export type WorkaroundType =
  | 'PROCESS_SKIP'
  | 'DATA_SHORTCUT'
  | 'OFF_LABEL_PROCEDURE'
  | 'UNOFFICIAL_TOOL'
  | 'MANUAL_WORKAROUND'
  | 'UNKNOWN';

export type DecisionDistanceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type BurdenAbsorber = 'SITE' | 'PATIENT' | 'OPERATOR' | 'SPONSOR' | 'CRO' | 'UNKNOWN';
export type BurdenType = 'TIME' | 'COMPLEXITY' | 'EMOTIONAL' | 'FINANCIAL' | 'OPERATIONAL' | 'UNKNOWN';

export type InvisibleWorkType =
  | 'COORDINATION'
  | 'COMMUNICATION'
  | 'DOCUMENTATION'
  | 'TRAINING'
  | 'TROUBLESHOOTING'
  | 'ADVOCACY'
  | 'UNKNOWN';

export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EscalationPattern = 'NONE' | 'LOCAL' | 'REGIONAL' | 'GLOBAL' | 'ESCALATING';
export type FailureTrajectory = 'NONE' | 'LIKELY_ESCALATION' | 'HIGH_RISK_ESCALATION';
export type SignalQualityScore = 'HIGH' | 'MEDIUM' | 'LOW';
export type PatternMaturity = 'EMERGING' | 'REPEATING' | 'ESTABLISHED';

export interface ExecutionSignal {
  // Suppressed Signal
  suppressedSignalType: SuppressedSignalType;
  
  // Emotional Signal
  emotionalSignalType: EmotionalSignalType;
  
  // Workaround
  workaroundPresent: boolean;
  workaroundType: WorkaroundType | null;
  
  // System Mismatch
  systemOfRecordMismatch: boolean;
  officialRealityGap: number; // 0-1
  
  // Decision Distance
  decisionDistanceLevel: DecisionDistanceLevel;
  
  // Burden
  burdenAbsorber: BurdenAbsorber;
  burdenType: BurdenType;
  
  // Invisible Work
  invisibleWorkType: InvisibleWorkType;
  
  // Risk & Impact
  likelyDownstreamRisk: RiskLevel;
  escalationPattern: EscalationPattern;
  patientImpactPotential: RiskLevel;
  operationalDebtLevel: number; // 0-1
  
  // Economic Value
  economicValuePotential: number; // 0-1
  microOpportunityEligible: boolean;
  
  // Drift Indicators
  driftIndicators: string[];
  
  // Failure Trajectory
  failureTrajectoryPrediction: FailureTrajectory;
  
  // Signal Quality
  signalQualityScore: SignalQualityScore;
  
  // Predictive Summary
  predictiveSummary: string;
  confidenceScore: number; // 0-1
}

// ==========================================
// PATTERN DEFINITIONS — SUPPRESSED SIGNALS
// ==========================================

const SUPPRESSED_SIGNAL_PATTERNS: Record<SuppressedSignalType, string[]> = {
  NOT_ESCALATED: [
    'no one is escalating', 'nobody has escalated', 'not being escalated',
    'we should escalate but', 'hesitant to escalate', 'afraid to escalate',
    'not reporting this', 'keeping quiet about', 'not raising this',
    "won't escalate", "can't escalate", 'avoid escalation',
    'brushed under', 'swept under', 'not bringing it up'
  ],
  ESCALATED_IGNORED: [
    'escalated but', 'reported but nothing', 'raised it but',
    'escalated and was ignored', 'told them but', 'flagged it but',
    'escalated to no avail', 'brought it up but', 'notified but no response',
    'complaint was dismissed', 'concern was dismissed', 'ignored by management',
    'fell on deaf ears', 'went nowhere'
  ],
  NORMALIZED_WORKAROUND: [
    'we just', 'we always', 'normally we just', 'our workaround',
    'the way we handle it', 'we work around', 'our little trick',
    'we have to work around', 'everybody knows but', 'open secret',
    'this is just how we do it', 'we have adapted', 'learned to live with',
    'this is normal now', 'accepted as normal', 'par for the course',
    'just the way it is', 'new normal'
  ],
  FEAR_OF_PUSHBACK: [
    'afraid to speak up', 'worried about', 'fear of',
    'retaliation', 'pushback', 'backlash', 'retribution',
    "don't want to rock", 'keep my head down', 'stay under the radar',
    'not worth the fight', 'given up trying', 'stopped pushing',
    'scared to say', 'worried they will', 'might get in trouble'
  ],
  SPONSOR_PRESSURE: [
    'sponsor wants', 'sponsor expects', 'sponsor is pushing',
    'pressure from sponsor', 'sponsor demanded', 'sponsor insisted',
    'sponsor deadline', 'sponsor breathing down', 'sponsor override',
    'sponsor said we have to', 'sponsor making us', 'sponsor forcing',
    'under pressure from sponsor', 'sponsor unrealistic'
  ],
  CRO_PRESSURE: [
    'cro wants', 'cro expects', 'cro is pushing',
    'pressure from cro', 'cro demanded', 'cro insisted',
    'cro deadline', 'cro making us', 'cro forcing',
    'under pressure from cro', 'cro unrealistic', 'cro override',
    'cro breathing down', 'cro said we have to'
  ],
  SITE_SILENCE: [
    'site won\'t report', 'site is quiet', 'site doesn\'t say',
    'site afraid to', 'site won\'t flag', 'site keeping quiet',
    'site not escalating', 'site hesitant', 'site reluctant',
    'site won\'t bring it up', 'site stays silent', 'site doesn\'t want to',
    'site underreporting', 'site afraid of consequences'
  ],
  UNKNOWN: []
};

// ==========================================
// PATTERN DEFINITIONS — EMOTIONAL SIGNALS
// ==========================================

const EMOTIONAL_SIGNAL_PATTERNS: Record<EmotionalSignalType, string[]> = {
  OVERLOAD: [
    'overwhelmed', 'drowning', 'underwater', 'buried', 'swamped',
    'too much', 'can\'t keep up', 'burning out', 'burned out',
    'exhausted', 'depleted', 'at capacity', 'maxed out',
    'spread thin', 'stretched too thin', 'no bandwidth',
    'barely keeping up', 'barely treading water', 'behind on everything'
  ],
  FRUSTRATION: [
    'frustrated', 'annoyed', 'fed up', 'sick of', 'tired of',
    'ridiculous', 'unbelievable', 'absurd', 'makes no sense',
    'keeps happening', 'over and over', 'nothing changes',
    'nobody listens', 'falling on deaf ears', 'waste of time',
    'pointless', 'going nowhere', 'hitting a wall'
  ],
  RESIGNATION: [
    'given up', 'stopped trying', 'what\'s the point', 'doesn\'t matter',
    'nothing will change', 'it is what it is', 'used to it',
    'just accept it', 'no point fighting', 'learned to live with',
    'stopped caring', 'whatever', 'at this point', 'no hope',
    'resigned to', 'came to terms', 'just going through the motions'
  ],
  SILENCED: [
    'told not to', 'asked not to', 'not allowed to say',
    'can\'t talk about', 'not supposed to mention', 'keep it to myself',
    'don\'t bring it up', 'not my place', 'keep my mouth shut',
    'biting my tongue', 'holding back', 'not speaking up',
    'keeping quiet', 'staying silent', 'not my call'
  ],
  ESCALATION_FEAR: [
    'afraid to escalate', 'scared to report', 'worried about escalating',
    'don\'t want to be the one', 'what if i escalate', 'fear of escalating',
    'nervous about reporting', 'anxious about flagging',
    'don\'t want to be labeled', 'whistleblower', 'troublemaker',
    'marked as difficult', 'be careful what you say'
  ],
  UNKNOWN: []
};

// ==========================================
// PATTERN DEFINITIONS — WORKAROUNDS
// ==========================================

const WORKAROUND_PATTERNS: Record<WorkaroundType, string[]> = {
  PROCESS_SKIP: [
    'skip the', 'bypass', 'skip this step', 'cut corners',
    'skip the process', 'work around the process', 'skip it',
    'don\'t follow the process', 'skip protocol', 'skip the procedure'
  ],
  DATA_SHORTCUT: [
    'data shortcut', 'fudge the data', 'adjust the numbers',
    'massage the data', 'make the data work', 'data entry shortcut',
    'copy paste', 'batch entry', 'quick entry', 'backfill',
    'enter it later', 'catch up on data', 'data workaround'
  ],
  OFF_LABEL_PROCEDURE: [
    'off label', 'not by the book', 'our own way', 'different approach',
    'improvised', 'ad hoc', 'made up our own', 'unofficial procedure',
    'not standard practice', 'our own protocol', 'modified protocol'
  ],
  UNOFFICIAL_TOOL: [
    'spreadsheet instead', 'excel tracker', 'our own tracker',
    'shadow system', 'separate tracker', 'personal tracker',
    'google sheet', 'not using the system', 'side tracker',
    'unofficial tool', 'workaround tracker', 'offline tracker'
  ],
  MANUAL_WORKAROUND: [
    'manually', 'by hand', 'doing it manually', 'manual process',
    'manual workaround', 'paper and pen', 'pen and paper',
    'manual tracking', 'manually entering', 'copying by hand'
  ],
  UNKNOWN: [
    'workaround', 'work around', 'hack', 'shortcut', 'kludge',
    'jury-rigged', 'makeshift', 'temporary fix', 'band-aid'
  ]
};

// ==========================================
// PATTERN DEFINITIONS — BURDEN
// ==========================================

const BURDEN_ABSORBER_PATTERNS: Record<BurdenAbsorber, string[]> = {
  SITE: ['site staff', 'coordinators', 'site team', 'site is doing', 'site bears', 'site carries'],
  PATIENT: ['patient burden', 'patient has to', 'patients are struggling', 'patient suffering', 'patient承受', 'patient inconvenience'],
  OPERATOR: ['i have to', 'we have to', 'my job', 'i end up', 'i\'m the one', 'falls on me', 'i carry', 'on my shoulders'],
  SPONSOR: ['sponsor absorbs', 'sponsor pays', 'sponsor cost', 'sponsor burden'],
  CRO: ['cro absorbs', 'cro bears', 'cro carries', 'cro burden'],
  UNKNOWN: []
};

const BURDEN_TYPE_PATTERNS: Record<BurdenType, string[]> = {
  TIME: ['hours', 'time-consuming', 'takes forever', 'wastes time', 'wasting hours', 'long hours', 'extra time', 'overtime', 'staying late'],
  COMPLEXITY: ['complex', 'complicated', 'confusing', 'convoluted', 'byzantine', 'overcomplicated', 'too many steps', 'layered'],
  EMOTIONAL: ['stressful', 'anxiety', 'stress', 'mental load', 'emotional toll', 'psychological', 'draining', 'demoralizing'],
  FINANCIAL: ['cost', 'expensive', 'budget', 'money', 'paying out of pocket', 'unfunded', 'not reimbursed', 'financial burden'],
  OPERATIONAL: ['operational burden', 'overhead', 'administrative', 'red tape', 'bureaucracy', 'paperwork'],
  UNKNOWN: []
};

// ==========================================
// PATTERN DEFINITIONS — INVISIBLE WORK
// ==========================================

const INVISIBLE_WORK_PATTERNS: Record<InvisibleWorkType, string[]> = {
  COORDINATION: ['coordinating', 'chasing people', 'following up', 'reminding', 'herding cats', 'aligning', 'scheduling'],
  COMMUNICATION: ['translating', 'explaining', 'clarifying', 'bridging', 'mediating', 'interpreting', 'facilitating'],
  DOCUMENTATION: ['documenting', 'writing up', 'recording', 'keeping track', 'logging', 'reporting', 'notes'],
  TRAINING: ['training', 'onboarding', 'showing new people', 'teaching', 'explaining to new', 'knowledge transfer'],
  TROUBLESHOOTING: ['troubleshooting', 'debugging', 'figuring out', 'investigating', 'diagnosing', 'uncovering', 'digging into'],
  ADVOCACY: ['advocating', 'fighting for', 'pushing back', 'defending', 'standing up for', 'championing', 'making the case'],
  UNKNOWN: []
};

// ==========================================
// PATTERN DEFINITIONS — DRIFT INDICATORS
// ==========================================

const DRIFT_INDICATOR_PATTERNS: Record<string, string[]> = {
  'process_drift': ['slowly changed', 'gradually shifted', 'evolved away from', 'no longer follows', 'drifted from'],
  'scope_drift': ['scope creep', 'growing beyond', 'expanded past', 'bigger than planned', 'keeps expanding'],
  'standard_drift': ['not standard anymore', 'deviated from standard', 'moved away from sop', 'no longer by the book'],
  'expectation_drift': ['expectations changed', 'moving target', 'keeps shifting', 'goalposts moved'],
  'quality_drift': ['quality declining', 'standards dropping', 'getting sloppy', 'cutting corners more'],
  'timeline_drift': ['behind schedule', 'timeline slipping', 'delays piling up', 'keeps getting pushed'],
  'staffing_drift': ['people leaving', 'turnover', 'short-staffed', 'losing people', 'skeleton crew']
};

// ==========================================
// EXTRACTION FUNCTIONS
// ==========================================

/**
 * Detect suppressed signal type from text
 * What is NOT being said or acted on
 */
function extractSuppressedSignal(text: string): SuppressedSignalType {
  const lower = text.toLowerCase();
  let bestMatch: SuppressedSignalType = 'UNKNOWN';
  let bestScore = 0;

  for (const [type, patterns] of Object.entries(SUPPRESSED_SIGNAL_PATTERNS)) {
    if (type === 'UNKNOWN') continue;
    let score = 0;
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        score += pattern.split(' ').length; // Weight multi-word matches higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type as SuppressedSignalType;
    }
  }

  return bestMatch;
}

/**
 * Detect emotional signal type from text
 * Translate emotional language, don't remove it
 */
function extractEmotionalSignal(text: string): EmotionalSignalType {
  const lower = text.toLowerCase();
  let bestMatch: EmotionalSignalType = 'UNKNOWN';
  let bestScore = 0;

  for (const [type, patterns] of Object.entries(EMOTIONAL_SIGNAL_PATTERNS)) {
    if (type === 'UNKNOWN') continue;
    let score = 0;
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        score += pattern.split(' ').length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type as EmotionalSignalType;
    }
  }

  return bestMatch;
}

/**
 * Detect workaround presence and type
 */
function extractWorkaround(text: string): { present: boolean; type: WorkaroundType | null } {
  const lower = text.toLowerCase();
  let bestType: WorkaroundType | null = null;
  let bestScore = 0;

  for (const [type, patterns] of Object.entries(WORKAROUND_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        score += pattern.split(' ').length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type as WorkaroundType;
    }
  }

  return {
    present: bestScore > 0,
    type: bestType
  };
}

/**
 * Detect system-of-record mismatch
 * When what's officially tracked ≠ what's actually happening
 */
function extractSystemMismatch(text: string): { mismatch: boolean; gap: number } {
  const lower = text.toLowerCase();
  
  const MISMATCH_PATTERNS = [
    'officially it says', 'on paper it says', 'in the system it shows',
    'but actually', 'but in reality', 'but really', 'in practice though',
    'the system says', 'the record shows', 'officially reported',
    'not reflected in', 'doesn\'t show up in', 'not captured',
    'off the books', 'shadow', 'unofficial', 'different from what\'s recorded',
    'not in the edc', 'not documented', 'not tracked'
  ];
  
  let matchCount = 0;
  for (const pattern of MISMATCH_PATTERNS) {
    if (lower.includes(pattern)) matchCount++;
  }
  
  return {
    mismatch: matchCount > 0,
    gap: Math.min(1, matchCount * 0.3)
  };
}

/**
 * Calculate decision distance level
 * How far the operator is from the decision-maker
 */
function extractDecisionDistance(text: string): DecisionDistanceLevel {
  const lower = text.toLowerCase();
  
  const CRITICAL_PATTERNS = [
    'no one will decide', 'no decision maker', 'stuck in limbo',
    'nobody has authority', 'waiting for months', 'chain of command broken'
  ];
  const HIGH_PATTERNS = [
    'far from decision', 'removed from', 'not at the table',
    'no seat at the table', 'above my pay grade', 'decisions made elsewhere',
    'not consulted', 'out of the loop', 'decisions come from'
  ];
  const MEDIUM_PATTERNS = [
    'suggested but', 'recommended but', 'input not taken',
    'asked but', 'feedback ignored', 'not listened to'
  ];
  const LOW_PATTERNS = [
    'i decided', 'we decided', 'made the call',
    'my decision', 'i can approve', 'authorized'
  ];
  
  for (const p of CRITICAL_PATTERNS) if (lower.includes(p)) return 'CRITICAL';
  for (const p of HIGH_PATTERNS) if (lower.includes(p)) return 'HIGH';
  for (const p of MEDIUM_PATTERNS) if (lower.includes(p)) return 'MEDIUM';
  for (const p of LOW_PATTERNS) if (lower.includes(p)) return 'LOW';
  
  // Default for clinical trial operators - they're usually medium-high distance
  return 'MEDIUM';
}

/**
 * Detect who absorbs the burden
 */
function extractBurdenAbsorber(text: string): BurdenAbsorber {
  const lower = text.toLowerCase();
  let bestMatch: BurdenAbsorber = 'UNKNOWN';
  let bestScore = 0;

  for (const [type, patterns] of Object.entries(BURDEN_ABSORBER_PATTERNS)) {
    if (type === 'UNKNOWN') continue;
    let score = 0;
    for (const pattern of patterns) {
      if (lower.includes(pattern)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type as BurdenAbsorber;
    }
  }

  // Default for clinical trial operators submitting situations
  if (bestMatch === 'UNKNOWN') bestMatch = 'OPERATOR';
  return bestMatch;
}

/**
 * Detect what type of burden
 */
function extractBurdenType(text: string): BurdenType {
  const lower = text.toLowerCase();
  let bestMatch: BurdenType = 'UNKNOWN';
  let bestScore = 0;

  for (const [type, patterns] of Object.entries(BURDEN_TYPE_PATTERNS)) {
    if (type === 'UNKNOWN') continue;
    let score = 0;
    for (const pattern of patterns) {
      if (lower.includes(pattern)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type as BurdenType;
    }
  }

  // Default for clinical trials
  if (bestMatch === 'UNKNOWN') bestMatch = 'OPERATIONAL';
  return bestMatch;
}

/**
 * Detect invisible work type
 * Work that happens but isn't tracked, compensated, or acknowledged
 */
function extractInvisibleWork(text: string): InvisibleWorkType {
  const lower = text.toLowerCase();
  let bestMatch: InvisibleWorkType = 'UNKNOWN';
  let bestScore = 0;

  for (const [type, patterns] of Object.entries(INVISIBLE_WORK_PATTERNS)) {
    if (type === 'UNKNOWN') continue;
    let score = 0;
    for (const pattern of patterns) {
      if (lower.includes(pattern)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type as InvisibleWorkType;
    }
  }

  if (bestMatch === 'UNKNOWN') bestMatch = 'COORDINATION';
  return bestMatch;
}

/**
 * Detect downstream risk level
 */
function extractDownstreamRisk(
  text: string,
  workaroundPresent: boolean,
  mismatchDetected: boolean,
  suppressedType: SuppressedSignalType
): RiskLevel {
  const lower = text.toLowerCase();
  
  const CRITICAL_RISK = [
    'patient safety', 'sae', 'death', 'hospitalization',
    'protocol violation', 'deviation', 'fraud', 'misconduct'
  ];
  const HIGH_RISK = [
    'dropout', 'lost to follow', 'enrollment impact',
    'data integrity', 'regulatory finding', 'audit finding',
    'warning letter', 'clinical hold'
  ];
  const MEDIUM_RISK = [
    'delay', 'timeline impact', 'budget overrun',
    'staff turnover', 'site closure', 're-enrollment'
  ];
  
  // Base risk from patterns
  for (const p of CRITICAL_RISK) if (lower.includes(p)) return 'CRITICAL';
  for (const p of HIGH_RISK) if (lower.includes(p)) return 'HIGH';
  for (const p of MEDIUM_RISK) if (lower.includes(p)) return 'MEDIUM';
  
  // Elevated risk from compound signals
  if (workaroundPresent && mismatchDetected && suppressedType !== 'UNKNOWN') return 'HIGH';
  if (workaroundPresent && suppressedType !== 'UNKNOWN') return 'MEDIUM';
  if (mismatchDetected && suppressedType !== 'UNKNOWN') return 'MEDIUM';
  if (workaroundPresent || mismatchDetected) return 'LOW';
  
  return 'NONE';
}

/**
 * Detect escalation pattern
 */
function extractEscalationPattern(text: string): EscalationPattern {
  const lower = text.toLowerCase();
  
  if (lower.includes('global') || lower.includes('across all sites') || lower.includes('every site')) return 'GLOBAL';
  if (lower.includes('multiple sites') || lower.includes('other sites') || lower.includes('region')) return 'REGIONAL';
  if (lower.includes('my site') || lower.includes('our site') || lower.includes('locally')) return 'LOCAL';
  if (lower.includes('getting worse') || lower.includes('escalating') || lower.includes('spreading')) return 'ESCALATING';
  
  return 'NONE';
}

/**
 * Detect patient impact potential
 */
function extractPatientImpact(text: string, workaroundPresent: boolean): RiskLevel {
  const lower = text.toLowerCase();
  
  const CRITICAL = ['patient harm', 'patient safety', 'death', 'hospitalization', 'adverse event'];
  const HIGH = ['patient burden', 'patient struggling', 'dropout', 'withdrawal', 'non-compliance'];
  const MEDIUM = ['patient inconvenience', 'extra visits', 'patient discomfort', 'longer visits'];
  const LOW = ['patient aware', 'patient notification'];
  
  for (const p of CRITICAL) if (lower.includes(p)) return 'CRITICAL';
  for (const p of HIGH) if (lower.includes(p)) return 'HIGH';
  for (const p of MEDIUM) if (lower.includes(p)) return 'MEDIUM';
  for (const p of LOW) if (lower.includes(p)) return 'LOW';
  
  if (workaroundPresent) return 'LOW';
  return 'NONE';
}

/**
 * Calculate operational debt level (0-1)
 * Accumulated unaddressed issues creating compounding risk
 */
function calculateOperationalDebt(
  text: string,
  workaroundPresent: boolean,
  mismatchDetected: boolean,
  suppressedType: SuppressedSignalType
): number {
  const lower = text.toLowerCase();
  let debt = 0;
  
  // Workaround presence adds debt
  if (workaroundPresent) debt += 0.25;
  
  // Mismatch adds debt
  if (mismatchDetected) debt += 0.2;
  
  // Suppressed signals add debt
  if (suppressedType !== 'UNKNOWN') debt += 0.2;
  
  // Duration indicators add debt
  const CHRONIC_PATTERNS = ['for months', 'for years', 'always been', 'never been addressed', 'keeps happening', 'ongoing'];
  for (const p of CHRONIC_PATTERNS) {
    if (lower.includes(p)) debt += 0.15;
  }
  
  // Increasing frequency
  const INCREASING_PATTERNS = ['getting worse', 'more frequent', 'increasing', 'escalating', 'spreading'];
  for (const p of INCREASING_PATTERNS) {
    if (lower.includes(p)) debt += 0.1;
  }
  
  return Math.min(1, debt);
}

/**
 * Calculate economic value potential (0-1)
 */
function calculateEconomicValue(
  downstreamRisk: RiskLevel,
  decisionDistance: DecisionDistanceLevel,
  workaroundPresent: boolean,
  mismatchDetected: boolean
): number {
  let value = 0;
  
  // Higher risk = higher value if addressed
  const riskValues: Record<RiskLevel, number> = {
    'CRITICAL': 0.4, 'HIGH': 0.35, 'MEDIUM': 0.2, 'LOW': 0.1, 'NONE': 0
  };
  value += riskValues[downstreamRisk];
  
  // Higher decision distance = higher value (bridging the gap)
  const distanceValues: Record<DecisionDistanceLevel, number> = {
    'CRITICAL': 0.3, 'HIGH': 0.25, 'MEDIUM': 0.15, 'LOW': 0.05
  };
  value += distanceValues[decisionDistance];
  
  // Workarounds represent efficiency opportunity
  if (workaroundPresent) value += 0.15;
  
  // Mismatches represent data quality opportunity
  if (mismatchDetected) value += 0.1;
  
  return Math.min(1, value);
}

/**
 * Detect drift indicators
 */
function extractDriftIndicators(text: string): string[] {
  const lower = text.toLowerCase();
  const indicators: string[] = [];
  
  for (const [type, patterns] of Object.entries(DRIFT_INDICATOR_PATTERNS)) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        indicators.push(type);
        break;
      }
    }
  }
  
  return indicators;
}

/**
 * Predict failure trajectory
 * Based on compound signals: workaround + mismatch + suppressed + drift
 */
function predictFailureTrajectory(
  workaroundPresent: boolean,
  mismatchDetected: boolean,
  suppressedType: SuppressedSignalType,
  driftIndicators: string[],
  downstreamRisk: RiskLevel,
  operationalDebt: number
): FailureTrajectory {
  let riskScore = 0;
  
  if (workaroundPresent) riskScore += 1;
  if (mismatchDetected) riskScore += 1;
  if (suppressedType !== 'UNKNOWN') riskScore += 1.5;
  if (driftIndicators.length > 0) riskScore += driftIndicators.length * 0.5;
  if (downstreamRisk === 'CRITICAL' || downstreamRisk === 'HIGH') riskScore += 1;
  if (operationalDebt > 0.6) riskScore += 1;
  
  if (riskScore >= 4) return 'HIGH_RISK_ESCALATION';
  if (riskScore >= 2) return 'LIKELY_ESCALATION';
  return 'NONE';
}

// ==========================================
// SIGNAL QUALITY FIREWALL
// ==========================================

/**
 * Calculate Signal Quality Score (SQS)
 * User NEVER sees this score
 * 
 * Based on:
 * - Specificity: Does the text use specific clinical/trial language?
 * - Real constraint presence: Does it describe a real, actionable constraint?
 * - Consequence presence: Does it describe actual or potential outcomes?
 * - Realism of language: Does the language suggest real experience vs. hypothetical?
 */
export function calculateSignalQualityScore(
  text: string,
  structuringResult: StructuringResult
): SignalQualityScore {
  const lower = text.toLowerCase();
  let score = 0;
  
  // 1. Specificity (0-30 points)
  const SPECIFIC_TERMS = [
    'protocol', 'amendment', 'enrollment', 'screening', 'randomization',
    'edc', 'query', 'deviation', 'sae', 'irb', 'gcp', 'icf',
    'cra', 'crc', 'pi', 'monitoring visit', 'site initiation',
    'close-out', 'source data verification', 'sdv', 'ctms',
    'ivrs', 'irt', 'epro', 'ecoa', 'imaging', 'central lab'
  ];
  const specificityCount = SPECIFIC_TERMS.filter(t => lower.includes(t)).length;
  score += Math.min(30, specificityCount * 5);
  
  // 2. Real constraint presence (0-25 points)
  const CONSTRAINT_PATTERNS = [
    'can\'t', 'unable to', 'not allowed', 'no budget', 'no staff',
    'no time', 'doesn\'t support', 'not designed for', 'limited to',
    'required to', 'must follow', 'have to', 'no option', 'constraint',
    'blocking', 'prevented', 'restricted', 'no capacity'
  ];
  const constraintCount = CONSTRAINT_PATTERNS.filter(p => lower.includes(p)).length;
  score += Math.min(25, constraintCount * 8);
  
  // 3. Consequence presence (0-25 points)
  const CONSEQUENCE_PATTERNS = [
    'resulted in', 'caused', 'led to', 'impact', 'affecting',
    'delay', 'dropout', 'deviation', 'violation', 'overrun',
    'turnover', 'closure', 'finding', 'warning', 'risk',
    'patient impact', 'data quality', 'lost', 'missed'
  ];
  const consequenceCount = CONSEQUENCE_PATTERNS.filter(p => lower.includes(p)).length;
  score += Math.min(25, consequenceCount * 6);
  
  // 4. Realism of language (0-20 points)
  const REALISM_PATTERNS = [
    'in my trial', 'at my site', 'our patients', 'our protocol',
    'last week', 'yesterday', 'currently', 'ongoing',
    'i see', 'we experience', 'happening now', 'this quarter',
    'current study', 'my study', 'this protocol'
  ];
  const realismCount = REALISM_PATTERNS.filter(p => lower.includes(p)).length;
  score += Math.min(20, realismCount * 7);
  
  // Bonus: AI structuring found specific issue type (not "Other")
  if (structuringResult.structured.issueType !== 'Other') score += 5;
  
  // Bonus: Longer text with more context
  if (text.length > 200) score += 5;
  if (text.length > 400) score += 5;
  
  // Classification
  if (score >= 65) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
}

// ==========================================
// PREDICTIVE SUMMARY GENERATOR
// ==========================================

function generatePredictiveSummary(
  suppressedType: SuppressedSignalType,
  emotionalType: EmotionalSignalType,
  workaroundPresent: boolean,
  mismatchDetected: boolean,
  downstreamRisk: RiskLevel,
  failureTrajectory: FailureTrajectory,
  driftIndicators: string[]
): string {
  const parts: string[] = [];
  
  // Core assessment
  if (suppressedType !== 'UNKNOWN') {
    const suppressedDescriptions: Record<string, string> = {
      'NOT_ESCALATED': 'Issue is known but not being escalated through official channels',
      'ESCALATED_IGNORED': 'Issue was escalated but received no response or action',
      'NORMALIZED_WORKAROUND': 'Non-standard practices have become normalized',
      'FEAR_OF_PUSHBACK': 'Operator fears consequences of speaking up',
      'SPONSOR_PRESSURE': 'External sponsor pressure is suppressing proper process',
      'CRO_PRESSURE': 'CRO pressure is creating process shortcuts',
      'SITE_SILENCE': 'Site is not reporting issues through proper channels',
    };
    parts.push(suppressedDescriptions[suppressedType] || 'Suppressed signal detected');
  }
  
  if (workaroundPresent) {
    parts.push('Active workaround in place indicating process gap');
  }
  
  if (mismatchDetected) {
    parts.push('Discrepancy between official records and actual practice');
  }
  
  if (driftIndicators.length > 0) {
    parts.push(`${driftIndicators.length} drift indicator(s) detected (${driftIndicators.join(', ')})`);
  }
  
  // Trajectory assessment
  if (failureTrajectory === 'HIGH_RISK_ESCALATION') {
    parts.push('HIGH RISK: Multiple compound signals suggest likely failure escalation');
  } else if (failureTrajectory === 'LIKELY_ESCALATION') {
    parts.push('Compound signals suggest this may escalate if unaddressed');
  }
  
  // Emotional overlay
  if (emotionalType === 'OVERLOAD' || emotionalType === 'RESIGNATION') {
    parts.push('Operator shows signs of significant strain — burnout risk present');
  } else if (emotionalType === 'SILENCED' || emotionalType === 'ESCALATION_FEAR') {
    parts.push('Operator appears constrained from speaking up — environment risk');
  }
  
  if (parts.length === 0) {
    return 'Signal captured. Insufficient compound indicators for trajectory prediction at this time.';
  }
  
  return parts.join('. ') + '.';
}

// ==========================================
// MAIN EXPORT — TRANSLATE
// ==========================================

/**
 * Translate raw operator text into structured Execution Signal
 * 
 * This is the core function. Raw text goes in, structured intelligence comes out.
 * The operator does NO extra work. The system does ALL the translation.
 */
export function translateSubmission(text: string): ExecutionSignal {
  // First, run the existing AI structuring
  const structuringResult = structureSubmission(text);
  
  // Extract all translation layers
  const suppressedSignalType = extractSuppressedSignal(text);
  const emotionalSignalType = extractEmotionalSignal(text);
  const workaround = extractWorkaround(text);
  const mismatch = extractSystemMismatch(text);
  const decisionDistanceLevel = extractDecisionDistance(text);
  const burdenAbsorber = extractBurdenAbsorber(text);
  const burdenType = extractBurdenType(text);
  const invisibleWorkType = extractInvisibleWork(text);
  const driftIndicators = extractDriftIndicators(text);
  const escalationPattern = extractEscalationPattern(text);
  const patientImpactPotential = extractPatientImpact(text, workaround.present);
  
  // Calculate compound signals
  const likelyDownstreamRisk = extractDownstreamRisk(
    text, workaround.present, mismatch.mismatch, suppressedSignalType
  );
  const operationalDebtLevel = calculateOperationalDebt(
    text, workaround.present, mismatch.mismatch, suppressedSignalType
  );
  const failureTrajectoryPrediction = predictFailureTrajectory(
    workaround.present, mismatch.mismatch, suppressedSignalType,
    driftIndicators, likelyDownstreamRisk, operationalDebtLevel
  );
  const economicValuePotential = calculateEconomicValue(
    likelyDownstreamRisk, decisionDistanceLevel, workaround.present, mismatch.mismatch
  );
  
  // Signal quality (user NEVER sees this)
  const signalQualityScore = calculateSignalQualityScore(text, structuringResult);
  
  // Micro-opportunity gating: only HIGH SQS AND significant value
  const microOpportunityEligible = 
    signalQualityScore === 'HIGH' && 
    (economicValuePotential > 0.5 || decisionDistanceLevel === 'HIGH' || decisionDistanceLevel === 'CRITICAL' || likelyDownstreamRisk === 'HIGH' || likelyDownstreamRisk === 'CRITICAL');
  
  // Predictive summary
  const predictiveSummary = generatePredictiveSummary(
    suppressedSignalType, emotionalSignalType, workaround.present,
    mismatch.mismatch, likelyDownstreamRisk, failureTrajectoryPrediction,
    driftIndicators
  );
  
  // Confidence score
  let confidenceScore = 0.3; // Base
  if (suppressedSignalType !== 'UNKNOWN') confidenceScore += 0.15;
  if (emotionalSignalType !== 'UNKNOWN') confidenceScore += 0.1;
  if (workaround.present) confidenceScore += 0.1;
  if (mismatch.mismatch) confidenceScore += 0.1;
  if (structuringResult.structured.issueType !== 'Other') confidenceScore += 0.1;
  if (driftIndicators.length > 0) confidenceScore += 0.05;
  confidenceScore = Math.min(0.95, confidenceScore);
  
  return {
    suppressedSignalType,
    emotionalSignalType,
    workaroundPresent: workaround.present,
    workaroundType: workaround.type,
    systemOfRecordMismatch: mismatch.mismatch,
    officialRealityGap: mismatch.gap,
    decisionDistanceLevel,
    burdenAbsorber,
    burdenType,
    invisibleWorkType,
    likelyDownstreamRisk,
    escalationPattern,
    patientImpactPotential,
    operationalDebtLevel,
    economicValuePotential,
    microOpportunityEligible,
    driftIndicators,
    failureTrajectoryPrediction,
    signalQualityScore,
    predictiveSummary,
    confidenceScore
  };
}

/**
 * Get the structuring result alongside the translation
 * Convenience function for API routes
 */
export function translateAndStructure(text: string): {
  signal: ExecutionSignal;
  structured: StructuringResult;
} {
  const structured = structureSubmission(text);
  const signal = translateSubmission(text);
  return { signal, structured };
}

export default {
  translateSubmission,
  translateAndStructure,
  calculateSignalQualityScore
};