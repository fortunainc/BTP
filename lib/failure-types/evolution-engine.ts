/**
 * FAILURE EVOLUTION ENGINE
 * 
 * Manages the conversion of PatternClusters to FailureTypes
 * Tracks evolution stages and maintains audit trail
 */

import {
  PatternCluster,
  FailureType,
  FailureEvolution,
  SystemLayer,
  SeverityLevel
} from './types';
import { generateFailureTypeName, generateFailureTypeDefinition } from './naming-engine';
import { generateCorrectionPathways } from './correction-pathways';

/**
 * Evolution stages
 */
export type EvolutionStage = 
  | 'SEED'           // Single seed detected
  | 'CLUSTERING'     // Multiple seeds, forming cluster
  | 'EMERGING'       // Cluster approaching threshold
  | 'READY'          // Ready for evolution
  | 'EVOLVED'        // Has become FailureType
  | 'MATURE';        // Established FailureType with significant data

/**
 * Evolution configuration
 */
const EVOLUTION_CONFIG = {
  minSeedsForEvolution: 5,
  cohesionThreshold: 0.7,
  frequencyThreshold: 3,      // Minimum occurrences across contributions
  layerSpreadThreshold: 0.4,  // If single layer > 40%, it's layer-specific
  maturityThreshold: 20,       // Seeds to reach mature status
};

/**
 * Check if a cluster is ready to evolve into a FailureType
 */
export function checkEvolutionReadiness(cluster: PatternCluster): {
  ready: boolean;
  stage: EvolutionStage;
  gaps: string[];
  metrics: {
    seedCount: number;
    cohesion: number;
    frequency: number;
    layerSpread: number;
  };
} {
  const metrics = {
    seedCount: cluster.seeds.length,
    cohesion: cluster.cohesionScore,
    frequency: cluster.seeds.reduce((sum, s) => sum + s.frequency, 0),
    layerSpread: Math.max(...Object.values(cluster.layerDistribution))
  };
  
  const gaps: string[] = [];
  let stage: EvolutionStage = 'SEED';
  
  // Determine stage based on metrics
  if (metrics.seedCount === 1) {
    stage = 'SEED';
    gaps.push('Need more seeds to form cluster');
  } else if (metrics.seedCount < EVOLUTION_CONFIG.minSeedsForEvolution) {
    stage = 'CLUSTERING';
    gaps.push(`Need ${EVOLUTION_CONFIG.minSeedsForEvolution - metrics.seedCount} more seeds`);
  } else if (metrics.cohesion < EVOLUTION_CONFIG.cohesionThreshold) {
    stage = 'EMERGING';
    gaps.push(`Cohesion too low (${metrics.cohesion.toFixed(2)}), need ${EVOLUTION_CONFIG.cohesionThreshold}`);
  } else {
    stage = 'READY';
  }
  
  // Check for ready status
  const ready = 
    metrics.seedCount >= EVOLUTION_CONFIG.minSeedsForEvolution &&
    metrics.cohesion >= EVOLUTION_CONFIG.cohesionThreshold;
  
  if (!ready && metrics.seedCount >= EVOLUTION_CONFIG.minSeedsForEvolution) {
    gaps.push('Cluster not yet meeting evolution criteria');
  }
  
  return {
    ready,
    stage,
    gaps,
    metrics
  };
}

/**
 * Evolve a cluster into a FailureType
 */
export function evolveToFailureType(
  cluster: PatternCluster,
  existingTypes: FailureType[] = []
): {
  failureType: FailureType | null;
  evolution: FailureEvolution;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check readiness
  const readiness = checkEvolutionReadiness(cluster);
  
  if (!readiness.ready) {
    return {
      failureType: null,
      evolution: {
        clusterId: cluster.id,
        stage: readiness.stage,
        seedContributions: cluster.seeds.map(s => s.id),
        evolutionTrigger: null,
        evolutionDate: null
      },
      warnings: [...readiness.gaps, 'Cluster not ready for evolution']
    };
  }
  
  // Generate name and definition
  const { name } = generateFailureTypeName(cluster);
  const definition = generateFailureTypeDefinition(cluster);
  
  // Check for name conflicts
  const nameConflict = existingTypes.find(
    t => t.name.toLowerCase() === name.toLowerCase()
  );
  
  if (nameConflict) {
    warnings.push(`Name "${name}" conflicts with existing type. Generating alternative.`);
    // Generate alternative would go here in production
  }
  
  // Extract pattern signatures from cluster
  const patternSignatures = extractPatternSignatures(cluster);
  
  // Determine severity from cluster
  const severityLevel = determineSeverity(cluster);
  
  // Calculate frequency and emergence velocity
  const frequencyScore = calculateFrequencyScore(cluster);
  const emergenceVelocity = determineEmergenceVelocity(cluster);
  
  // Create FailureType
  const failureType: FailureType = {
    id: `ft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    definition: definition.definition,
    patternSignatures,
    contributingFactors: extractContributingFactors(cluster),
    systemLayer: determinePrimaryLayer(cluster),
    severityLevel,
    frequencyScore,
    emergenceVelocity,
    linkedSeeds: cluster.seeds.map(s => s.id),
    correctionPathways: null, // Generated separately
    createdAt: new Date(),
    lastUpdated: new Date()
  };
  
  // Generate correction pathways
  failureType.correctionPathways = generateCorrectionPathways(failureType);
  
  // Create evolution record
  const evolution: FailureEvolution = {
    clusterId: cluster.id,
    stage: 'EVOLVED',
    seedContributions: cluster.seeds.map(s => s.id),
    evolutionTrigger: {
      seedCount: cluster.seeds.length,
      cohesionScore: cluster.cohesionScore,
      patternConsistency: cluster.cohesionScore,
      threshold: EVOLUTION_CONFIG.minSeedsForEvolution
    },
    evolutionDate: new Date()
  };
  
  return {
    failureType,
    evolution,
    warnings
  };
}

/**
 * Extract pattern signatures from cluster
 */
function extractPatternSignatures(cluster: PatternCluster): string[] {
  const signatures = new Set<string>();
  
  // Primary breakpoint is always included
  signatures.add(cluster.primaryBreakpoint);
  
  // Add common breakpoints across seeds
  const breakpointCounts: Record<string, number> = {};
  for (const seed of cluster.seeds) {
    const bp = seed.breakpointPattern;
    breakpointCounts[bp] = (breakpointCounts[bp] || 0) + 1;
  }
  
  // Include breakpoints that appear in > 30% of seeds
  const threshold = cluster.seeds.length * 0.3;
  for (const [bp, count] of Object.entries(breakpointCounts)) {
    if (count >= threshold) {
      signatures.add(bp);
    }
  }
  
  return Array.from(signatures);
}

/**
 * Determine severity level from cluster
 */
function determineSeverity(cluster: PatternCluster): SeverityLevel {
  const severityScores = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
  };
  
  const totalScore = cluster.seeds.reduce((sum, seed) => {
    return sum + severityScores[seed.severityLevel];
  }, 0);
  
  const avgScore = totalScore / cluster.seeds.length;
  
  // Weighted by the highest severity seeds
  const hasCritical = cluster.seeds.some(s => s.severityLevel === 'CRITICAL');
  const hasHigh = cluster.seeds.some(s => s.severityLevel === 'HIGH');
  
  if (hasCritical && avgScore >= 3) return 'CRITICAL';
  if (hasHigh || avgScore >= 2.5) return 'HIGH';
  if (avgScore >= 1.5) return 'MEDIUM';
  return 'LOW';
}

/**
 * Calculate frequency score (0-1)
 */
function calculateFrequencyScore(cluster: PatternCluster): number {
  const totalFrequency = cluster.seeds.reduce((sum, s) => sum + s.frequency, 0);
  const maxPossibleFrequency = cluster.seeds.length * 10; // Assuming max 10 per seed
  
  return Math.min(1, totalFrequency / maxPossibleFrequency);
}

/**
 * Determine emergence velocity
 */
function determineEmergenceVelocity(cluster: PatternCluster): 'SUDDEN' | 'GRADUAL' | 'RECURRING' {
  const velocities = cluster.seeds.map(s => s.emergenceVelocity);
  
  const counts = {
    SUDDEN: velocities.filter(v => v === 'SUDDEN').length,
    GRADUAL: velocities.filter(v => v === 'GRADUAL').length,
    RECURRING: velocities.filter(v => v === 'RECURRING').length
  };
  
  // Find dominant velocity
  const max = Math.max(counts.SUDDEN, counts.GRADUAL, counts.RECURRING);
  
  if (counts.RECURRING === max) return 'RECURRING';
  if (counts.SUDDEN === max) return 'SUDDEN';
  return 'GRADUAL';
}

/**
 * Extract contributing factors from cluster
 */
function extractContributingFactors(cluster: PatternCluster): string[] {
  const factorCounts: Record<string, number> = {};
  
  for (const seed of cluster.seeds) {
    for (const factor of seed.contributingFactors) {
      factorCounts[factor] = (factorCounts[factor] || 0) + 1;
    }
  }
  
  // Return factors that appear in > 20% of seeds
  const threshold = cluster.seeds.length * 0.2;
  return Object.entries(factorCounts)
    .filter(([_, count]) => count >= threshold)
    .map(([factor]) => factor);
}

/**
 * Determine primary system layer
 */
function determinePrimaryLayer(cluster: PatternCluster): SystemLayer {
  const distribution = cluster.layerDistribution;
  
  const sorted = Object.entries(distribution)
    .sort(([,a], [,b]) => b - a);
  
  return sorted[0]?.[0] as SystemLayer || 'SITE';
}

/**
 * Track evolution progress for a cluster
 */
export function trackEvolutionProgress(
  cluster: PatternCluster,
  existingEvolutions: FailureEvolution[]
): {
  currentStage: EvolutionStage;
  progressToNextStage: number;
  estimatedSeedsNeeded: number;
} {
  const readiness = checkEvolutionReadiness(cluster);
  
  const progressToNextStage = Math.min(1,
    (cluster.seeds.length / EVOLUTION_CONFIG.minSeedsForEvolution) * 0.5 +
    (cluster.cohesionScore / EVOLUTION_CONFIG.cohesionThreshold) * 0.5
  );
  
  const estimatedSeedsNeeded = Math.max(0,
    EVOLUTION_CONFIG.minSeedsForEvolution - cluster.seeds.length
  );
  
  return {
    currentStage: readiness.stage,
    progressToNextStage,
    estimatedSeedsNeeded
  };
}

/**
 * Batch evolve multiple clusters
 */
export function batchEvolve(
  clusters: PatternCluster[],
  existingTypes: FailureType[] = []
): {
  evolved: FailureType[];
  evolutions: FailureEvolution[];
  skipped: { cluster: PatternCluster; reason: string }[];
} {
  const evolved: FailureType[] = [];
  const evolutions: FailureEvolution[] = [];
  const skipped: { cluster: PatternCluster; reason: string }[] = [];
  
  for (const cluster of clusters) {
    const result = evolveToFailureType(cluster, [...existingTypes, ...evolved]);
    
    if (result.failureType) {
      evolved.push(result.failureType);
      evolutions.push(result.evolution);
    } else {
      skipped.push({
        cluster,
        reason: result.warnings.join('; ')
      });
    }
  }
  
  return { evolved, evolutions, skipped };
}

export { EVOLUTION_CONFIG };

export default {
  checkEvolutionReadiness,
  evolveToFailureType,
  trackEvolutionProgress,
  batchEvolve,
  EVOLUTION_CONFIG
};