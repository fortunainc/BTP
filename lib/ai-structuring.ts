/**
 * AI STRUCTURING LAYER
 * 
 * Automatically extracts structured data from free-text submissions:
 * - Issue Type
 * - System Involved
 * - Severity (low/medium/high)
 * - Repeatability (isolated/recurring)
 * - Suggested Tags
 * 
 * Uses pattern matching and keyword analysis for deterministic extraction.
 * Can be upgraded to use LLM for more sophisticated extraction.
 */

// ==========================================
// TYPES
// ==========================================

export interface StructuredOutput {
  issueType: string;
  systemInvolved: string;
  severity: 'low' | 'medium' | 'high';
  repeatability: 'isolated' | 'recurring';
  suggestedTags: string[];
  confidence: number;
}

export interface StructuringResult {
  raw: string;
  structured: StructuredOutput;
  therapeuticArea?: string;
  trialPhase?: string;
}

// ==========================================
// PATTERN DEFINITIONS
// ==========================================

const ISSUE_TYPE_PATTERNS: Record<string, string[]> = {
  'Enrollment': [
    'enrollment', 'recruitment', 'screening', 'eligible', 'inclusion', 'exclusion',
    'patient accrual', 'recruiting', 'under-enrolled', 'enrollment lag'
  ],
  'Protocol Burden': [
    'protocol', 'amendment', 'visit schedule', 'assessment', 'burden', 'complex',
    'procedure', 'schedule', 'frequency', 'time-consuming', 'overwhelming'
  ],
  'Data Integrity': [
    'data', 'edc', 'query', 'discrepancy', 'accuracy', 'entry', 'validation',
    'source data', 'data quality', 'missing data', 'audit'
  ],
  'Operational': [
    'operational', 'workflow', 'process', 'efficiency', 'capacity', 'resource',
    'timeline', 'delay', 'bottleneck', 'coordination'
  ],
  'Regulatory': [
    'regulatory', 'fda', 'submission', 'approval', 'compliance', 'irb', 'ethics',
    'safety reporting', 'ae', 'sae', 'reporting'
  ],
  'Staffing': [
    'staff', 'coordinator', 'crc', 'cra', 'turnover', 'training', 'shortage',
    'overworked', 'capacity', 'hiring', 'retention'
  ],
  'Sponsor Expectations': [
    'sponsor', 'cro', 'expectation', 'deadline', 'pressure', 'demand',
    'oversight', 'monitoring', 'communication gap'
  ],
  'Site Overload': [
    'overload', 'overwhelmed', 'multiple studies', 'underwater', 'capacity',
    'too many', 'burnout', 'stretched'
  ],
  'Patient Retention': [
    'retention', 'dropout', 'withdrawal', 'adherence', 'compliance', 'lost to follow',
    'patient burden', 'attrition'
  ],
  'Budget/Reimbursement': [
    'budget', 'reimbursement', 'payment', 'funding', 'cost', 'financial',
    'delayed payment', 'underfunded'
  ]
};

const SYSTEM_PATTERNS: Record<string, string[]> = {
  'EDC': ['edc', 'electronic data capture', 'medidata', 'oracle', 'rave'],
  'IRT/IVRS': ['irt', 'ivrs', 'ixrs', 'randomization', 'drug supply', 'kit'],
  'CTMS': ['ctms', 'clinical trial management', 'tracking system'],
  'ePRO': ['epro', 'electronic patient reported', 'patient diary', 'ecoa'],
  'Site Operations': ['site operations', 'site workflow', 'clinic operations'],
  'Sponsor/CRO': ['sponsor', 'cro', 'vendor', ' oversight'],
  'Regulatory': ['regulatory', 'irb', 'ethics committee', 'fda'],
  'Lab/Central': ['central lab', 'local lab', 'laboratory', 'specimen'],
  'Imaging': ['imaging', 'radiology', 'scan', 'ct', 'mri', 'pet']
};

const SEVERITY_INDICATORS = {
  high: [
    'critical', 'urgent', 'emergency', 'immediate', 'serious', 'severe',
    'patient safety', 'sae', 'death', 'hospitalization', 'life-threatening',
    'terminated', 'shut down', 'suspended', 'legal', 'lawsuit'
  ],
  medium: [
    'moderate', 'significant', 'concerning', 'impacting', 'delaying',
    'affecting', 'problematic', 'challenging', 'difficult', 'struggling'
  ],
  low: [
    'minor', 'small', 'occasional', 'slight', 'inconvenience', 'nuisance',
    'manageable', 'workaround', 'observation', 'suggestion'
  ]
};

const RECURRING_INDICATORS = {
  recurring: [
    'keeps', 'keeps happening', 'repeated', 'recurring', 'ongoing', 'chronic',
    'always', 'every time', 'pattern', 'trend', 'increasing', 'multiple',
    'frequent', 'constant', 'regular', 'persistent'
  ],
  isolated: [
    'once', 'single', 'one-time', 'isolated', 'rare', 'first time',
    'occasional', 'unusual', 'unexpected', 'sudden', 'incident'
  ]
};

const THERAPEUTIC_AREA_PATTERNS: Record<string, string[]> = {
  'Oncology': ['oncology', 'cancer', 'tumor', 'chemotherapy', 'immunotherapy', 'car-t', 'solid tumor', 'hematology'],
  'Cardiology': ['cardiology', 'cardiac', 'heart', 'cardiovascular', 'arrhythmia', 'heart failure'],
  'Neurology': ['neurology', 'neurological', 'brain', 'alzheimer', 'parkinson', 'dementia', 'ms', 'multiple sclerosis'],
  'Immunology': ['immunology', 'immune', 'autoimmune', 'biologic', 'antibody'],
  'Rare Disease': ['rare disease', 'orphan', 'rare condition', 'genetic disorder'],
  'Pediatrics': ['pediatric', 'pediatric', 'child', 'children', 'adolescent'],
  'Infectious Disease': ['infectious', 'infection', 'antiviral', 'antibiotic', 'hiv', 'hepatitis', 'covid'],
  'Metabolism': ['metabolism', 'metabolic', 'diabetes', 'obesity', 'endocrine'],
  'Respiratory': ['respiratory', 'lung', 'pulmonary', 'asthma', 'copd', 'cf'],
  'Dermatology': ['dermatology', 'skin', 'psoriasis', 'eczema', 'atopic']
};

const TRIAL_PHASE_PATTERNS: Record<string, string[]> = {
  'Phase I': ['phase i', 'phase 1', 'first-in-human', 'fih', 'safety study'],
  'Phase II': ['phase ii', 'phase 2', 'proof of concept', 'poc', 'dose finding'],
  'Phase III': ['phase iii', 'phase 3', 'pivotal', 'confirmatory', 'registration'],
  'Phase IV': ['phase iv', 'phase 4', 'post-marketing', 'observational'],
  'Multi-phase': ['multi-phase', 'adaptive', 'seamless']
};

// ==========================================
// EXTRACTION FUNCTIONS
// ==========================================

/**
 * Extract issue type from text
 */
function extractIssueType(text: string): string {
  const lowerText = text.toLowerCase();
  
  for (const [issueType, patterns] of Object.entries(ISSUE_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return issueType;
      }
    }
  }
  
  return 'Other';
}

/**
 * Extract system involved from text
 */
function extractSystem(text: string): string {
  const lowerText = text.toLowerCase();
  
  for (const [system, patterns] of Object.entries(SYSTEM_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return system;
      }
    }
  }
  
  return 'General Operations';
}

/**
 * Extract severity from text
 */
function extractSeverity(text: string): 'low' | 'medium' | 'high' {
  const lowerText = text.toLowerCase();
  
  // Check high severity indicators first
  for (const indicator of SEVERITY_INDICATORS.high) {
    if (lowerText.includes(indicator)) {
      return 'high';
    }
  }
  
  // Then medium
  for (const indicator of SEVERITY_INDICATORS.medium) {
    if (lowerText.includes(indicator)) {
      return 'medium';
    }
  }
  
  // Then low
  for (const indicator of SEVERITY_INDICATORS.low) {
    if (lowerText.includes(indicator)) {
      return 'low';
    }
  }
  
  // Default to medium for clinical trials (most issues are significant)
  return 'medium';
}

/**
 * Extract repeatability from text
 */
function extractRepeatability(text: string): 'isolated' | 'recurring' {
  const lowerText = text.toLowerCase();
  
  let recurringScore = 0;
  let isolatedScore = 0;
  
  for (const indicator of RECURRING_INDICATORS.recurring) {
    if (lowerText.includes(indicator)) {
      recurringScore++;
    }
  }
  
  for (const indicator of RECURRING_INDICATORS.isolated) {
    if (lowerText.includes(indicator)) {
      isolatedScore++;
    }
  }
  
  return recurringScore >= isolatedScore ? 'recurring' : 'isolated';
}

/**
 * Extract therapeutic area from text
 */
function extractTherapeuticArea(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  for (const [area, patterns] of Object.entries(THERAPEUTIC_AREA_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return area;
      }
    }
  }
  
  return undefined;
}

/**
 * Extract trial phase from text
 */
function extractTrialPhase(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  for (const [phase, patterns] of Object.entries(TRIAL_PHASE_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return phase;
      }
    }
  }
  
  return undefined;
}

/**
 * Generate suggested tags from text
 */
function generateTags(text: string, issueType: string, system: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Add issue type as a tag
  if (issueType !== 'Other') {
    tags.push(issueType.toLowerCase().replace(/\s+/g, '-'));
  }
  
  // Add system as a tag
  if (system !== 'General Operations') {
    tags.push(system.toLowerCase().replace(/\s+/g, '-'));
  }
  
  // Check for additional tag patterns
  const additionalTags: Record<string, string[]> = {
    'site-issues': ['site', 'site staff', 'coordinator', 'investigator'],
    'patient-facing': ['patient', 'subject', 'participant'],
    'timeline-pressure': ['deadline', 'timeline', 'milestone', 'timeline'],
    'quality-issues': ['quality', 'error', 'mistake', 'deviation'],
    'communication-gap': ['communication', 'disconnect', 'miscommunication'],
    'training-needed': ['training', 'knowledge gap', 'unclear']
  };
  
  for (const [tag, patterns] of Object.entries(additionalTags)) {
    if (patterns.some(p => lowerText.includes(p))) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }
  
  // Limit to 5 tags
  return tags.slice(0, 5);
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  text: string,
  issueType: string,
  system: string
): number {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence for longer text (more context)
  if (text.length > 100) confidence += 0.1;
  if (text.length > 200) confidence += 0.1;
  
  // Increase confidence if we found an issue type
  if (issueType !== 'Other') confidence += 0.15;
  
  // Increase confidence if we found a system
  if (system !== 'General Operations') confidence += 0.1;
  
  // Cap at 0.95
  return Math.min(confidence, 0.95);
}

// ==========================================
// MAIN EXPORT
// ==========================================

/**
 * Structure a free-text submission into structured data
 */
export function structureSubmission(text: string): StructuringResult {
  const issueType = extractIssueType(text);
  const system = extractSystem(text);
  const severity = extractSeverity(text);
  const repeatability = extractRepeatability(text);
  const therapeuticArea = extractTherapeuticArea(text);
  const trialPhase = extractTrialPhase(text);
  const suggestedTags = generateTags(text, issueType, system);
  const confidence = calculateConfidence(text, issueType, system);
  
  return {
    raw: text,
    structured: {
      issueType,
      systemInvolved: system,
      severity,
      repeatability,
      suggestedTags,
      confidence
    },
    therapeuticArea,
    trialPhase
  };
}

/**
 * Find similar signals in the database
 */
export async function findSimilarSignals(
  text: string,
  issueType: string,
  therapeuticArea?: string
): Promise<{ id: string; title: string; similarity: number }[]> {
  // This would normally query the database
  // For now, we return a placeholder that will be populated by the API
  return [];
}

export default {
  structureSubmission,
  findSimilarSignals
};