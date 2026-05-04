/**
 * Execution Context Intelligence Engine
 * 
 * This module transforms BTP from simple profile matching to
 * execution-context intelligence matching.
 * 
 * Core Concept:
 * - Match based on HOW problems were solved, not just WHAT areas someone worked in
 * - Extract execution patterns from contributions
 * - Map job requirements to execution contexts
 */

// ==========================================
// CORE TYPES
// ==========================================

export type TrialEnvironmentType = 'academic' | 'community' | 'hybrid' | 'site_network';

export type OperationalPressureType = 
  | 'enrollment_pressure'
  | 'staffing_strain'
  | 'regulatory_friction'
  | 'data_backlog'
  | 'timeline_pressure'
  | 'budget_constraint'
  | 'quality_issues'
  | 'vendor_coordination'
  | 'patient_retention'
  | 'protocol_complexity';

export type WorkflowBreakpoint = 
  | 'screening_failure'
  | 'enrollment_stall'
  | 'data_discrepancy'
  | 'protocol_deviation'
  | 'regulatory_delay'
  | 'vendor_handoff'
  | 'safety_reporting'
  | 'query_resolution'
  | 'consent_issues'
  | 'retention_drop';

export type InterventionType = 
  | 'process_redesign'
  | 'resource_reallocation'
  | 'stakeholder_negotiation'
  | 'technology_solution'
  | 'training_intervention'
  | 'protocol_amendment'
  | 'vendor_management'
  | 'patient_engagement'
  | 'data_correction'
  | 'escalation';

export type OutcomeType = 'resolved' | 'mitigated' | 'failed' | 'escalated' | 'prevented';

// ==========================================
// EXECUTION CONTEXT INTERFACES
// ==========================================

export interface ExecutionContext {
  // Environment Context
  trialEnvironmentType: TrialEnvironmentType;
  operationalPressureTypes: OperationalPressureType[];
  
  // Problem Context
  primaryBreakpoints: WorkflowBreakpoint[];
  secondaryBreakpoints: WorkflowBreakpoint[];
  
  // Action Context
  interventionTypes: InterventionType[];
  
  // Result Context
  outcomeType: OutcomeType;
  outcomeConfidence: number; // 0-1, how certain we are of outcome
  
  // Derived Pattern Signature
  patternSignature: string; // Hash of key elements for pattern matching
}

export interface ContributionExecutionContext extends ExecutionContext {
  contributionId: string;
  extractedFrom: 'situation' | 'pattern' | 'solution';
  extractionConfidence: number;
}

export interface JobExecutionContext extends ExecutionContext {
  jobPostingId: string;
  requiredInterventions: InterventionType[];
  anticipatedBreakpoints: WorkflowBreakpoint[];
  pressureIndicators: OperationalPressureType[];
}

// ==========================================
// PATTERN SIGNATURE GENERATION
// ==========================================

/**
 * Generate a pattern signature for matching
 * This creates a normalized hash of execution context elements
 */
export function generatePatternSignature(context: Partial<ExecutionContext>): string {
  const elements: string[] = [];
  
  // Normalize environment type
  if (context.trialEnvironmentType) {
    elements.push(`ENV:${context.trialEnvironmentType}`);
  }
  
  // Sort and normalize pressure types
  if (context.operationalPressureTypes?.length) {
    const sorted = [...context.operationalPressureTypes].sort();
    elements.push(`PRESSURE:${sorted.join('|')}`);
  }
  
  // Sort and normalize breakpoints
  if (context.primaryBreakpoints?.length) {
    const sorted = [...context.primaryBreakpoints].sort();
    elements.push(`BREAK:${sorted.join('|')}`);
  }
  
  // Sort and normalize interventions
  if (context.interventionTypes?.length) {
    const sorted = [...context.interventionTypes].sort();
    elements.push(`INTERV:${sorted.join('|')}`);
  }
  
  // Add outcome
  if (context.outcomeType) {
    elements.push(`OUT:${context.outcomeType}`);
  }
  
  // Create hash-like signature (not cryptographic, just consistent)
  return elements.join('::');
}

// ==========================================
// EXECUTION CONTEXT EXTRACTION
// ==========================================

/**
 * Extract execution context from a Contribution
 * Analyzes contribution content and metadata to derive execution patterns
 */
export function extractExecutionContextFromContribution(contribution: {
  id: string;
  contributionType: string;
  content: string;
  metadata?: {
    therapeuticArea?: string;
    trialPhase?: string;
    issueCategory?: string;
  };
}): ContributionExecutionContext {
  
  const content = contribution.content.toLowerCase();
  const meta = contribution.metadata || {};
  
  // Extract trial environment type
  const trialEnvironmentType = extractTrialEnvironmentType(content);
  
  // Extract operational pressure types
  const operationalPressureTypes = extractOperationalPressures(content);
  
  // Extract workflow breakpoints
  const { primary, secondary } = extractBreakpoints(content);
  
  // Extract intervention types
  const interventionTypes = extractInterventions(content);
  
  // Determine outcome type
  const outcomeType = extractOutcomeType(content, contribution.contributionType);
  
  // Generate pattern signature
  const patternSignature = generatePatternSignature({
    trialEnvironmentType,
    operationalPressureTypes,
    primaryBreakpoints: primary,
    interventionTypes,
    outcomeType
  });
  
  return {
    contributionId: contribution.id,
    extractedFrom: contribution.contributionType as 'situation' | 'pattern' | 'solution',
    extractionConfidence: calculateExtractionConfidence(content, meta),
    trialEnvironmentType,
    operationalPressureTypes,
    primaryBreakpoints: primary,
    secondaryBreakpoints: secondary,
    interventionTypes,
    outcomeType,
    outcomeConfidence: 0.8, // Default confidence
    patternSignature
  };
}

/**
 * Extract execution context from a Job Posting
 */
export function extractExecutionContextFromJobPosting(jobPosting: {
  id: string;
  title: string;
  description: string;
  therapeuticArea: string;
  trialPhase: string;
  requiredSkills?: string[];
}): JobExecutionContext {
  
  const content = `${jobPosting.title} ${jobPosting.description}`.toLowerCase();
  
  // Extract environment type
  const trialEnvironmentType = extractTrialEnvironmentType(content);
  
  // Extract pressure indicators (what pressures will this role face?)
  const pressureIndicators = extractOperationalPressures(content);
  
  // Extract anticipated breakpoints (what problems will they need to solve?)
  const { primary: anticipatedBreakpoints } = extractBreakpoints(content);
  
  // Extract required interventions (what actions will they need to take?)
  const requiredInterventions = extractInterventions(content);
  
  // Combine for full context
  const operationalPressureTypes = pressureIndicators;
  const primaryBreakpoints = anticipatedBreakpoints;
  const interventionTypes = requiredInterventions;
  
  // Default outcome for job posting is 'resolved' (we want someone who can resolve)
  const outcomeType: OutcomeType = 'resolved';
  
  const patternSignature = generatePatternSignature({
    trialEnvironmentType,
    operationalPressureTypes,
    primaryBreakpoints,
    interventionTypes,
    outcomeType
  });
  
  return {
    jobPostingId: jobPosting.id,
    requiredInterventions,
    anticipatedBreakpoints,
    pressureIndicators,
    trialEnvironmentType,
    operationalPressureTypes,
    primaryBreakpoints,
    secondaryBreakpoints: [],
    interventionTypes,
    outcomeType,
    outcomeConfidence: 0.6, // Lower confidence for job postings (anticipated, not actual)
    patternSignature
  };
}

// ==========================================
// EXTRACTION HELPERS
// ==========================================

function extractTrialEnvironmentType(content: string): TrialEnvironmentType {
  const academicIndicators = ['academic', 'university', 'teaching hospital', 'medical center', 'research institution'];
  const communityIndicators = ['community', 'private practice', 'community hospital', 'outpatient', 'local site'];
  const hybridIndicators = ['hybrid', 'multi-site', 'network', 'consortium', 'collaborative'];
  const siteNetworkIndicators = ['site network', 'multi-regional', 'global', 'international sites'];
  
  const academicScore = academicIndicators.filter(i => content.includes(i)).length;
  const communityScore = communityIndicators.filter(i => content.includes(i)).length;
  const hybridScore = hybridIndicators.filter(i => content.includes(i)).length;
  const siteNetworkScore = siteNetworkIndicators.filter(i => content.includes(i)).length;
  
  const maxScore = Math.max(academicScore, communityScore, hybridScore, siteNetworkScore);
  
  if (maxScore === 0) return 'hybrid'; // Default
  if (academicScore === maxScore) return 'academic';
  if (communityScore === maxScore) return 'community';
  if (siteNetworkScore === maxScore) return 'site_network';
  return 'hybrid';
}

function extractOperationalPressures(content: string): OperationalPressureType[] {
  const pressures: OperationalPressureType[] = [];
  
  const pressurePatterns: [OperationalPressureType, string[]][] = [
    ['enrollment_pressure', ['enrollment', 'recruitment', 'screening', 'eligible patients', 'recruit']],
    ['staffing_strain', ['staffing', 'turnover', 'shortage', 'coverage', 'capacity', 'team size']],
    ['regulatory_friction', ['regulatory', 'fda', 'submission', 'approval', 'compliance', 'audit', 'inspection']],
    ['data_backlog', ['data entry', 'backlog', 'query', 'edc', 'data quality', 'cleaning', 'lock']],
    ['timeline_pressure', ['timeline', 'deadline', 'milestone', 'delay', 'overdue', 'urgent', 'accelerated']],
    ['budget_constraint', ['budget', 'cost', 'funding', 'financial', 'expense', 'overrun']],
    ['quality_issues', ['quality', 'deviation', 'error', 'correction', 'audit finding', 'capa']],
    ['vendor_coordination', ['vendor', 'cro', 'central lab', 'imaging', 'logistics', 'supply chain']],
    ['patient_retention', ['retention', 'dropout', 'withdrawal', 'lost to follow', 'compliance']],
    ['protocol_complexity', ['complex protocol', 'amendment', 'eligibility criteria', 'procedure', 'visit schedule']]
  ];
  
  for (const [pressure, patterns] of pressurePatterns) {
    if (patterns.some(p => content.includes(p))) {
      pressures.push(pressure);
    }
  }
  
  return pressures.length > 0 ? pressures : ['timeline_pressure']; // Default
}

function extractBreakpoints(content: string): { primary: WorkflowBreakpoint[]; secondary: WorkflowBreakpoint[] } {
  const breakpoints: WorkflowBreakpoint[] = [];
  
  const breakpointPatterns: [WorkflowBreakpoint, string[]][] = [
    ['screening_failure', ['screening failure', 'ineligible', 'screen fail', 'consent withdraw']],
    ['enrollment_stall', ['enrollment stall', 'slow recruitment', 'no patients', 'recruitment challenge']],
    ['data_discrepancy', ['data discrepancy', 'query', 'data issue', 'missing data', 'inconsistency']],
    ['protocol_deviation', ['protocol deviation', 'violation', 'non-compliance', 'out of window']],
    ['regulatory_delay', ['regulatory delay', 'approval pending', 'submission delay', 'hold']],
    ['vendor_handoff', ['vendor delay', 'handoff', 'transfer issue', 'coordination problem']],
    ['safety_reporting', ['sae', 'safety report', 'adverse event', 'susar', 'safety issue']],
    ['query_resolution', ['query response', 'outstanding query', 'query aging', 'unanswered']],
    ['consent_issues', ['consent issue', 're-consent', 'consent form', 'icf', 'informed consent']],
    ['retention_drop', ['retention', 'dropout', 'withdrawal', 'lost to follow up', 'ltfu']]
  ];
  
  for (const [breakpoint, patterns] of breakpointPatterns) {
    if (patterns.some(p => content.includes(p))) {
      breakpoints.push(breakpoint);
    }
  }
  
  return {
    primary: breakpoints.slice(0, 3),
    secondary: breakpoints.slice(3)
  };
}

function extractInterventions(content: string): InterventionType[] {
  const interventions: InterventionType[] = [];
  
  const interventionPatterns: [InterventionType, string[]][] = [
    ['process_redesign', ['redesign', 'process improvement', 'workflow', 'streamline', 'optimize', 'new process']],
    ['resource_reallocation', ['reallocate', 'resource', 'staffing', 'reassign', 'redistribute', 'hire']],
    ['stakeholder_negotiation', ['negotiate', 'stakeholder', 'agreement', 'compromise', 'align', 'escalate']],
    ['technology_solution', ['technology', 'system', 'tool', 'software', 'automation', 'digital']],
    ['training_intervention', ['training', 'education', 'coaching', 'mentor', 'onboard', 'upskill']],
    ['protocol_amendment', ['amendment', 'protocol change', 'modify', 'revision', 'update protocol']],
    ['vendor_management', ['vendor', 'manage', 'contract', 'service level', 'oversight', 'cro']],
    ['patient_engagement', ['patient engagement', 'communication', 'outreach', 'support', 'educate patient']],
    ['data_correction', ['correction', 'fix', 'resolve', 'address', 'correct', 'remediate']],
    ['escalation', ['escalate', 'escalation', 'leadership', 'executive', ' senior management']]
  ];
  
  for (const [intervention, patterns] of interventionPatterns) {
    if (patterns.some(p => content.includes(p))) {
      interventions.push(intervention);
    }
  }
  
  return interventions.length > 0 ? interventions : ['process_redesign']; // Default
}

function extractOutcomeType(content: string, contributionType: string): OutcomeType {
  const resolvedIndicators = ['resolved', 'solved', 'fixed', 'success', 'completed', 'achieved', 'improved'];
  const mitigatedIndicators = ['mitigated', 'reduced', 'controlled', 'managed', 'minimized'];
  const failedIndicators = ['failed', 'unsuccessful', 'did not work', 'worse', 'abandoned'];
  const escalatedIndicators = ['escalated', 'referred', 'handed off', 'transferred'];
  const preventedIndicators = ['prevented', 'avoided', 'proactive', 'anticipated'];
  
  if (resolvedIndicators.some(i => content.includes(i))) return 'resolved';
  if (mitigatedIndicators.some(i => content.includes(i))) return 'mitigated';
  if (preventedIndicators.some(i => content.includes(i))) return 'prevented';
  if (escalatedIndicators.some(i => content.includes(i))) return 'escalated';
  if (failedIndicators.some(i => content.includes(i))) return 'failed';
  
  // Default based on contribution type
  if (contributionType === 'solution') return 'resolved';
  if (contributionType === 'pattern') return 'mitigated';
  if (contributionType === 'situation') return 'escalated';
  
  return 'mitigated'; // Default
}

function calculateExtractionConfidence(content: string, metadata: Record<string, any>): number {
  let confidence = 0.5; // Base confidence
  
  // Higher confidence if metadata is present
  if (metadata.therapeuticArea) confidence += 0.1;
  if (metadata.trialPhase) confidence += 0.1;
  if (metadata.issueCategory) confidence += 0.1;
  
  // Higher confidence for longer, more detailed content
  if (content.length > 500) confidence += 0.1;
  if (content.length > 1000) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

// ==========================================
// PATTERN MATCHING FUNCTIONS
// ==========================================

/**
 * Calculate execution context similarity between two contexts
 * Returns a score from 0 to 1
 */
export function calculateExecutionContextSimilarity(
  context1: ExecutionContext,
  context2: ExecutionContext
): { score: number; breakdown: Record<string, number> } {
  
  const breakdown: Record<string, number> = {};
  
  // Environment match (binary)
  breakdown.environmentMatch = context1.trialEnvironmentType === context2.trialEnvironmentType ? 1 : 0;
  
  // Pressure overlap (Jaccard similarity)
  const pressureOverlap = calculateJaccardSimilarity(
    context1.operationalPressureTypes,
    context2.operationalPressureTypes
  );
  breakdown.pressureMatch = pressureOverlap;
  
  // Breakpoint overlap (Jaccard similarity)
  const breakpointOverlap = calculateJaccardSimilarity(
    context1.primaryBreakpoints,
    context2.primaryBreakpoints
  );
  breakdown.breakpointMatch = breakpointOverlap;
  
  // Intervention overlap (Jaccard similarity)
  const interventionOverlap = calculateJaccardSimilarity(
    context1.interventionTypes,
    context2.interventionTypes
  );
  breakdown.interventionMatch = interventionOverlap;
  
  // Outcome alignment (does candidate have successful outcomes for this type?)
  const outcomeAlignment = context2.outcomeType === 'resolved' || context2.outcomeType === 'prevented' ? 1 : 0.5;
  breakdown.outcomeAlignment = outcomeAlignment;
  
  // Pattern signature similarity
  breakdown.patternSignatureMatch = context1.patternSignature === context2.patternSignature ? 1 : 0;
  
  // Weighted average
  const weights = {
    environmentMatch: 0.15,
    pressureMatch: 0.25,
    breakpointMatch: 0.25,
    interventionMatch: 0.20,
    outcomeAlignment: 0.10,
    patternSignatureMatch: 0.05
  };
  
  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (breakdown[key] || 0) * weight;
  }
  
  return { score, breakdown };
}

function calculateJaccardSimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1;
  if (arr1.length === 0 || arr2.length === 0) return 0;
  
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  extractExecutionContextFromContribution,
  extractExecutionContextFromJobPosting,
  generatePatternSignature,
  calculateExecutionContextSimilarity
};