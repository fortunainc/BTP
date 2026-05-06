/**
 * CROSS-SEED INTELLIGENCE
 * 
 * Links multiple seeds to the same failure type
 * Tracks seed contributions and relationships
 * Enables cross-pattern analysis and insight generation
 */

import {
  PatternSeed,
  PatternCluster,
  FailureType,
  CrossSeedIntelligence,
  SystemLayer
} from './types';
import { calculateSimilarity } from './clustering-engine';

/**
 * Cross-seed relationship types
 */
export type SeedRelationType = 
  | 'CAUSAL'        // One seed caused another
  | 'CORRELATED'    // Seeds appear together frequently
  | 'PRECEDING'     // One seed typically precedes another
  | 'AMPLIFYING'    // One seed amplifies impact of another
  | 'MITIGATING';   // One seed reduces impact of another

/**
 * Seed relationship record
 */
export interface SeedRelation {
  seedId1: string;
  seedId2: string;
  relationType: SeedRelationType;
  confidence: number;
  evidence: string[];
}

/**
 * Cross-seed intelligence configuration
 */
const CSI_CONFIG = {
  correlationThreshold: 0.6,
  minCooccurrences: 3,
  causalThreshold: 0.75,
  maxRelationsPerSeed: 10,
};

/**
 * Build cross-seed intelligence for a failure type
 */
export function buildCrossSeedIntelligence(
  failureType: FailureType,
  allSeeds: PatternSeed[],
  allRelations: SeedRelation[]
): CrossSeedIntelligence {
  const linkedSeedIds = failureType.linkedSeeds;
  const linkedSeeds = allSeeds.filter(s => linkedSeedIds.includes(s.id));
  
  // Calculate cross-layer patterns
  const crossLayerPatterns = analyzeCrossLayerPatterns(linkedSeeds);
  
  // Calculate temporal patterns
  const temporalPatterns = analyzeTemporalPatterns(linkedSeeds);
  
  // Calculate co-occurrence patterns
  const cooccurrencePatterns = analyzeCooccurrencePatterns(linkedSeeds, allSeeds);
  
  // Generate insights
  const insights = generateInsights(
    linkedSeeds,
    crossLayerPatterns,
    temporalPatterns,
    cooccurrencePatterns
  );
  
  return {
    failureTypeId: failureType.id,
    linkedSeeds: linkedSeedIds,
    crossLayerPatterns,
    temporalPatterns,
    cooccurrencePatterns,
    insights
  };
}

/**
 * Analyze cross-layer patterns in linked seeds
 */
function analyzeCrossLayerPatterns(seeds: PatternSeed[]): {
  layerSequence: SystemLayer[];
  layerTransitions: { from: SystemLayer; to: SystemLayer; frequency: number }[];
} {
  // Count layer transitions
  const transitionCounts: Record<string, number> = {};
  
  for (const seed of seeds) {
    const originLayer = seed.originLayer;
    const impactedLayers = seed.impactedLayers;
    
    for (const impacted of impactedLayers) {
      if (originLayer !== impacted) {
        const key = `${originLayer}->${impacted}`;
        transitionCounts[key] = (transitionCounts[key] || 0) + 1;
      }
    }
  }
  
  // Build layer sequence (most common path)
  const layerSequence = determineMostCommonPath(seeds, transitionCounts);
  
  // Build transition records
  const layerTransitions = Object.entries(transitionCounts)
    .map(([key, frequency]) => {
      const [from, to] = key.split('->') as [SystemLayer, SystemLayer];
      return { from, to, frequency };
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
  
  return { layerSequence, layerTransitions };
}

/**
 * Determine most common layer path
 */
function determineMostCommonPath(
  seeds: PatternSeed[],
  transitions: Record<string, number>
): SystemLayer[] {
  // Start with most common origin layer
  const originCounts: Record<SystemLayer, number> = {
    PATIENT: 0,
    SITE: 0,
    CRO: 0,
    SPONSOR: 0
  };
  
  for (const seed of seeds) {
    originCounts[seed.originLayer]++;
  }
  
  // Find starting layer
  let current: SystemLayer = 'SITE'; // Default
  let maxCount = 0;
  
  for (const [layer, count] of Object.entries(originCounts)) {
    if (count > maxCount) {
      maxCount = count;
      current = layer as SystemLayer;
    }
  }
  
  // Build path
  const path: SystemLayer[] = [current];
  const visited = new Set<SystemLayer>([current]);
  
  for (let i = 0; i < 3; i++) { // Max 4 layers
    let bestNext: SystemLayer | null = null;
    let bestFreq = 0;
    
    for (const layer of ['PATIENT', 'SITE', 'CRO', 'SPONSOR'] as SystemLayer[]) {
      if (visited.has(layer)) continue;
      
      const key = `${current}->${layer}`;
      const freq = transitions[key] || 0;
      
      if (freq > bestFreq) {
        bestFreq = freq;
        bestNext = layer;
      }
    }
    
    if (bestNext) {
      path.push(bestNext);
      visited.add(bestNext);
      current = bestNext;
    }
  }
  
  return path;
}

/**
 * Analyze temporal patterns in linked seeds
 */
function analyzeTemporalPatterns(seeds: PatternSeed[]): {
  typicalOnset: 'IMMEDIATE' | 'DELAYED' | 'PROGRESSIVE';
  peakOccurrence: string;
  recurrencePattern: 'ISOLATED' | 'CLUSTERED' | 'SEASONAL';
} {
  // Analyze emergence velocities
  const velocities = seeds.map(s => s.emergenceVelocity);
  
  const velocityCounts = {
    SUDDEN: velocities.filter(v => v === 'SUDDEN').length,
    GRADUAL: velocities.filter(v => v === 'GRADUAL').length,
    RECURRING: velocities.filter(v => v === 'RECURRING').length
  };
  
  // Determine typical onset
  let typicalOnset: 'IMMEDIATE' | 'DELAYED' | 'PROGRESSIVE';
  if (velocityCounts.SUDDEN > velocityCounts.GRADUAL) {
    typicalOnset = 'IMMEDIATE';
  } else if (velocityCounts.GRADUAL > velocityCounts.RECURRING) {
    typicalOnset = 'PROGRESSIVE';
  } else {
    typicalOnset = 'DELAYED';
  }
  
  // Peak occurrence (placeholder - would need timestamp analysis)
  const peakOccurrence = 'Mid-study phase';
  
  // Recurrence pattern
  let recurrencePattern: 'ISOLATED' | 'CLUSTERED' | 'SEASONAL';
  if (velocityCounts.RECURRING > seeds.length / 2) {
    recurrencePattern = 'CLUSTERED';
  } else if (velocityCounts.SUDDEN > seeds.length / 2) {
    recurrencePattern = 'ISOLATED';
  } else {
    recurrencePattern = 'SEASONAL';
  }
  
  return { typicalOnset, peakOccurrence, recurrencePattern };
}

/**
 * Analyze co-occurrence patterns
 */
function analyzeCooccurrencePatterns(
  linkedSeeds: PatternSeed[],
  allSeeds: PatternSeed[]
): {
  frequentlyWith: string[];
  rarelyWith: string[];
  exclusivePatterns: string[];
} {
  // Calculate seed similarities
  const similarities: { otherId: string; similarity: number }[] = [];
  
  const linkedIds = new Set(linkedSeeds.map(s => s.id));
  const otherSeeds = allSeeds.filter(s => !linkedIds.has(s.id));
  
  for (const linked of linkedSeeds) {
    for (const other of otherSeeds) {
      const similarityResult = calculateSimilarity(linked, other);
      similarities.push({ otherId: other.id, similarity: similarityResult.overallScore });
    }
  }
  
  // Sort by similarity
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // Get top co-occurring seeds
  const frequentlyWith = similarities
    .slice(0, 5)
    .map(s => s.otherId);
  
  // Get rarely co-occurring seeds
  const rarelyWith = similarities
    .slice(-5)
    .map(s => s.otherId);
  
  // Find exclusive patterns (breakpoints unique to this cluster)
  const linkedBreakpoints = new Set(
    linkedSeeds.flatMap(s => [s.breakpointPattern])
  );
  
  const otherBreakpoints = new Set(
    otherSeeds.flatMap(s => [s.breakpointPattern])
  );
  
  const exclusivePatterns = Array.from(linkedBreakpoints)
    .filter(bp => !otherBreakpoints.has(bp));
  
  return { frequentlyWith, rarelyWith, exclusivePatterns };
}

/**
 * Generate insights from cross-seed analysis
 */
function generateInsights(
  seeds: PatternSeed[],
  crossLayer: { layerSequence: SystemLayer[]; layerTransitions: { from: SystemLayer; to: SystemLayer; frequency: number }[] },
  temporal: { typicalOnset: string; peakOccurrence: string; recurrencePattern: string },
  cooccurrence: { frequentlyWith: string[]; rarelyWith: string[]; exclusivePatterns: string[] }
): string[] {
  const insights: string[] = [];
  
  // Cross-layer insight
  if (crossLayer.layerSequence.length > 1) {
    insights.push(
      `Pattern typically propagates from ${crossLayer.layerSequence[0]} to ${crossLayer.layerSequence.slice(1).join(' then ')}`
    );
  }
  
  // Temporal insight
  insights.push(
    `Onset is typically ${temporal.typicalOnset.toLowerCase()} with ${temporal.recurrencePattern.toLowerCase()} occurrence pattern`
  );
  
  // Exclusive patterns insight
  if (cooccurrence.exclusivePatterns.length > 0) {
    insights.push(
      `Unique breakpoint signatures: ${cooccurrence.exclusivePatterns.slice(0, 2).join(', ')}`
    );
  }
  
  // Severity correlation
  const severityCounts = {
    CRITICAL: seeds.filter(s => s.severityLevel === 'CRITICAL').length,
    HIGH: seeds.filter(s => s.severityLevel === 'HIGH').length
  };
  
  if (severityCounts.CRITICAL + severityCounts.HIGH > seeds.length / 2) {
    insights.push('High severity concentration suggests systemic vulnerability');
  }
  
  return insights;
}

/**
 * Detect seed relationships
 */
export function detectSeedRelations(seeds: PatternSeed[]): SeedRelation[] {
  const relations: SeedRelation[] = [];
  
  for (let i = 0; i < seeds.length; i++) {
    for (let j = i + 1; j < seeds.length; j++) {
      const seed1 = seeds[i];
      const seed2 = seeds[j];
      
      // Check for causal relationship
      const causalRelation = detectCausalRelation(seed1, seed2);
      if (causalRelation) {
        relations.push(causalRelation);
        continue;
      }
      
      // Check for correlation
      const correlationRelation = detectCorrelation(seed1, seed2);
      if (correlationRelation) {
        relations.push(correlationRelation);
        continue;
      }
      
      // Check for amplification
      const ampRelation = detectAmplification(seed1, seed2);
      if (ampRelation) {
        relations.push(ampRelation);
      }
    }
  }
  
  // Sort by confidence and limit
  return relations
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, seeds.length * CSI_CONFIG.maxRelationsPerSeed);
}

/**
 * Detect causal relationship between seeds
 */
function detectCausalRelation(seed1: PatternSeed, seed2: PatternSeed): SeedRelation | null {
  // Check if seed1's impacts overlap with seed2's breakpoints
  const impactOverlap = seed1.impactedLayers.some(layer => 
    seed2.impactedLayers.includes(layer)
  );
  
  if (!impactOverlap) return null;
  
  // Check for temporal sequence (simplified)
  const velocitySequence = 
    seed1.emergenceVelocity === 'SUDDEN' && seed2.emergenceVelocity === 'GRADUAL';
  
  if (velocitySequence) {
    return {
      seedId1: seed1.id,
      seedId2: seed2.id,
      relationType: 'PRECEDING',
      confidence: 0.7,
      evidence: ['Temporal sequence detected', 'Layer overlap present']
    };
  }
  
  return null;
}

/**
 * Detect correlation between seeds
 */
function detectCorrelation(seed1: PatternSeed, seed2: PatternSeed): SeedRelation | null {
  const similarityResult = calculateSimilarity(seed1, seed2);
  const similarity = similarityResult.overallScore;
  
  if (similarity >= CSI_CONFIG.correlationThreshold) {
    return {
      seedId1: seed1.id,
      seedId2: seed2.id,
      relationType: 'CORRELATED',
      confidence: similarity,
      evidence: [`Similarity score: ${similarity.toFixed(2)}`]
    };
  }
  
  return null;
}

/**
 * Detect amplification relationship
 */
function detectAmplification(seed1: PatternSeed, seed2: PatternSeed): SeedRelation | null {
  // Check if combined severity is higher than individual
  const combinedSeverity = 
    (seed1.severityLevel === 'CRITICAL' || seed2.severityLevel === 'CRITICAL') ||
    (seed1.severityLevel === 'HIGH' && seed2.severityLevel === 'HIGH');
  
  const layerOverlap = seed1.impactedLayers.filter(l => 
    seed2.impactedLayers.includes(l)
  ).length;
  
  if (combinedSeverity && layerOverlap >= 2) {
    return {
      seedId1: seed1.id,
      seedId2: seed2.id,
      relationType: 'AMPLIFYING',
      confidence: 0.65,
      evidence: ['Combined severity escalation', 'Multiple layer overlap']
    };
  }
  
  return null;
}

/**
 * Link new seed to existing failure types
 */
export function linkSeedToFailureTypes(
  seed: PatternSeed,
  failureTypes: FailureType[]
): {
  linkedTypeId: string | null;
  similarity: number;
  isNewPattern: boolean;
} {
  let bestMatch: { typeId: string; similarity: number } | null = null;
  
  for (const ft of failureTypes) {
    // Check if seed matches pattern signatures
    const signatureMatch = ft.patternSignatures.includes(seed.breakpointPattern);
    
    // Calculate layer match
    const layerMatch = ft.systemLayer === seed.originLayer ||
                       seed.impactedLayers.includes(ft.systemLayer);
    
    if (signatureMatch && layerMatch) {
      const similarity = signatureMatch ? 0.8 : 0.5;
      
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { typeId: ft.id, similarity };
      }
    }
  }
  
  // If no good match found, it's a new pattern
  const isNewPattern = !bestMatch || bestMatch.similarity < 0.6;
  
  return {
    linkedTypeId: bestMatch?.typeId || null,
    similarity: bestMatch?.similarity || 0,
    isNewPattern
  };
}

export { CSI_CONFIG };

export default {
  buildCrossSeedIntelligence,
  detectSeedRelations,
  linkSeedToFailureTypes,
  CSI_CONFIG
};