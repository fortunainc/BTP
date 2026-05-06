/**
 * INSIGHT / CONSEQUENCE LAYER
 * 
 * For each Pattern, generates insight statements that are:
 * - Grounded in actual data
 * - Slightly uncomfortable
 * - Decision-relevant
 */

import { Pattern, PatternStatus, ResolutionStatus } from './pattern-engine';

// ==========================================
// TYPES
// ==========================================

export interface Insight {
  patternId: string;
  statement: string;
  type: 'impact' | 'resolution' | 'trend' | 'risk';
  confidence: 'high' | 'medium' | 'low';
}

// ==========================================
// INSIGHT TEMPLATES
// ==========================================

const INSIGHT_TEMPLATES = {
  impact: [
    'This pattern is likely to impact enrollment timelines',
    'This is creating delays across multiple sites',
    'This is affecting data quality in similar trials',
    'This is driving up operational costs',
    'This is causing patient retention issues'
  ],
  resolution: [
    'This has not been consistently resolved across similar trials',
    'Workarounds vary and are not scalable',
    'No standard approach has emerged yet',
    'Solutions that worked once haven\'t worked elsewhere',
    'This keeps coming back despite intervention attempts'
  ],
  trend: [
    'This is appearing more frequently in recent months',
    'This started in one area and is now spreading',
    'This was rare but is becoming common',
    'Multiple roles are reporting the same issue',
    'This is moving across therapeutic areas'
  ],
  risk: [
    'This may indicate a systemic protocol issue',
    'This could escalate if not addressed',
    'This is creating compliance risks',
    'This is eroding site confidence',
    'This is damaging sponsor-CRO relationships'
  ]
};

// ==========================================
// MAIN FUNCTIONS
// ==========================================

/**
 * Generate insight for a pattern
 */
export function generateInsight(pattern: Pattern): Insight {
  const type = determineInsightType(pattern);
  const statement = selectInsightStatement(pattern, type);
  const confidence = determineConfidence(pattern);

  return {
    patternId: pattern.patternId,
    statement,
    type,
    confidence
  };
}

/**
 * Generate insights for multiple patterns
 */
export function generateInsights(patterns: Pattern[]): Insight[] {
  return patterns.map(generateInsight);
}

/**
 * Get insight statement for display
 */
export function getInsightText(pattern: Pattern): string {
  const insight = generateInsight(pattern);
  return insight.statement;
}

// ==========================================
// INSIGHT SELECTION LOGIC
// ==========================================

/**
 * Determine the best insight type for a pattern
 */
function determineInsightType(pattern: Pattern): 'impact' | 'resolution' | 'trend' | 'risk' {
  // Critical patterns get risk insights
  if (pattern.patternStatus === 'ESTABLISHED') {
    return 'risk';
  }

  // Unresolved patterns get resolution insights
  if (pattern.resolutionStatus === 'unresolved') {
    return 'resolution';
  }

  // High interaction patterns get trend insights
  if (pattern.interactionCount >= 5) {
    return 'trend';
  }

  // Default to impact
  return 'impact';
}

/**
 * Select an insight statement
 */
function selectInsightStatement(
  pattern: Pattern, 
  type: 'impact' | 'resolution' | 'trend' | 'risk'
): string {
  const templates = INSIGHT_TEMPLATES[type];
  
  // Use pattern data to influence selection
  const index = (
    pattern.situationCount + 
    pattern.interactionCount + 
    pattern.therapeuticAreas.length
  ) % templates.length;

  let statement = templates[index];

  // Customize based on pattern data
  statement = customizeStatement(statement, pattern);

  return statement;
}

/**
 * Customize statement based on pattern details
 */
function customizeStatement(statement: string, pattern: Pattern): string {
  // Add context based on therapeutic areas
  if (pattern.therapeuticAreas.length > 2) {
    statement = statement.replace('similar trials', 'multiple therapeutic areas');
  }

  // Add phase context
  if (pattern.trialPhases.includes('Phase 3')) {
    statement = statement.replace('trials', 'Phase 3 trials');
  }

  return statement;
}

/**
 * Determine confidence level
 */
function determineConfidence(pattern: Pattern): 'high' | 'medium' | 'low' {
  if (pattern.situationCount >= 5 && pattern.interactionCount >= 5) {
    return 'high';
  }
  if (pattern.situationCount >= 3 || pattern.interactionCount >= 3) {
    return 'medium';
  }
  return 'low';
}

// ==========================================
// MATCHING INSIGHTS
// ==========================================

/**
 * Generate match explanation for a capability identity
 */
export function generateMatchExplanation(
  pattern: Pattern,
  capabilityAreas: string[]
): string {
  const explanations: string[] = [];

  // Therapeutic area match
  const areaMatch = capabilityAreas.some(area => 
    pattern.therapeuticAreas.includes(area)
  );
  if (areaMatch) {
    explanations.push(`Worked on similar ${pattern.therapeuticAreas[0]?.toLowerCase() || 'oncology'} trials`);
  }

  // Issue category match
  if (pattern.issueCategories[0]) {
    const category = pattern.issueCategories[0].replace(/-/g, ' ');
    explanations.push(`Resolved ${category} issues`);
  }

  // Phase match
  if (pattern.trialPhases.length > 0) {
    explanations.push(`Experience with ${pattern.trialPhases[0]} trials`);
  }

  // Default
  if (explanations.length === 0) {
    explanations.push('Relevant operational experience');
  }

  return explanations[0];
}

export default {
  generateInsight,
  generateInsights,
  getInsightText,
  generateMatchExplanation
};