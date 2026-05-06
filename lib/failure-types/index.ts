/**
 * FAILURE TYPE SYSTEM
 * 
 * Core IP Layer of Behind the Protocol (BTP)
 * 
 * Transforms Pattern Seeds into structured, named, repeatable Systems Failure Types.
 * 
 * PATENT-CRITICAL: This system includes proprietary methodologies for:
 * - Pattern clustering and similarity scoring
 * - Failure type naming generation
 * - Decision-safe correction pathways
 * - Cross-seed intelligence linking
 * - Failure evolution tracking
 */

// Core Types
export * from './types';

// Pattern Clustering Engine
export { 
  clusterSeeds, 
  addSeedToClusters, 
  calculateSimilarity,
  isReadyForEvolution 
} from './clustering-engine';

// Naming Engine
export {
  generateFailureTypeName,
  generateAlternativeNames,
  validateName,
  generateFailureTypeDefinition
} from './naming-engine';

// Correction Pathways (PATENT-CRITICAL)
export {
  generateCorrectionPathways,
  validateDecisionSafe,
  getCorrectionsByContext
} from './correction-pathways';

// Evolution Engine
export {
  checkEvolutionReadiness,
  evolveToFailureType,
  trackEvolutionProgress,
  batchEvolve,
  EVOLUTION_CONFIG
} from './evolution-engine';

// Cross-Seed Intelligence
export {
  buildCrossSeedIntelligence,
  detectSeedRelations,
  linkSeedToFailureTypes,
  CSI_CONFIG
} from './cross-seed-intelligence';

/**
 * Full Failure Type Pipeline
 * 
 * Takes raw pattern seeds and produces fully defined FailureTypes
 */
export function runFailureTypePipeline(
  seeds: import('./types').PatternSeed[],
  existingTypes: import('./types').FailureType[] = []
): {
  clusters: import('./types').PatternCluster[];
  failureTypes: import('./types').FailureType[];
  evolutions: import('./types').FailureEvolution[];
  intelligence: import('./types').CrossSeedIntelligence[];
  summary: {
    seedsProcessed: number;
    clustersFormed: number;
    typesEvolved: number;
    typesSkipped: number;
  };
} {
  // Import functions dynamically to avoid circular deps
  const { clusterSeeds } = require('./clustering-engine');
  const { batchEvolve } = require('./evolution-engine');
  const { buildCrossSeedIntelligence } = require('./cross-seed-intelligence');
  
  // Step 1: Cluster seeds
  const clusters = clusterSeeds(seeds);
  
  // Step 2: Evolve clusters to FailureTypes
  const { evolved, evolutions, skipped } = batchEvolve(clusters, existingTypes);
  
  // Step 3: Build cross-seed intelligence for each evolved type
  const intelligence = evolved.map((ft: any) => 
    buildCrossSeedIntelligence(ft, seeds, [])
  );
  
  return {
    clusters,
    failureTypes: evolved,
    evolutions,
    intelligence,
    summary: {
      seedsProcessed: seeds.length,
      clustersFormed: clusters.length,
      typesEvolved: evolved.length,
      typesSkipped: skipped.length
    }
  };
}

/**
 * Quick FailureType Generation
 * 
 * Generate a single FailureType from a set of seeds (for testing/demo)
 */
export function generateFailureTypeFromSeeds(
  seeds: import('./types').PatternSeed[]
): import('./types').FailureType | null {
  const { clusterSeeds } = require('./clustering-engine');
  const { evolveToFailureType } = require('./evolution-engine');
  
  const clusters = clusterSeeds(seeds);
  
  if (clusters.length === 0) {
    return null;
  }
  
  const result = evolveToFailureType(clusters[0]);
  return result.failureType;
}

export default {
  runFailureTypePipeline,
  generateFailureTypeFromSeeds
};