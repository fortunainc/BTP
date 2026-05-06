/**
 * NAMING ENGINE
 * 
 * Generates FailureType names that are:
 * - Short and memorable
 * - Slightly provocative (creates recognition)
 * - System-focused (never blame-focused)
 * 
 * PATENT-CRITICAL: This naming methodology is part of BTP IP
 */

import { PatternCluster, NAMING_PATTERNS, FailureType } from './types';

/**
 * Concept keywords extracted from pattern signatures
 * These map breakpoint patterns to naming concepts
 */
const CONCEPT_MAPPINGS: Record<string, string[]> = {
  consent: ['Consent', 'Authorization', 'Permission'],
  competence: ['Competence', 'Capability', 'Qualification'],
  communication: ['Communication', 'Information', 'Disclosure'],
  documentation: ['Documentation', 'Record', 'Evidence'],
  oversight: ['Oversight', 'Monitoring', 'Supervision'],
  deviation: ['Deviation', 'Variance', 'Protocol'],
  data: ['Data', 'Information', 'Cleanliness'],
  timeline: ['Timeline', 'Schedule', 'Milestone'],
  resource: ['Resource', 'Capacity', 'Allocation'],
  safety: ['Safety', 'Protection', 'Risk'],
  quality: ['Quality', 'Standard', 'Compliance'],
  training: ['Training', 'Education', 'Preparedness'],
};

/**
 * Detect the primary concept from cluster patterns
 */
function detectPrimaryConcept(cluster: PatternCluster): string {
  const conceptScores: Record<string, number> = {};
  
  // Analyze all breakpoint patterns in the cluster
  for (const seed of cluster.seeds) {
    const bp = seed.breakpointPattern.toLowerCase();
    
    for (const [concept, keywords] of Object.entries(CONCEPT_MAPPINGS)) {
      for (const keyword of keywords) {
        if (bp.includes(keyword.toLowerCase())) {
          conceptScores[concept] = (conceptScores[concept] || 0) + 1;
        }
      }
    }
    
    // Also check tension points
    for (const tension of seed.tensionPoints) {
      const tensionLower = tension.toLowerCase();
      for (const [concept, keywords] of Object.entries(CONCEPT_MAPPINGS)) {
        for (const keyword of keywords) {
          if (tensionLower.includes(keyword.toLowerCase())) {
            conceptScores[concept] = (conceptScores[concept] || 0) + 0.5;
          }
        }
      }
    }
  }
  
  // Find highest scoring concept
  let maxScore = 0;
  let primaryConcept = 'Process'; // Default
  
  for (const [concept, score] of Object.entries(conceptScores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryConcept = concept;
    }
  }
  
  return primaryConcept;
}

/**
 * Select appropriate naming pattern based on failure characteristics
 */
function selectNamingPattern(cluster: PatternCluster): keyof typeof NAMING_PATTERNS {
  const avgSeverity = cluster.seeds.reduce((sum, s) => {
    const severityMap = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    return sum + severityMap[s.severityLevel];
  }, 0) / cluster.seeds.length;
  
  const layerDistribution = cluster.layerDistribution;
  
  // Pattern selection logic based on failure characteristics
  
  // ILLUSION: Good for consent, competence, oversight issues - things that appear to exist but don't
  if (cluster.primaryBreakpoint === 'CONSENT_GAP' || 
      cluster.primaryBreakpoint === 'COMPETENCE_GAP') {
    return 'ILLUSION';
  }
  
  // MIRAGE: Good for data, documentation issues - things that look correct but aren't
  if (cluster.primaryBreakpoint === 'DOCUMENTATION_GAP' ||
      cluster.primaryBreakpoint === 'DATA_INTEGRITY') {
    return 'MIRAGE';
  }
  
  // ABSORPTION: Good for silent failures, deviation absorption
  if (cluster.primaryBreakpoint === 'DEVIATION_ABSORPTION' ||
      avgSeverity >= 3) {
    return 'ABSORPTION';
  }
  
  // PARALYSIS: Good for process bottlenecks, approval delays
  if (layerDistribution.SPONSOR > 0.3 || 
      cluster.primaryBreakpoint === 'APPROVAL_DELAY') {
    return 'PARALYSIS';
  }
  
  // DECAY: Good for gradual erosion of standards
  if (cluster.seeds.some(s => s.emergenceVelocity === 'GRADUAL')) {
    return 'DECAY';
  }
  
  // AMPLIFICATION: Good for cascading failures
  if (cluster.seeds.some(s => s.emergenceVelocity === 'SUDDEN')) {
    return 'AMPLIFICATION';
  }
  
  // EROSION: Default for slow, systemic issues
  if (cluster.seeds.some(s => s.emergenceVelocity === 'RECURRING')) {
    return 'EROSION';
  }
  
  // COLLAPSE: For critical, multi-layer failures
  if (avgSeverity >= 3.5 && Object.keys(layerDistribution).length >= 3) {
    return 'COLLAPSE';
  }
  
  // Default to ILLUSION for most cases
  return 'ILLUSION';
}

/**
 * Generate a FailureType name from a cluster
 */
export function generateFailureTypeName(cluster: PatternCluster): {
  name: string;
  pattern: keyof typeof NAMING_PATTERNS;
  concept: string;
} {
  const concept = detectPrimaryConcept(cluster);
  const patternKey = selectNamingPattern(cluster);
  const pattern = NAMING_PATTERNS[patternKey];
  
  // Get the concept word (capitalize first letter)
  const conceptWord = CONCEPT_MAPPINGS[concept]?.[0] || 'Process';
  
  // Generate name using pattern
  const name = pattern.pattern.replace('{Concept}', conceptWord);
  
  return {
    name,
    pattern: patternKey,
    concept
  };
}

/**
 * Generate alternative names for a failure type
 * Useful for A/B testing or when name conflicts occur
 */
export function generateAlternativeNames(cluster: PatternCluster): string[] {
  const concept = detectPrimaryConcept(cluster);
  const alternatives: string[] = [];
  const conceptWords = CONCEPT_MAPPINGS[concept] || ['Process'];
  
  // Try different patterns with the same concept
  for (const [patternKey, pattern] of Object.entries(NAMING_PATTERNS)) {
    for (const conceptWord of conceptWords) {
      const name = pattern.pattern.replace('{Concept}', conceptWord);
      if (!alternatives.includes(name)) {
        alternatives.push(name);
      }
    }
  }
  
  // Return top 5 alternatives
  return alternatives.slice(0, 5);
}

/**
 * Validate a generated name
 * Ensures it meets BTP naming criteria
 */
export function validateName(name: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check length (should be 2-6 words)
  const words = name.split(' ');
  if (words.length < 2) {
    issues.push('Name too short - needs at least 2 words');
  }
  if (words.length > 6) {
    issues.push('Name too long - should be 2-6 words');
  }
  
  // Check for blame words
  const blameWords = ['error', 'mistake', 'fault', 'blame', 'failure', 'bad', 'wrong'];
  const nameLower = name.toLowerCase();
  for (const word of blameWords) {
    if (nameLower.includes(word) && word !== 'failure') {
      issues.push(`Name contains blame-focused word: "${word}"`);
    }
  }
  
  // Check for traceable language
  const traceablePatterns = [
    /\b(at|in|on|by)\s+\w+\s+(site|center|hospital|clinic)\b/i,
    /\b(dr\.|doctor|nurse|patient)\s+\w+\b/i,
    /\b(protocol|study)\s+\d+\b/i,
  ];
  
  for (const pattern of traceablePatterns) {
    if (pattern.test(name)) {
      issues.push('Name may contain traceable language');
      break;
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Generate complete FailureType definition from cluster
 */
export function generateFailureTypeDefinition(cluster: PatternCluster): {
  name: string;
  definition: string;
  systemFocus: string;
  nonAttributable: boolean;
} {
  const { name } = generateFailureTypeName(cluster);
  
  // Generate definition from cluster characteristics
  const definition = generateDefinition(cluster, name);
  
  // Determine system focus
  const systemFocus = determineSystemFocus(cluster);
  
  return {
    name,
    definition,
    systemFocus,
    nonAttributable: true // BTP ensures all names are non-attributable
  };
}

/**
 * Generate a definition for the failure type
 */
function generateDefinition(cluster: PatternCluster, name: string): string {
  const parts: string[] = [];
  
  // Core mechanism
  parts.push(`A systemic failure pattern characterized by ${name.toLowerCase()}.`);
  
  // Contributing factors
  const uniqueFactors = new Set<string>();
  for (const seed of cluster.seeds) {
    for (const factor of seed.contributingFactors) {
      uniqueFactors.add(factor.toLowerCase());
    }
  }
  
  if (uniqueFactors.size > 0) {
    const factorList = Array.from(uniqueFactors).slice(0, 3);
    parts.push(`Key contributing factors include ${factorList.join(', ')}.`);
  }
  
  // System layer context
  const layers = Object.entries(cluster.layerDistribution)
    .filter(([_, v]) => v > 0.2)
    .map(([k]) => k.toLowerCase());
  
  if (layers.length > 0) {
    parts.push(`Primarily manifests at the ${layers.join(' and ')} level(s).`);
  }
  
  return parts.join(' ');
}

/**
 * Determine the system focus for the failure type
 */
function determineSystemFocus(cluster: PatternCluster): string {
  const focusParts: string[] = [];
  
  // Primary breakpoint focus
  focusParts.push(`Breakpoint: ${cluster.primaryBreakpoint}`);
  
  // System layer focus
  const primaryLayer = Object.entries(cluster.layerDistribution)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (primaryLayer) {
    focusParts.push(`Layer: ${primaryLayer[0]}`);
  }
  
  // Tension focus
  if (cluster.seeds[0]?.tensionPoints[0]) {
    focusParts.push(`Tension: ${cluster.seeds[0].tensionPoints[0]}`);
  }
  
  return focusParts.join(' | ');
}

export default {
  generateFailureTypeName,
  generateAlternativeNames,
  validateName,
  generateFailureTypeDefinition
};