/**
 * BTP Pattern Clustering Engine
 * 
 * Automatically groups Pattern Seeds based on:
 * - Similarity in breakpoint
 * - Similarity in tension
 * - Interaction overlap
 * - User cross-engagement
 * 
 * Output: Cluster → Candidate Failure Type
 */

import type {
  PatternSeed,
  PatternCluster,
  SimilarityScore,
  SystemLayer,
} from './types';

// ==========================================
// CONFIGURATION
// ==========================================

const CLUSTERING_CONFIG = {
  // Similarity threshold for clustering (0-1)
  similarityThreshold: 0.65,
  
  // Minimum seeds to form a cluster
  minSeedsForCluster: 3,
  
  // Minimum cohesion score to become candidate
  cohesionThreshold: 0.7,
  
  // Minimum seeds to evolve to FailureType
  evolutionSeedThreshold: 5,
  
  // Weights for similarity calculation
  weights: {
    breakpoint: 0.35,
    tension: 0.30,
    interactionOverlap: 0.20,
    layerMatch: 0.15,
  },
};

// ==========================================
// SIMILARITY SCORING
// ==========================================

/**
 * Calculate similarity between two pattern seeds
 */
export function calculateSimilarity(seed1: PatternSeed, seed2: PatternSeed): SimilarityScore {
  // Breakpoint similarity
  const breakpointSimilarity = calculateStringSimilarity(seed1.breakpointPattern, seed2.breakpointPattern);
  
  // Tension similarity (compare tension point arrays)
  const tensionSimilarity = calculateArraySimilarity(seed1.tensionPoints || [], seed2.tensionPoints || []);
  
  // Layer match
  const layerMatch = seed1.systemLayer === seed2.systemLayer;
  
  // Interaction overlap
  const interactionOverlap = calculateArraySimilarity(seed1.interactionOverlap || [], seed2.interactionOverlap || []);
  
  // Overall score (weighted combination)
  const overallScore =
    CLUSTERING_CONFIG.weights.breakpoint * breakpointSimilarity +
    CLUSTERING_CONFIG.weights.tension * tensionSimilarity +
    CLUSTERING_CONFIG.weights.interactionOverlap * interactionOverlap +
    CLUSTERING_CONFIG.weights.layerMatch * (layerMatch ? 1 : 0);
  
  return {
    seedId1: seed1.id,
    seedId2: seed2.id,
    breakpointSimilarity,
    tensionSimilarity,
    interactionOverlap,
    layerMatch,
    overallScore,
    shouldCluster: overallScore >= CLUSTERING_CONFIG.similarityThreshold,
  };
}

/**
 * Calculate similarity between two string arrays
 */
function calculateArraySimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1;
  if (arr1.length === 0 || arr2.length === 0) return 0;
  
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));
  
  let intersection = 0;
  for (const item of set1) {
    if (set2.has(item)) intersection++;
  }
  
  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Calculate string similarity using normalized Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Simple Jaccard similarity on word sets
  const words1 = new Set(s1.split(/[_\s]+/));
  const words2 = new Set(s2.split(/[_\s]+/));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// ==========================================
// CLUSTERING ENGINE
// ==========================================

/**
 * Cluster seeds into groups based on similarity
 */
export function clusterSeeds(seeds: PatternSeed[]): PatternCluster[] {
  const clusters: PatternCluster[] = [];
  const assignedSeeds = new Set<string>();
  
  // Build similarity matrix
  const similarityMatrix = buildSimilarityMatrix(seeds);
  
  // Greedy clustering
  for (const seed of seeds) {
    if (assignedSeeds.has(seed.id)) continue;
    
    // Find similar seeds
    const similarSeeds = findSimilarSeeds(seed, seeds, similarityMatrix, assignedSeeds);
    
    if (similarSeeds.length >= CLUSTERING_CONFIG.minSeedsForCluster) {
      // Create cluster
      const cluster = createCluster(similarSeeds);
      clusters.push(cluster);
      
      // Mark seeds as assigned
      similarSeeds.forEach(s => assignedSeeds.add(s.id));
    }
  }
  
  return clusters;
}

/**
 * Build similarity matrix for all seeds
 */
function buildSimilarityMatrix(seeds: PatternSeed[]): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();
  
  for (const seed1 of seeds) {
    const row = new Map<string, number>();
    
    for (const seed2 of seeds) {
      if (seed1.id === seed2.id) {
        row.set(seed2.id, 1);
      } else {
        const similarity = calculateSimilarity(seed1, seed2);
        row.set(seed2.id, similarity.overallScore);
      }
    }
    
    matrix.set(seed1.id, row);
  }
  
  return matrix;
}

/**
 * Find seeds similar to a given seed
 */
function findSimilarSeeds(
  seed: PatternSeed,
  allSeeds: PatternSeed[],
  matrix: Map<string, Map<string, number>>,
  assigned: Set<string>
): PatternSeed[] {
  const similar: PatternSeed[] = [seed];
  const row = matrix.get(seed.id);
  
  if (!row) return similar;
  
  for (const otherSeed of allSeeds) {
    if (otherSeed.id === seed.id) continue;
    if (assigned.has(otherSeed.id)) continue;
    
    const similarity = row.get(otherSeed.id) || 0;
    
    if (similarity >= CLUSTERING_CONFIG.similarityThreshold) {
      similar.push(otherSeed);
    }
  }
  
  return similar;
}

/**
 * Create a cluster from similar seeds
 */
function createCluster(seeds: PatternSeed[]): PatternCluster {
  const now = new Date();
  
  // Calculate dominant characteristics
  const dominantBreakpoint = findDominantValue(seeds.map(s => s.breakpointPattern));
  const dominantTension = findDominantValue(seeds.flatMap(s => s.tensionPoints || []));
  const dominantLayer = findDominantValue(seeds.map(s => s.systemLayer));
  
  // Calculate layer distribution
  const layerDistribution = calculateLayerDistribution(seeds);
  
  // Calculate cohesion score
  const cohesionScore = calculateCohesion(seeds);
  
  // Calculate diversity score (how diverse are the sources)
  const diversityScore = calculateDiversity(seeds);
  
  // Determine status
  const status = determineClusterStatus(seeds.length, cohesionScore);
  
  return {
    id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    seeds,
    seedIds: seeds.map(s => s.id),
    primaryBreakpoint: dominantBreakpoint,
    primaryTension: dominantTension,
    layerDistribution,
    cohesionScore,
    diversityScore,
    status,
  };
}

/**
 * Calculate layer distribution for a cluster
 */
function calculateLayerDistribution(seeds: PatternSeed[]): Record<SystemLayer, number> {
  const distribution: Record<SystemLayer, number> = {
    PATIENT: 0,
    SITE: 0,
    CRO: 0,
    SPONSOR: 0
  };
  
  for (const seed of seeds) {
    distribution[seed.systemLayer]++;
  }
  
  // Normalize to 0-1
  const total = seeds.length;
  if (total > 0) {
    for (const layer of Object.keys(distribution) as SystemLayer[]) {
      distribution[layer] = distribution[layer] / total;
    }
  }
  
  return distribution;
}

/**
 * Find the most common value in an array
 */
function findDominantValue<T>(values: T[]): T {
  const counts = new Map<T, number>();
  
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  
  let maxCount = 0;
  let dominant: T = values[0];
  
  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      dominant = value;
    }
  }
  
  return dominant;
}

/**
 * Calculate cohesion score for a cluster
 */
function calculateCohesion(seeds: PatternSeed[]): number {
  if (seeds.length < 2) return 1;
  
  let totalSimilarity = 0;
  let pairs = 0;
  
  for (let i = 0; i < seeds.length; i++) {
    for (let j = i + 1; j < seeds.length; j++) {
      const similarity = calculateSimilarity(seeds[i], seeds[j]);
      totalSimilarity += similarity.overallScore;
      pairs++;
    }
  }
  
  return pairs > 0 ? totalSimilarity / pairs : 1;
}

/**
 * Calculate diversity score (different sources)
 */
function calculateDiversity(seeds: PatternSeed[]): number {
  // Based on layer spread and origin diversity
  const layers = new Set(seeds.map(s => s.systemLayer));
  const origins = new Set(seeds.map(s => s.originLayer));
  
  // More layers and more origins = higher diversity
  const layerScore = Math.min(layers.size / 4, 1);
  const originScore = Math.min(origins.size / 4, 1);
  
  return (layerScore * 0.5 + originScore * 0.5);
}

/**
 * Determine cluster status based on metrics
 */
function determineClusterStatus(
  seedCount: number,
  cohesionScore: number
): 'forming' | 'stable' | 'candidate' | 'evolved' {
  if (seedCount >= CLUSTERING_CONFIG.evolutionSeedThreshold && 
      cohesionScore >= CLUSTERING_CONFIG.cohesionThreshold) {
    return 'candidate';
  }
  
  if (cohesionScore >= CLUSTERING_CONFIG.cohesionThreshold) {
    return 'stable';
  }
  
  return 'forming';
}

// ==========================================
// CLUSTER EVOLUTION
// ==========================================

/**
 * Check if a cluster is ready to evolve to a FailureType
 */
export function isReadyForEvolution(cluster: PatternCluster): boolean {
  return (
    cluster.status === 'candidate' &&
    cluster.seeds.length >= CLUSTERING_CONFIG.evolutionSeedThreshold &&
    cluster.cohesionScore >= CLUSTERING_CONFIG.cohesionThreshold
  );
}

/**
 * Get clusters ready for evolution
 */
export function getEvolutionReadyClusters(clusters: PatternCluster[]): PatternCluster[] {
  return clusters.filter(isReadyForEvolution);
}

// ==========================================
// INCREMENTAL CLUSTERING
// ==========================================

/**
 * Add a new seed to existing clusters or create new cluster
 */
export function addSeedToClusters(
  seed: PatternSeed,
  existingClusters: PatternCluster[],
  allSeeds: PatternSeed[]
): { clusters: PatternCluster[]; newCluster: boolean } {
  let bestCluster: PatternCluster | null = null;
  let bestScore = 0;
  
  // Find best matching cluster
  for (const cluster of existingClusters) {
    // Calculate average similarity to cluster seeds
    const clusterSeeds = allSeeds.filter(s => cluster.seedIds.includes(s.id));
    let totalSimilarity = 0;
    
    for (const clusterSeed of clusterSeeds) {
      const similarity = calculateSimilarity(seed, clusterSeed);
      totalSimilarity += similarity.overallScore;
    }
    
    const avgSimilarity = clusterSeeds.length > 0 ? totalSimilarity / clusterSeeds.length : 0;
    
    if (avgSimilarity > bestScore && avgSimilarity >= CLUSTERING_CONFIG.similarityThreshold) {
      bestScore = avgSimilarity;
      bestCluster = cluster;
    }
  }
  
  if (bestCluster) {
    // Add to existing cluster
    bestCluster.seedIds.push(seed.id);
    bestCluster.seeds.push(seed);
    
    // Recalculate layer distribution
    bestCluster.layerDistribution = calculateLayerDistribution(bestCluster.seeds);
    
    // Re-evaluate status
    bestCluster.cohesionScore = calculateCohesion(bestCluster.seeds);
    bestCluster.status = determineClusterStatus(bestCluster.seeds.length, bestCluster.cohesionScore);
    
    return { clusters: existingClusters, newCluster: false };
  }
  
  // Create new cluster (if enough seeds)
  const similarSeeds = allSeeds.filter(s => {
    const similarity = calculateSimilarity(seed, s);
    return similarity.overallScore >= CLUSTERING_CONFIG.similarityThreshold;
  });
  
  if (similarSeeds.length >= CLUSTERING_CONFIG.minSeedsForCluster) {
    const newCluster = createCluster(similarSeeds);
    return { clusters: [...existingClusters, newCluster], newCluster: true };
  }
  
  // Not enough seeds to cluster
  return { clusters: existingClusters, newCluster: false };
}

export { CLUSTERING_CONFIG };