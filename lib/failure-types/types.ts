/**
 * BTP Failure Type System - Core IP Layer
 * 
 * This module defines the core types for the Failure Type system,
 * which transforms Pattern Seeds into structured, named, repeatable
 * Systems Failure Types.
 * 
 * ARCHITECTURE PRINCIPLES:
 * - NO raw content in FailureTypes (anonymity)
 * - NO attribution to individuals or sites
 * - Decision-safe correction pathways
 * - Patent-critical: Correction Pathway Engine
 */

// ==========================================
// SYSTEM LAYERS
// ==========================================

export type SystemLayer = 
  | 'PATIENT'    // Patient-level failures
  | 'SITE'       // Site-level failures
  | 'CRO'        // CRO-level failures
  | 'SPONSOR';   // Sponsor-level failures

// ==========================================
// SEVERITY LEVELS
// ==========================================

export type SeverityLevel = 
  | 'CRITICAL'   // Immediate safety or data integrity risk
  | 'HIGH'       // Significant operational impact
  | 'MEDIUM'     // Notable efficiency/quality impact
  | 'LOW';       // Minor operational friction

// ==========================================
// EMERGENCE VELOCITY
// ==========================================

export type EmergenceVelocity =
  | 'SUDDEN'     // Appears suddenly, without warning
  | 'GRADUAL'    // Builds over time
  | 'RECURRING'; // Repeats periodically

// ==========================================
// PATTERN SEED
// ==========================================

/**
 * PatternSeed represents a raw, anonymized pattern extracted
 * from user contributions. These are the atomic building blocks
 * that get clustered into FailureTypes.
 */
export interface PatternSeed {
  id: string;
  
  // Extracted Pattern Elements (fully anonymized)
  breakpointPattern: string;      // e.g., "CONSENT_GAP"
  tensionPoints: string[];        // e.g., ["Time pressure", "Language barriers"]
  interactionOverlap: string[];   // e.g., ["Site-Patient", "PI-Coordinator"]
  
  // Contributing factors
  contributingFactors: string[];
  
  // System context
  systemLayer: SystemLayer;
  originLayer: SystemLayer;
  impactedLayers: SystemLayer[];
  
  // Severity and frequency
  severityLevel: SeverityLevel;
  frequency: number;
  emergenceVelocity: EmergenceVelocity;
  
  // Context tags for searchability
  contextTags: string[];
  
  // Timestamps
  createdAt: Date;
  
  // Evolution State
  clusterId?: string;
  failureTypeId?: string;
}

// ==========================================
// PATTERN CLUSTER
// ==========================================

/**
 * PatternCluster represents a group of similar PatternSeeds
 * that are candidates for becoming a FailureType.
 */
export interface PatternCluster {
  id: string;
  
  // Cluster Composition
  seeds: PatternSeed[];
  seedIds: string[];
  
  // Cluster Characteristics
  primaryBreakpoint: string;
  primaryTension: string;
  
  // Layer Distribution
  layerDistribution: Record<SystemLayer, number>;
  
  // Similarity Metrics
  cohesionScore: number;        // 0-1, how similar seeds are
  diversityScore: number;       // 0-1, how diverse sources are
  
  // Evolution Status
  status: 'forming' | 'stable' | 'candidate' | 'evolved';
  candidateName?: string;
}

// ==========================================
// FAILURE TYPE
// ==========================================

/**
 * FailureType is the core IP output - a structured, named,
 * repeatable, non-attributable representation of a systems failure.
 */
export interface FailureType {
  id: string;
  name: string;                    // e.g., "Consent Illusion"
  definition: string;
  
  // Pattern signatures (what patterns this type captures)
  patternSignatures: string[];
  
  // Contributing factors
  contributingFactors: string[];
  
  // Classification
  systemLayer: SystemLayer;
  severityLevel: SeverityLevel;
  
  // Metrics
  frequencyScore: number;          // 0-1
  emergenceVelocity: EmergenceVelocity;
  
  // Relations
  linkedSeeds: string[];           // IDs of seeds that formed this type
  
  // Correction pathways (PATENT-CRITICAL)
  correctionPathways: CorrectionPathways | null;
  
  // Metadata
  createdAt: Date;
  lastUpdated: Date;
}

// ==========================================
// CORRECTION PATHWAYS (PATENT-CRITICAL)
// ==========================================

/**
 * Decision-safe correction options organized by intervention tier
 */
export interface CorrectionPathways {
  tier1_Design: CorrectionOption[];
  tier2_Execution: CorrectionOption[];
  tier3_Governance: CorrectionOption[];
  decisionSafeStatement: string;
}

/**
 * Single correction option - always presents choices, never prescribes
 */
export interface CorrectionOption {
  id: string;
  title: string;
  description: string;
  interventionType: 'PREVENTATIVE' | 'CORRECTIVE';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  decisionPoint: string;          // Question for decision-maker
  options: string[];              // Available choices
  risks: string[];                // Potential risks to consider
}

// ==========================================
// FAILURE EVOLUTION
// ==========================================

/**
 * Tracks the evolution of a cluster into a FailureType
 */
export interface FailureEvolution {
  clusterId: string;
  stage: 'SEED' | 'CLUSTERING' | 'EMERGING' | 'READY' | 'EVOLVED' | 'MATURE';
  seedContributions: string[];
  evolutionTrigger: {
    seedCount: number;
    cohesionScore: number;
    patternConsistency: number;
    threshold: number;
  } | null;
  evolutionDate: Date | null;
}

// ==========================================
// CROSS-SEED INTELLIGENCE
// ==========================================

/**
 * Intelligence derived from cross-seed analysis
 */
export interface CrossSeedIntelligence {
  failureTypeId: string;
  linkedSeeds: string[];
  crossLayerPatterns: {
    layerSequence: SystemLayer[];
    layerTransitions: { from: SystemLayer; to: SystemLayer; frequency: number }[];
  };
  temporalPatterns: {
    typicalOnset: 'IMMEDIATE' | 'DELAYED' | 'PROGRESSIVE';
    peakOccurrence: string;
    recurrencePattern: 'ISOLATED' | 'CLUSTERED' | 'SEASONAL';
  };
  cooccurrencePatterns: {
    frequentlyWith: string[];
    rarelyWith: string[];
    exclusivePatterns: string[];
  };
  insights: string[];
}

// ==========================================
// SIMILARITY SCORE
// ==========================================

/**
 * Result of comparing two pattern seeds
 */
export interface SimilarityScore {
  seedId1: string;
  seedId2: string;
  breakpointSimilarity: number;
  tensionSimilarity: number;
  interactionOverlap: number;
  layerMatch: boolean;
  overallScore: number;
  shouldCluster: boolean;
}

// ==========================================
// NAMING PATTERNS
// ==========================================

/**
 * Naming patterns for generating memorable FailureType names
 * These create recognition and are slightly provocative
 */
export const NAMING_PATTERNS = {
  ILLUSION: {
    pattern: '{Concept} Illusion',
    examples: ['Consent Illusion', 'Competence Illusion', 'Oversight Illusion'],
    tone: 'provocative'
  },
  MIRAGE: {
    pattern: '{Concept} Mirage',
    examples: ['Data Cleanliness Mirage', 'Resource Mirage', 'Timeline Mirage'],
    tone: 'provocative'
  },
  ABSORPTION: {
    pattern: 'Silent {Concept} Absorption',
    examples: ['Silent Deviation Absorption', 'Silent Risk Absorption'],
    tone: 'provocative'
  },
  PARALYSIS: {
    pattern: '{Concept} Paralysis',
    examples: ['Decision Paralysis', 'Escalation Paralysis'],
    tone: 'direct'
  },
  DECAY: {
    pattern: '{Concept} Decay',
    examples: ['Protocol Drift Decay', 'Standard Decay'],
    tone: 'direct'
  },
  AMPLIFICATION: {
    pattern: '{Concept} Amplification',
    examples: ['Risk Amplification', 'Error Amplification'],
    tone: 'technical'
  },
  EROSION: {
    pattern: '{Concept} Erosion',
    examples: ['Quality Erosion', 'Compliance Erosion'],
    tone: 'direct'
  },
  COLLAPSE: {
    pattern: '{Concept} Collapse',
    examples: ['Communication Cascade Collapse', 'Process Cascade Collapse'],
    tone: 'urgent'
  }
} as const;

// ==========================================
// DEFAULT VALUES
// ==========================================

export const DEFAULT_LAYER_DISTRIBUTION: Record<SystemLayer, number> = {
  PATIENT: 0,
  SITE: 0,
  CRO: 0,
  SPONSOR: 0
};