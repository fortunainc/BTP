/**
 * Anti-Correlation Service
 * 
 * Prevents re-identification of anonymous users through content analysis
 * 
 * Key Functions:
 * - Correlation Risk Scoring
 * - Automatic Redaction
 * - Timestamp Bucketing
 * - Cross-Realm Access Control
 */

// ==========================================
// Types and Interfaces
// ==========================================

export interface CorrelationRiskResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendations: string[];
}

export interface RedactionResult {
  redactedContent: string;
  redactions: Array<{
    original: string;
    replacement: string;
    type: string;
    position: [number, number];
  }>;
}

export interface TimestampBucket {
  bucket: string;
  label: string;
  approximateTime: Date;
}

export interface NotificationDelay {
  delayMs: number;
  reason: string;
}

export interface CrossRealmCheck {
  allowed: boolean;
  reason?: string;
  delayMs?: number;
}

// ==========================================
// Patterns for Redaction
// ==========================================

const REDACTION_PATTERNS = {
  // Names and identifiers
  names: {
    pattern: /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g,
    type: 'name',
    replacement: '[NAME]'
  },
  // Email addresses
  emails: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    type: 'email',
    replacement: '[EMAIL]'
  },
  // Phone numbers
  phones: {
    pattern: /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g,
    type: 'phone',
    replacement: '[PHONE]'
  },
  // Protocol numbers (NCT, EudraCT, etc.)
  protocolNumbers: {
    pattern: /\b(NCT\d{8}|EudraCT\s*\d{4}-\d{6}-\d{2}|-\d{3}-)\b/gi,
    type: 'protocol_number',
    replacement: '[PROTOCOL]'
  },
  // Specific dates
  dates: {
    pattern: /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi,
    type: 'date',
    replacement: '[DATE]'
  },
  // Locations
  locations: {
    pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|UK|CA|AU|DE|FR|JP|CN|IN|BR))\b/g,
    type: 'location',
    replacement: '[LOCATION]'
  },
  // Organizations
  organizations: {
    pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Hospital|Medical Center|Clinic|Institute|University|Pharma|Pharmaceuticals|Biotech|Therapeutics)\b/g,
    type: 'organization',
    replacement: '[ORGANIZATION]'
  },
  // Drug names (branded)
  brandedDrugs: {
    pattern: /\b([A-Z][a-z]*(?:am|um|ol|ine|ide|one|ex|ix|ax|ux|mab|nib|stat|pril|sartan))\b/g,
    type: 'drug_name',
    replacement: '[MEDICATION]'
  }
};

// ==========================================
// Correlation Risk Factors
// ==========================================

interface RiskFactor {
  name: string;
  weight: number;
  check: (content: string, metadata?: CorrelationMetadata) => number;
}

interface CorrelationMetadata {
  therapeuticArea?: string;
  trialPhase?: string;
  issueCategory?: string;
  roleCategory?: string;
  companyCategory?: string;
}

const RISK_FACTORS: RiskFactor[] = [
  {
    name: 'specific_dosage',
    weight: 0.3,
    check: (content) => {
      const dosagePattern = /\d+\s*(?:mg|mcg|g|ml|units?|IU)\b/gi;
      const matches = content.match(dosagePattern);
      return matches ? Math.min(matches.length * 0.1, 0.3) : 0;
    }
  },
  {
    name: 'specific_dates',
    weight: 0.4,
    check: (content) => {
      const datePattern = REDACTION_PATTERNS.dates.pattern;
      const matches = content.match(datePattern);
      return matches ? Math.min(matches.length * 0.15, 0.4) : 0;
    }
  },
  {
    name: 'rare_condition',
    weight: 0.35,
    check: (content, metadata) => {
      const rareIndicators = ['rare', 'orphan', 'prevalence', 'incidence <', 'fewer than'];
      const hasRare = rareIndicators.some(ind => 
        content.toLowerCase().includes(ind)
      );
      if (hasRare && metadata?.therapeuticArea === 'rare_disease') {
        return 0.35;
      }
      return hasRare ? 0.15 : 0;
    }
  },
  {
    name: 'identifying_details',
    weight: 0.5,
    check: (content) => {
      const identifyingPatterns = [
        /\b(?:my|our|I)\s+(?:patient|study|trial|center|site)\b/gi,
        /\b(?:specifically|exactly|precisely)\b/gi,
        /\b(?:only|sole|unique|single)\s+(?:site|center|patient|physician)\b/gi
      ];
      let score = 0;
      for (const pattern of identifyingPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          score += matches.length * 0.1;
        }
      }
      return Math.min(score, 0.5);
    }
  },
  {
    name: 'temporal_precision',
    weight: 0.25,
    check: (content) => {
      const timePatterns = [
        /\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/gi,
        /\b(?:yesterday|last week|last month|tomorrow)\b/gi,
        /\b\d+\s+(?:days?|weeks?|months?|years?)\s+ago\b/gi
      ];
      let score = 0;
      for (const pattern of timePatterns) {
        const matches = content.match(pattern);
        if (matches) {
          score += matches.length * 0.1;
        }
      }
      return Math.min(score, 0.25);
    }
  },
  {
    name: 'role_specificity',
    weight: 0.2,
    check: (content, metadata) => {
      if (!metadata?.roleCategory) return 0;
      const rolePatterns: Record<string, RegExp> = {
        'pi': /\b(?:principal investigator|PI|lead investigator)\b/gi,
        'coordinator': /\b(?:study coordinator|clinical research coordinator|CRC)\b/gi,
        'cra': /\b(?:clinical research associate|CRA|monitor)\b/gi,
        'data_manager': /\b(?:data manager|EDC manager)\b/gi,
        'regulatory': /\b(?:regulatory affairs|RA specialist|regulatory manager)\b/gi
      };
      const pattern = rolePatterns[metadata.roleCategory.toLowerCase()];
      if (pattern) {
        const matches = content.match(pattern);
        return matches ? Math.min(matches.length * 0.1, 0.2) : 0;
      }
      return 0;
    }
  }
];

// ==========================================
// Main Functions
// ==========================================

/**
 * Calculate correlation risk for content
 */
export function calculateCorrelationRisk(
  content: string, 
  metadata?: CorrelationMetadata
): CorrelationRiskResult {
  const factors: string[] = [];
  let totalRisk = 0;
  
  for (const factor of RISK_FACTORS) {
    const contribution = factor.check(content, metadata);
    if (contribution > 0) {
      factors.push(factor.name);
      totalRisk += contribution * factor.weight;
    }
  }
  
  // Cap at 1.0
  totalRisk = Math.min(totalRisk, 1.0);
  
  // Determine risk level
  let riskLevel: CorrelationRiskResult['riskLevel'];
  if (totalRisk < 0.2) {
    riskLevel = 'low';
  } else if (totalRisk < 0.4) {
    riskLevel = 'medium';
  } else if (totalRisk < 0.7) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (factors.includes('specific_dates')) {
    recommendations.push('Consider using relative time references (e.g., "recently" instead of specific dates)');
  }
  if (factors.includes('identifying_details')) {
    recommendations.push('Remove or generalize personally identifying details');
  }
  if (factors.includes('rare_condition') && metadata?.therapeuticArea === 'rare_disease') {
    recommendations.push('Rare disease context increases re-identification risk - consider additional anonymization');
  }
  
  return {
    riskScore: totalRisk,
    riskLevel,
    factors,
    recommendations
  };
}

/**
 * Apply automatic redaction to content
 */
export function applyAutomaticRedaction(content: string): RedactionResult {
  const redactions: RedactionResult['redactions'] = [];
  let redactedContent = content;
  
  for (const [key, config] of Object.entries(REDACTION_PATTERNS)) {
    const matches = [...content.matchAll(config.pattern)];
    for (const match of matches) {
      if (match.index !== undefined && match[0]) {
        const original = match[0];
        const replacement = config.replacement;
        
        redactions.push({
          original,
          replacement,
          type: config.type,
          position: [match.index, match.index + original.length]
        });
      }
    }
  }
  
  // Apply redactions (sort by position descending to maintain indices)
  redactions.sort((a, b) => b.position[0] - a.position[0]);
  
  for (const redaction of redactions) {
    redactedContent = 
      redactedContent.slice(0, redaction.position[0]) + 
      redaction.replacement + 
      redactedContent.slice(redaction.position[1]);
  }
  
  return { redactedContent, redactions };
}

/**
 * Bucket timestamp into less precise time periods
 */
export function bucketTimestamp(timestamp: Date): TimestampBucket {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  
  let bucket: string;
  let label: string;
  let approximateTime: Date;
  
  if (diffHours < 24) {
    // Today - bucket by time of day
    const hour = timestamp.getHours();
    if (hour < 12) {
      bucket = 'today_morning';
      label = 'This morning';
    } else if (hour < 17) {
      bucket = 'today_afternoon';
      label = 'This afternoon';
    } else {
      bucket = 'today_evening';
      label = 'This evening';
    }
    approximateTime = new Date(now.setHours(12, 0, 0, 0));
  } else if (diffDays < 7) {
    // This week
    bucket = 'this_week';
    label = 'This week';
    approximateTime = new Date(now.setDate(now.getDate() - 3));
  } else if (diffDays < 30) {
    // This month
    bucket = 'this_month';
    label = 'Earlier this month';
    approximateTime = new Date(now.setDate(now.getDate() - 15));
  } else if (diffDays < 90) {
    // Last quarter
    bucket = 'last_quarter';
    label = 'In the last few months';
    approximateTime = new Date(now.setDate(now.getDate() - 45));
  } else {
    // Older
    bucket = 'older';
    label = 'More than 3 months ago';
    approximateTime = new Date(now.setDate(now.getDate() - 90));
  }
  
  return { bucket, label, approximateTime };
}

/**
 * Calculate notification delay based on correlation risk
 */
export function calculateNotificationDelay(correlationRisk: number): NotificationDelay {
  // Base delay
  let delayMs = 0;
  let reason = '';
  
  if (correlationRisk < 0.2) {
    // Low risk - no delay
    delayMs = 0;
    reason = 'Low correlation risk - immediate notification';
  } else if (correlationRisk < 0.4) {
    // Medium risk - 1 hour delay
    delayMs = 60 * 60 * 1000;
    reason = 'Medium correlation risk - 1 hour notification delay applied';
  } else if (correlationRisk < 0.7) {
    // High risk - 6 hour delay
    delayMs = 6 * 60 * 60 * 1000;
    reason = 'High correlation risk - 6 hour notification delay applied';
  } else {
    // Critical risk - 24 hour delay
    delayMs = 24 * 60 * 60 * 1000;
    reason = 'Critical correlation risk - 24 hour notification delay applied';
  }
  
  return { delayMs, reason };
}

/**
 * Check cross-realm access permissions
 */
export function checkCrossRealmAccess(params: {
  userId: string;
  sourceRealm: 'intelligence' | 'opportunity';
  targetRealm: 'intelligence' | 'opportunity';
  userRoles: string[];
}): CrossRealmCheck {
  const { sourceRealm, targetRealm, userRoles } = params;
  
  // Same realm - always allowed
  if (sourceRealm === targetRealm) {
    return { allowed: true };
  }
  
  // Intelligence -> Opportunity: Check if user is operator
  if (sourceRealm === 'intelligence' && targetRealm === 'opportunity') {
    if (!userRoles.includes('operator')) {
      return {
        allowed: false,
        reason: 'Only operators can access the Opportunity Realm'
      };
    }
    // Add delay to prevent timing attacks
    return {
      allowed: true,
      delayMs: 1000 // 1 second delay
    };
  }
  
  // Opportunity -> Intelligence: Check if user has contributions
  if (sourceRealm === 'opportunity' && targetRealm === 'intelligence') {
    // This transition requires additional checks
    return {
      allowed: true,
      delayMs: 2000 // 2 second delay
    };
  }
  
  return { allowed: true };
}

/**
 * Check if two pieces of content are correlated
 */
export function checkContentCorrelation(
  content1: string,
  content2: string
): { isCorrelated: boolean; sharedElements: string[] } {
  const sharedElements: string[] = [];
  
  // Extract significant terms from both contents
  const extractTerms = (content: string): Set<string> => {
    const terms = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 4); // Only significant terms
    return new Set(terms);
  };
  
  const terms1 = extractTerms(content1);
  const terms2 = extractTerms(content2);
  
  // Find shared significant terms
  for (const term of terms1) {
    if (terms2.has(term)) {
      sharedElements.push(term);
    }
  }
  
  // Check for shared rare terms or combinations
  const isCorrelated = sharedElements.length > 5 || 
    (sharedElements.length > 3 && sharedElements.some(el => el.length > 10));
  
  return { isCorrelated, sharedElements };
}

/**
 * Sanitize opportunity match data for display
 * Removes information that could enable correlation
 */
export function sanitizeOpportunityMatchData(opportunity: Record<string, unknown>): Record<string, unknown> {
  // Create a sanitized copy
  const sanitized = { ...opportunity };
  
  // Remove exact timestamps
  if (sanitized.createdAt) {
    sanitized.createdAt = bucketTimestamp(new Date(sanitized.createdAt as string)).label;
  }
  
  // Remove any user-identifying fields
  delete sanitized.createdById;
  delete sanitized.updatedAt;
  
  // Remove any internal scoring
  delete sanitized.matchScore;
  delete sanitized.priority;
  
  // Add organization name if available
  if (sanitized.organization && typeof sanitized.organization === 'object') {
    const org = sanitized.organization as Record<string, unknown>;
    sanitized.organizationName = org.name || 'Anonymous Organization';
    delete sanitized.organization;
  }
  
  return sanitized;
}

// ==========================================
// POST-EXTRACTION CORRELATION RISK (Section 12)
// ==========================================

/**
 * Interface for translation engine field combinations
 * These are the fields extracted by the translation engine
 * that could potentially be used for re-identification
 * when combined.
 */
export interface ExtractionCorrelationCheck {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  rareCombinations: string[];
  recommendations: string[];
  generalizedFields: Record<string, string>;
}

/**
 * Rare combination detection thresholds
 * If fewer than N contributions share a specific combination,
 * it's considered rare and potentially identifying
 */
const RARE_COMBO_THRESHOLD = 5;

/**
 * Known rare combinations that increase correlation risk
 * These are combinations of translation engine fields that,
 * when present together, could narrow down the contributor
 */
const KNOWN_RARE_COMBINATIONS = [
  // Very specific suppressed + emotional signal combo
  ['suppressedSignalType', 'emotionalSignalType'],
  // Specific workaround + burden absorber
  ['workaroundType', 'burdenAbsorber'],
  // High decision distance + specific downstream risk
  ['decisionDistanceLevel', 'likelyDownstreamRisk'],
  // Specific invisible work + burden type
  ['invisibleWorkType', 'burdenType'],
  // Suppressed signal + specific workaround
  ['suppressedSignalType', 'workaroundType'],
  // Emotional signal + burden absorber
  ['emotionalSignalType', 'burdenAbsorber'],
];

/**
 * Generalization rules for rare combinations
 * When a field value is too specific, generalize it
 */
const GENERALIZATION_RULES: Record<string, Record<string, string>> = {
  suppressedSignalType: {
    // Keep the main categories, but merge rare subtypes
    'FEAR_OF_PUSHBACK': 'PRESSURE',
    'SPONSOR_PRESSURE': 'PRESSURE',
    'CRO_PRESSURE': 'PRESSURE',
    'SITE_SILENCE': 'NOT_ESCALATED',
  },
  emotionalSignalType: {
    // Merge specific emotions into broader categories
    'ESCALATION_FEAR': 'FEAR',
    'SILENCED': 'FEAR',
  },
  workaroundType: {
    'OFF_LABEL_PROCEDURE': 'PROCESS_SKIP',
    'UNOFFICIAL_TOOL': 'MANUAL_WORKAROUND',
  },
  burdenAbsorber: {
    // Keep main categories
  },
  invisibleWorkType: {
    'ADVOCACY': 'COORDINATION',
    'TRAINING': 'COORDINATION',
  },
  decisionDistanceLevel: {
    // Don't generalize — these are already broad
  },
};

/**
 * Check post-extraction correlation risk
 * 
 * After the translation engine extracts structured fields,
 * this function checks whether the combination of those fields
 * could be used to re-identify a contributor.
 * 
 * Called after translation engine processing, before storing.
 */
export function checkExtractionCorrelationRisk(
  extractedFields: Record<string, unknown>,
  existingContributions?: number // Total contributions in DB for comparison
): ExtractionCorrelationCheck {
  const recommendations: string[] = [];
  const rareCombinations: string[] = [];
  const generalizedFields: Record<string, string> = {};
  let riskScore = 0;

  // 1. Check for rare field value combinations
  for (const combo of KNOWN_RARE_COMBINATIONS) {
    const [field1, field2] = combo;
    const value1 = extractedFields[field1];
    const value2 = extractedFields[field2];

    if (value1 && value2 && value1 !== 'UNKNOWN' && value2 !== 'UNKNOWN') {
      // This combination exists — check if it's rare
      // For now, use heuristic: specific non-UNKNOWN combos are flagged
      const comboKey = `${field1}=${value1}+${field2}=${value2}`;
      rareCombinations.push(comboKey);
      riskScore += 0.15;
    }
  }

  // 2. Count non-UNKNOWN fields (more specific = higher risk)
  const specificFieldCount = Object.entries(extractedFields)
    .filter(([key, value]) => 
      value !== null && 
      value !== undefined && 
      value !== 'UNKNOWN' && 
      value !== false &&
      value !== 0 &&
      typeof value === 'string' && 
      value.length > 0
    )
    .length;

  if (specificFieldCount >= 6) {
    riskScore += 0.2;
    recommendations.push('High number of specific extraction fields — consider generalizing');
  } else if (specificFieldCount >= 4) {
    riskScore += 0.1;
  }

  // 3. Check for exact numeric values that could be identifying
  const numericFields = ['officialRealityGap', 'operationalDebtLevel', 'economicValuePotential', 'confidenceScore'];
  for (const field of numericFields) {
    const value = extractedFields[field];
    if (typeof value === 'number') {
      // Round to 2 decimal places to prevent fingerprinting via precise values
      const rounded = Math.round(value * 100) / 100;
      if (value !== rounded) {
        generalizedFields[field] = `Rounded from ${value} to ${rounded}`;
      }
    }
  }

  // 4. Apply generalization rules to reduce specificity
  for (const [field, rules] of Object.entries(GENERALIZATION_RULES)) {
    const value = extractedFields[field];
    if (typeof value === 'string' && rules[value]) {
      generalizedFields[field] = rules[value];
      riskScore += 0.05; // Minor risk for needing generalization
    }
  }

  // 5. Check for traceable exact counts
  const arrayFields = ['driftIndicators'];
  for (const field of arrayFields) {
    const value = extractedFields[field];
    if (Array.isArray(value) && value.length === 1) {
      // Single-item arrays are more identifying
      riskScore += 0.1;
      recommendations.push(`Single ${field} value is more identifying — consider batching`);
    }
  }

  // Cap the risk score
  riskScore = Math.min(1.0, riskScore);

  // Determine risk level
  let riskLevel: ExtractionCorrelationCheck['riskLevel'];
  if (riskScore >= 0.7) riskLevel = 'critical';
  else if (riskScore >= 0.5) riskLevel = 'high';
  else if (riskScore >= 0.3) riskLevel = 'medium';
  else riskLevel = 'low';

  // Add recommendations based on risk level
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('Apply field generalization before storing');
    recommendations.push('Consider suppressing rare combination details');
  }

  if (rareCombinations.length > 0) {
    recommendations.push(`Rare combinations detected: ${rareCombinations.join(', ')}`);
  }

  return {
    riskScore,
    riskLevel,
    rareCombinations,
    recommendations,
    generalizedFields
  };
}

/**
 * Apply generalization to extraction fields before storing
 * This ensures that rare/specific values are broadened
 * to prevent correlation attacks
 */
export function generalizeExtractionFields(
  fields: Record<string, unknown>
): Record<string, unknown> {
  const generalized = { ...fields };

  for (const [field, rules] of Object.entries(GENERALIZATION_RULES)) {
    const value = generalized[field];
    if (typeof value === 'string' && rules[value]) {
      generalized[field] = rules[value];
    }
  }

  // Round numeric fields to prevent fingerprinting
  const numericFields = ['officialRealityGap', 'operationalDebtLevel', 'economicValuePotential', 'confidenceScore'];
  for (const field of numericFields) {
    const value = generalized[field];
    if (typeof value === 'number') {
      generalized[field] = Math.round(value * 100) / 100;
    }
  }

  return generalized;
}

export default {
  calculateCorrelationRisk,
  applyAutomaticRedaction,
  bucketTimestamp,
  calculateNotificationDelay,
  checkCrossRealmAccess,
  checkContentCorrelation,
  sanitizeOpportunityMatchData,
  checkExtractionCorrelationRisk,
  generalizeExtractionFields
};