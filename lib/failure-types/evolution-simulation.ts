/**
 * EVOLUTION SIMULATION
 * 
 * Demonstrates how Pattern Seeds evolve into FailureTypes
 * Shows the full pipeline from seed detection to mature FailureType
 */

import { PatternSeed, PatternCluster, FailureType, FailureEvolution } from './types';
import { clusterSeeds, calculateSimilarity } from './clustering-engine';
import { evolveToFailureType, checkEvolutionReadiness } from './evolution-engine';
import { generateFailureTypeName } from './naming-engine';

/**
 * Sample Pattern Seeds for simulation
 * These represent extracted patterns from operator contributions
 */
const SAMPLE_SEEDS: PatternSeed[] = [
  // Consent-related seeds
  {
    id: 'seed-001',
    breakpointPattern: 'CONSENT_GAP',
    tensionPoints: ['Time pressure during enrollment', 'Language barriers'],
    interactionOverlap: ['Site-Patient', 'PI-Coordinator'],
    contributingFactors: ['Inadequate consent training', 'Complex protocol language'],
    systemLayer: 'SITE',
    severityLevel: 'HIGH',
    frequency: 5,
    emergenceVelocity: 'GRADUAL',
    originLayer: 'SITE',
    impactedLayers: ['PATIENT', 'SITE'],
    contextTags: ['enrollment', 'consent', 'training'],
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'seed-002',
    breakpointPattern: 'CONSENT_GAP',
    tensionPoints: ['Proxy consent ambiguity', 'Capacity assessment gaps'],
    interactionOverlap: ['Site-Patient', 'Site-IRB'],
    contributingFactors: ['Proxy consent policy unclear', 'Capacity assessment training gap'],
    systemLayer: 'SITE',
    severityLevel: 'HIGH',
    frequency: 3,
    emergenceVelocity: 'GRADUAL',
    originLayer: 'SITE',
    impactedLayers: ['PATIENT', 'SITE', 'CRO'],
    contextTags: ['consent', 'capacity', 'proxy'],
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'seed-003',
    breakpointPattern: 'COMPETENCE_GAP',
    tensionPoints: ['Consent process ownership', 'Verification responsibility'],
    interactionOverlap: ['PI-Coordinator', 'Site-QA'],
    contributingFactors: ['Consent training completion vs. comprehension gap'],
    systemLayer: 'SITE',
    severityLevel: 'MEDIUM',
    frequency: 4,
    emergenceVelocity: 'GRADUAL',
    originLayer: 'SITE',
    impactedLayers: ['SITE'],
    contextTags: ['consent', 'training', 'competence'],
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'seed-004',
    breakpointPattern: 'CONSENT_GAP',
    tensionPoints: ['Re-consent timing', 'Amendment communication'],
    interactionOverlap: ['Site-Sponsor', 'Site-IRB'],
    contributingFactors: ['Amendment fatigue', 'Re-consent workflow gaps'],
    systemLayer: 'SITE',
    severityLevel: 'MEDIUM',
    frequency: 6,
    emergenceVelocity: 'RECURRING',
    originLayer: 'SPONSOR',
    impactedLayers: ['SITE', 'PATIENT'],
    contextTags: ['consent', 'amendment', 're-consent'],
    createdAt: new Date('2024-02-10')
  },
  {
    id: 'seed-005',
    breakpointPattern: 'DOCUMENTATION_GAP',
    tensionPoints: ['Consent documentation completeness', 'Version control'],
    interactionOverlap: ['Site-Monitor', 'Site-QA'],
    contributingFactors: ['Documentation training gaps', 'Version management confusion'],
    systemLayer: 'SITE',
    severityLevel: 'MEDIUM',
    frequency: 4,
    emergenceVelocity: 'GRADUAL',
    originLayer: 'SITE',
    impactedLayers: ['SITE', 'CRO'],
    contextTags: ['consent', 'documentation', 'version-control'],
    createdAt: new Date('2024-02-15')
  },
  
  // Data integrity seeds
  {
    id: 'seed-006',
    breakpointPattern: 'DATA_INTEGRITY',
    tensionPoints: ['Source verification delays', 'Query resolution backlog'],
    interactionOverlap: ['Site-DM', 'Site-Monitor'],
    contributingFactors: ['Time pressure on data entry', 'Inadequate source verification'],
    systemLayer: 'SITE',
    severityLevel: 'HIGH',
    frequency: 7,
    emergenceVelocity: 'GRADUAL',
    originLayer: 'SITE',
    impactedLayers: ['SITE', 'CRO', 'SPONSOR'],
    contextTags: ['data', 'query', 'verification'],
    createdAt: new Date('2024-01-25')
  },
  {
    id: 'seed-007',
    breakpointPattern: 'DATA_INTEGRITY',
    tensionPoints: ['EDC validation gaps', 'Cross-field consistency'],
    interactionOverlap: ['Site-DM', 'Site-Programmer'],
    contributingFactors: ['System validation gaps', 'Edit check limitations'],
    systemLayer: 'SITE',
    severityLevel: 'MEDIUM',
    frequency: 5,
    emergenceVelocity: 'GRADUAL',
    originLayer: 'SITE',
    impactedLayers: ['SITE', 'CRO'],
    contextTags: ['data', 'edc', 'validation'],
    createdAt: new Date('2024-02-05')
  },
  {
    id: 'seed-008',
    breakpointPattern: 'DOCUMENTATION_GAP',
    tensionPoints: ['Real-time documentation', 'Retrospective completion'],
    interactionOverlap: ['Site-Coordinator', 'Site-PI'],
    contributingFactors: ['Time pressure', 'Competing priorities'],
    systemLayer: 'SITE',
    severityLevel: 'HIGH',
    frequency: 8,
    emergenceVelocity: 'RECURRING',
    originLayer: 'SITE',
    impactedLayers: ['SITE'],
    contextTags: ['documentation', 'time-pressure', 'source-data'],
    createdAt: new Date('2024-02-12')
  },
  
  // Deviation seeds
  {
    id: 'seed-009',
    breakpointPattern: 'DEVIATION_ABSORPTION',
    tensionPoints: ['Deviation reporting threshold', 'Normalization over time'],
    interactionOverlap: ['Site-QA', 'Site-PI'],
    contributingFactors: ['Deviation normalization', 'Unclear escalation thresholds'],
    systemLayer: 'SITE',
    severityLevel: 'CRITICAL',
    frequency: 4,
    emergenceVelocity: 'RECURRING',
    originLayer: 'SITE',
    impactedLayers: ['SITE', 'CRO', 'SPONSOR'],
    contextTags: ['deviation', 'escalation', 'normalization'],
    createdAt: new Date('2024-01-30')
  },
  {
    id: 'seed-010',
    breakpointPattern: 'DEVIATION_ABSORPTION',
    tensionPoints: ['Protocol flexibility interpretation', 'Workaround culture'],
    interactionOverlap: ['Site-PI', 'Site-Coordinator'],
    contributingFactors: ['Workaround culture', 'Protocol design-reality gap'],
    systemLayer: 'SITE',
    severityLevel: 'HIGH',
    frequency: 6,
    emergenceVelocity: 'RECURRING',
    originLayer: 'SITE',
    impactedLayers: ['SITE', 'PATIENT'],
    contextTags: ['deviation', 'protocol', 'workaround'],
    createdAt: new Date('2024-02-08')
  },
  
  // Oversight seeds
  {
    id: 'seed-011',
    breakpointPattern: 'OVERSIGHT_GAP',
    tensionPoints: ['Monitoring visit frequency', 'Between-visit oversight'],
    interactionOverlap: ['Site-Monitor', 'CRO-QA'],
    contributingFactors: ['Remote monitoring limitations', 'Resource constraints'],
    systemLayer: 'CRO',
    severityLevel: 'HIGH',
    frequency: 5,
    emergenceVelocity: 'GRADUAL',
    originLayer: 'CRO',
    impactedLayers: ['SITE', 'CRO'],
    contextTags: ['oversight', 'monitoring', 'remote'],
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'seed-012',
    breakpointPattern: 'OVERSIGHT_GAP',
    tensionPoints: ['Escalation pathway clarity', 'Decision authority'],
    interactionOverlap: ['CRO-Sponsor', 'Site-CRO'],
    contributingFactors: ['Role confusion', 'Information asymmetry'],
    systemLayer: 'CRO',
    severityLevel: 'MEDIUM',
    frequency: 4,
    emergenceVelocity: 'GRADUAL',
    originLayer: 'CRO',
    impactedLayers: ['SITE', 'CRO', 'SPONSOR'],
    contextTags: ['oversight', 'escalation', 'authority'],
    createdAt: new Date('2024-02-10')
  }
];

/**
 * Simulation result type
 */
export interface SimulationResult {
  stages: SimulationStage[];
  finalClusters: PatternCluster[];
  evolvedTypes: FailureType[];
  timeline: {
    stage: string;
    date: Date;
    description: string;
  }[];
  summary: {
    totalSeeds: number;
    clustersFormed: number;
    typesEvolved: number;
    averageCohesion: number;
  };
}

/**
 * Single simulation stage
 */
export interface SimulationStage {
  stageName: string;
  inputSeeds: PatternSeed[];
  outputClusters: PatternCluster[];
  outputTypes: FailureType[];
  metrics: {
    cohesion: number;
    seedCount: number;
    evolutionReadiness: number;
  };
}

/**
 * Run the evolution simulation
 */
export function runEvolutionSimulation(seeds: PatternSeed[] = SAMPLE_SEEDS): SimulationResult {
  const stages: SimulationStage[] = [];
  const timeline: { stage: string; date: Date; description: string }[] = [];
  const allClusters: PatternCluster[] = [];
  const allTypes: FailureType[] = [];
  
  // Stage 1: Initial seed collection (first 3 seeds)
  const stage1Seeds = seeds.slice(0, 3);
  const stage1Clusters = clusterSeeds(stage1Seeds);
  stages.push({
    stageName: 'Initial Seed Collection',
    inputSeeds: stage1Seeds,
    outputClusters: stage1Clusters,
    outputTypes: [],
    metrics: {
      cohesion: stage1Clusters[0]?.cohesionScore || 0,
      seedCount: stage1Seeds.length,
      evolutionReadiness: 0
    }
  });
  timeline.push({
    stage: 'SEED_COLLECTION',
    date: new Date('2024-01-15'),
    description: `${stage1Seeds.length} seeds detected, ${stage1Clusters.length} clusters forming`
  });
  
  // Stage 2: Cluster formation (5 seeds)
  const stage2Seeds = seeds.slice(0, 5);
  const stage2Clusters = clusterSeeds(stage2Seeds);
  stages.push({
    stageName: 'Cluster Formation',
    inputSeeds: stage2Seeds,
    outputClusters: stage2Clusters,
    outputTypes: [],
    metrics: {
      cohesion: stage2Clusters[0]?.cohesionScore || 0,
      seedCount: stage2Seeds.length,
      evolutionReadiness: stage2Clusters.filter(c => checkEvolutionReadiness(c).ready).length
    }
  });
  timeline.push({
    stage: 'CLUSTERING',
    date: new Date('2024-02-01'),
    description: `${stage2Seeds.length} seeds, ${stage2Clusters.length} clusters, cohesion improving`
  });
  
  // Stage 3: Emerging patterns (8 seeds)
  const stage3Seeds = seeds.slice(0, 8);
  const stage3Clusters = clusterSeeds(stage3Seeds);
  stages.push({
    stageName: 'Emerging Patterns',
    inputSeeds: stage3Seeds,
    outputClusters: stage3Clusters,
    outputTypes: [],
    metrics: {
      cohesion: stage3Clusters[0]?.cohesionScore || 0,
      seedCount: stage3Seeds.length,
      evolutionReadiness: stage3Clusters.filter(c => checkEvolutionReadiness(c).ready).length
    }
  });
  timeline.push({
    stage: 'EMERGING',
    date: new Date('2024-02-10'),
    description: `Pattern coherence increasing, approaching evolution threshold`
  });
  
  // Stage 4: Evolution ready (10 seeds)
  const stage4Seeds = seeds.slice(0, 10);
  const stage4Clusters = clusterSeeds(stage4Seeds);
  const stage4Types: FailureType[] = [];
  
  for (const cluster of stage4Clusters) {
    const readiness = checkEvolutionReadiness(cluster);
    if (readiness.ready) {
      const result = evolveToFailureType(cluster, stage4Types);
      if (result.failureType) {
        stage4Types.push(result.failureType);
        allTypes.push(result.failureType);
      }
    }
  }
  
  stages.push({
    stageName: 'Evolution Ready',
    inputSeeds: stage4Seeds,
    outputClusters: stage4Clusters,
    outputTypes: stage4Types,
    metrics: {
      cohesion: stage4Clusters[0]?.cohesionScore || 0,
      seedCount: stage4Seeds.length,
      evolutionReadiness: stage4Clusters.filter(c => checkEvolutionReadiness(c).ready).length
    }
  });
  timeline.push({
    stage: 'EVOLUTION',
    date: new Date('2024-02-15'),
    description: `${stage4Types.length} FailureType(s) evolved from clusters`
  });
  
  // Stage 5: Full maturity (all seeds)
  const stage5Clusters = clusterSeeds(seeds);
  const stage5Types: FailureType[] = [...allTypes];
  
  for (const cluster of stage5Clusters) {
    const readiness = checkEvolutionReadiness(cluster);
    if (readiness.ready) {
      const existingNames = stage5Types.map(t => t.name);
      const result = evolveToFailureType(cluster, stage5Types);
      if (result.failureType && !existingNames.includes(result.failureType.name)) {
        stage5Types.push(result.failureType);
      }
    }
  }
  
  stages.push({
    stageName: 'Full Maturity',
    inputSeeds: seeds,
    outputClusters: stage5Clusters,
    outputTypes: stage5Types,
    metrics: {
      cohesion: stage5Clusters.reduce((sum, c) => sum + c.cohesionScore, 0) / stage5Clusters.length,
      seedCount: seeds.length,
      evolutionReadiness: stage5Clusters.filter(c => checkEvolutionReadiness(c).ready).length
    }
  });
  timeline.push({
    stage: 'MATURE',
    date: new Date('2024-02-20'),
    description: `${stage5Types.length} mature FailureTypes, full cross-seed intelligence`
  });
  
  return {
    stages,
    finalClusters: stage5Clusters,
    evolvedTypes: stage5Types,
    timeline,
    summary: {
      totalSeeds: seeds.length,
      clustersFormed: stage5Clusters.length,
      typesEvolved: stage5Types.length,
      averageCohesion: stage5Clusters.reduce((sum, c) => sum + c.cohesionScore, 0) / stage5Clusters.length
    }
  };
}

/**
 * Generate simulation report
 */
export function generateSimulationReport(result: SimulationResult): string {
  const lines: string[] = [
    '# Failure Type Evolution Simulation Report',
    '',
    '## Summary',
    `- Total Seeds Processed: ${result.summary.totalSeeds}`,
    `- Clusters Formed: ${result.summary.clustersFormed}`,
    `- FailureTypes Evolved: ${result.summary.typesEvolved}`,
    `- Average Cluster Cohesion: ${result.summary.averageCohesion.toFixed(2)}`,
    '',
    '## Evolution Timeline',
    ''
  ];
  
  for (const event of result.timeline) {
    lines.push(`### ${event.stage}`);
    lines.push(`- **Date**: ${event.date.toISOString().split('T')[0]}`);
    lines.push(`- **Description**: ${event.description}`);
    lines.push('');
  }
  
  lines.push('## Evolved Failure Types');
  lines.push('');
  
  for (const ft of result.evolvedTypes) {
    lines.push(`### ${ft.name}`);
    lines.push(`- **ID**: ${ft.id}`);
    lines.push(`- **Definition**: ${ft.definition}`);
    lines.push(`- **System Layer**: ${ft.systemLayer}`);
    lines.push(`- **Severity**: ${ft.severityLevel}`);
    lines.push(`- **Pattern Signatures**: ${ft.patternSignatures.join(', ')}`);
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Export sample seeds for testing
 */
export { SAMPLE_SEEDS };

export default {
  runEvolutionSimulation,
  generateSimulationReport,
  SAMPLE_SEEDS
};