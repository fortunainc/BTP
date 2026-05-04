/**
 * Trust Vector Service
 * 
 * Multi-dimensional trust calculation for the closed-loop execution system
 * 
 * 9 Dimensions:
 * 1. Quality - Content quality and accuracy
 * 2. Reliability - Consistent participation over time
 * 3. PatternContribution - Value of situations shared
 * 4. SolutionUtility - Solutions that worked for others
 * 5. Recency - Recent activity weighting
 * 6. PeerConfidence - Recognition from other operators
 * 7. OutcomeReinforcement - Confirmed outcomes (NOW FEEDBACK LOOP CLOSED)
 * 8. Scarcity - Rare expertise/therapeutic areas
 * 9. DomainRelevance - Relevant to user's domain
 * 
 * Architecture Rules:
 * - NO UI exposure of trust vector
 * - NO "score" or "tier" language
 * - Used only for matching and prioritization
 * - STORED in TrustVector model (not calculated on-demand)
 * - OUTCOME FEEDBACK LOOP: ContributionOutcomes and HireOutcomes feed into TrustVector
 */

import { prisma } from './prisma';
import { onTrustIncreased, onDomainStrengthened } from './return-engine/integration';

// ==========================================
// Types and Interfaces
// ==========================================

export interface TrustVectorData {
  quality: number;
  reliability: number;
  patternContribution: number;
  solutionUtility: number;
  recency: number;
  peerConfidence: number;
  outcomeReinforcement: number;
  scarcity: number;
  domainRelevance: number;
}

export interface TrustVectorResult {
  vector: TrustVectorData;
  overallWeight: number;
  priorityAccess: boolean;
  lastUpdated: Date;
}

// Outcome Data Types
interface ContributionOutcomeData {
  outcomeType: string;
  wasHelpful: boolean | null;
  impactScore: number | null;
  createdAt: Date;
}

interface HireOutcomeData {
  wasSuccessful: boolean | null;
  wouldRehire: boolean | null;
  performanceScore: number | null;
  createdAt: Date;
}

// ==========================================
// Configuration
// ==========================================

const DIMENSION_WEIGHTS: Record<keyof TrustVectorData, number> = {
  quality: 0.15,
  reliability: 0.12,
  patternContribution: 0.15,
  solutionUtility: 0.18,
  recency: 0.10,
  peerConfidence: 0.12,
  outcomeReinforcement: 0.10,
  scarcity: 0.05,
  domainRelevance: 0.03
};

const PRIORITY_ACCESS_THRESHOLD = 0.7;

// ==========================================
// Main Functions
// ==========================================

/**
 * Get or create trust vector for a user
 */
export async function getTrustVector(userId: string): Promise<TrustVectorResult | null> {
  try {
    // Try to get existing trust vector
    let trustVector = await prisma.trustVector.findUnique({
      where: { userId }
    });

    // If doesn't exist, create with defaults
    if (!trustVector) {
      trustVector = await prisma.trustVector.create({
        data: { userId }
      });
    }

    return {
      vector: {
        quality: trustVector.quality,
        reliability: trustVector.reliability,
        patternContribution: trustVector.patternContribution,
        solutionUtility: trustVector.solutionUtility,
        recency: trustVector.recency,
        peerConfidence: trustVector.peerConfidence,
        outcomeReinforcement: trustVector.outcomeReinforcement,
        scarcity: trustVector.scarcity,
        domainRelevance: trustVector.domainRelevance
      },
      overallWeight: trustVector.overallWeight,
      priorityAccess: trustVector.priorityAccess,
      lastUpdated: trustVector.lastCalculated
    };
  } catch (error) {
    console.error('Error getting trust vector:', error);
    return null;
  }
}

/**
 * Recalculate and update trust vector for a user
 * Called after interactions, outcomes, or contributions
 * NOW INCLUDES: ContributionOutcomes and HireOutcomes in calculations
 */
export async function updateTrustVector(userId: string): Promise<TrustVectorResult | null> {
  try {
    // Get user's contributions, interactions, AND outcomes
    const [contributions, interactions, contributionOutcomes, hireOutcomes, user] = await Promise.all([
      prisma.contribution.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          therapeuticArea: true,
          contributionType: true,
          interactions: {
            select: { interactionType: true }
          }
        }
      }),
      prisma.interaction.findMany({
        where: { userId },
        select: {
          interactionType: true,
          createdAt: true
        }
      }),
      prisma.contributionOutcome.findMany({
        where: { userId },
        select: {
          outcomeType: true,
          wasHelpful: true,
          impactScore: true,
          createdAt: true
        }
      }),
      prisma.hireOutcome.findMany({
        where: { userId },
        select: {
          wasSuccessful: true,
          wouldRehire: true,
          performanceScore: true,
          createdAt: true
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true }
      })
    ]);

    if (!user) return null;

    // Calculate each dimension (NOW WITH OUTCOME DATA)
    const vector: TrustVectorData = {
      quality: calculateQuality(contributions),
      reliability: calculateReliability(contributions, user.createdAt),
      patternContribution: calculatePatternContribution(contributions),
      solutionUtility: calculateSolutionUtility(contributions),
      recency: calculateRecency(contributions, interactions),
      peerConfidence: calculatePeerConfidence(contributions),
      outcomeReinforcement: calculateOutcomeReinforcement(
        contributions, 
        contributionOutcomes, 
        hireOutcomes
      ),
      scarcity: calculateScarcity(contributions),
      domainRelevance: calculateDomainRelevance(contributions)
    };

    // Calculate overall weight
    let overallWeight = 0;
    for (const [dimension, weight] of Object.entries(DIMENSION_WEIGHTS)) {
      overallWeight += vector[dimension as keyof TrustVectorData] * weight;
    }

    // Check for priority access
    const priorityAccess = overallWeight >= PRIORITY_ACCESS_THRESHOLD;

    // Get previous trust vector for comparison
    const previousTrustVector = await prisma.trustVector.findUnique({
      where: { userId },
      select: { overallWeight: true }
    });
    const previousWeight = previousTrustVector?.overallWeight ?? 0.5;

    // Upsert trust vector
    const trustVector = await prisma.trustVector.upsert({
      where: { userId },
      update: {
        quality: vector.quality,
        reliability: vector.reliability,
        patternContribution: vector.patternContribution,
        solutionUtility: vector.solutionUtility,
        recency: vector.recency,
        peerConfidence: vector.peerConfidence,
        outcomeReinforcement: vector.outcomeReinforcement,
        scarcity: vector.scarcity,
        domainRelevance: vector.domainRelevance,
        overallWeight,
        priorityAccess,
        lastCalculated: new Date()
      },
      create: {
        userId,
        quality: vector.quality,
        reliability: vector.reliability,
        patternContribution: vector.patternContribution,
        solutionUtility: vector.solutionUtility,
        recency: vector.recency,
        peerConfidence: vector.peerConfidence,
        outcomeReinforcement: vector.outcomeReinforcement,
        scarcity: vector.scarcity,
        domainRelevance: vector.domainRelevance,
        overallWeight,
        priorityAccess
      }
    });

    // Return Engine: Fire trust increase trigger if significant
    if (overallWeight > previousWeight) {
      const increasePercentage = (overallWeight - previousWeight) / previousWeight;
      if (increasePercentage >= 0.05) { // 5% threshold
        // Fire trigger in background (don't await)
        onTrustIncreased({
          userId,
          previousScore: previousWeight,
          newScore: overallWeight,
          increasePercentage
        }).catch(err => console.error('Return Engine trigger error:', err));
      }
    }

    // Return Engine: Fire domain strengthened trigger if domain relevance improved
    if (vector.domainRelevance > 0.7) {
      const domains = [...new Set(contributions.filter(c => c.therapeuticArea).map(c => c.therapeuticArea))];
      if (domains.length > 0) {
        // Fire trigger for primary domain in background
        onDomainStrengthened({
          userId,
          domain: domains[0] || 'general'
        }).catch(err => console.error('Return Engine trigger error:', err));
      }
    }

    return {
      vector,
      overallWeight,
      priorityAccess,
      lastUpdated: trustVector.lastCalculated
    };

  } catch (error) {
    console.error('Error updating trust vector:', error);
    return null;
  }
}

/**
 * Get trust weight for a user (used for interaction weighting)
 */
export async function getTrustWeight(userId: string): Promise<number> {
  try {
    const result = await getTrustVector(userId);
    return result?.overallWeight ?? 0.5; // Default to 0.5 for new users
  } catch {
    return 0.5;
  }
}

/**
 * Check if user has priority access to opportunities
 */
export async function checkPriorityAccess(userId: string): Promise<boolean> {
  try {
    const result = await getTrustVector(userId);
    return result?.priorityAccess ?? false;
  } catch {
    return false;
  }
}

// ==========================================
// Dimension Calculations
// ==========================================

interface ContributionData {
  id: string;
  createdAt: Date;
  therapeuticArea: string;
  contributionType: string;
  interactions: Array<{ interactionType: string }>;
}

/**
 * Quality: Based on positive interactions on user's contributions
 */
function calculateQuality(contributions: ContributionData[]): number {
  if (contributions.length === 0) return 0.3;
  
  let totalPositive = 0;
  let totalInteractions = 0;
  
  for (const contribution of contributions) {
    for (const interaction of contribution.interactions) {
      totalInteractions++;
      if (['ACCURATE', 'SOLUTION_WORKED', 'SEEN_TOO'].includes(interaction.interactionType)) {
        totalPositive++;
      }
    }
  }
  
  if (totalInteractions === 0) return 0.4; // No interactions = neutral
  return Math.min(0.3 + (totalPositive / totalInteractions) * 0.7, 1.0);
}

/**
 * Reliability: Consistent participation over time
 */
function calculateReliability(contributions: ContributionData[], userCreatedAt: Date): number {
  const accountAge = Date.now() - userCreatedAt.getTime();
  const accountAgeMonths = accountAge / (30 * 24 * 60 * 60 * 1000);
  
  // Base reliability from account age
  const ageScore = Math.min(accountAgeMonths / 12, 0.4);
  
  // Consistency from contribution frequency
  const contributionMonths = new Set(
    contributions.map(c => {
      const d = new Date(c.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}`;
    })
  );
  
  const consistencyScore = Math.min(contributionMonths.size * 0.1, 0.6);
  
  return Math.min(ageScore + consistencyScore, 1.0);
}

/**
 * PatternContribution: Value of situations shared
 */
function calculatePatternContribution(contributions: ContributionData[]): number {
  const situations = contributions.filter(c => c.contributionType === 'situation');
  if (situations.length === 0) return 0.2;
  
  // Count "SEEN_TOO" interactions - validates pattern
  let patternValidations = 0;
  for (const situation of situations) {
    const seenToo = situation.interactions.filter(
      i => i.interactionType === 'SEEN_TOO'
    );
    patternValidations += seenToo.length;
  }
  
  // Score based on validations
  return Math.min(0.2 + (patternValidations * 0.1), 1.0);
}

/**
 * SolutionUtility: Solutions that worked for others
 */
function calculateSolutionUtility(contributions: ContributionData[]): number {
  let workedCount = 0;
  let failedCount = 0;
  
  for (const contribution of contributions) {
    for (const interaction of contribution.interactions) {
      if (interaction.interactionType === 'SOLUTION_WORKED') workedCount++;
      if (interaction.interactionType === 'SOLUTION_FAILED') failedCount++;
    }
  }
  
  if (workedCount + failedCount === 0) return 0.3;
  
  const ratio = workedCount / (workedCount + failedCount);
  return Math.min(ratio, 1.0);
}

/**
 * Recency: Recent activity weighting
 */
function calculateRecency(
  contributions: ContributionData[], 
  interactions: Array<{ createdAt: Date }>
): number {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  const recentContributions = contributions.filter(
    c => new Date(c.createdAt).getTime() > thirtyDaysAgo
  );
  const recentInteractions = interactions.filter(
    i => new Date(i.createdAt).getTime() > thirtyDaysAgo
  );
  
  const recentActivity = recentContributions.length + recentInteractions.length;
  
  // Score based on recent activity (diminishing returns)
  if (recentActivity === 0) return 0.2;
  if (recentActivity < 5) return 0.4;
  if (recentActivity < 15) return 0.6;
  if (recentActivity < 30) return 0.8;
  return 1.0;
}

/**
 * PeerConfidence: Recognition from other operators
 */
function calculatePeerConfidence(contributions: ContributionData[]): number {
  // Count unique interaction types from others
  const uniqueRecognitions = new Set<string>();
  
  for (const contribution of contributions) {
    for (const interaction of contribution.interactions) {
      uniqueRecognitions.add(interaction.interactionType);
    }
  }
  
  // More diverse recognition = higher confidence
  const diversityScore = uniqueRecognitions.size * 0.15;
  
  // Count total interactions (with diminishing returns)
  const totalInteractions = contributions.reduce(
    (sum, c) => sum + c.interactions.length, 
    0
  );
  
  const volumeScore = Math.min(totalInteractions * 0.02, 0.4);
  
  return Math.min(diversityScore + volumeScore, 1.0);
}

/**
 * OutcomeReinforcement: Confirmed outcomes
 * UPDATED: Now includes ContributionOutcomes and HireOutcomes
 */
function calculateOutcomeReinforcement(
  contributions: ContributionData[],
  contributionOutcomes: ContributionOutcomeData[],
  hireOutcomes: HireOutcomeData[]
): number {
  let outcomeScore = 0;
  
  // Count "SOLUTION_WORKED" interactions as confirmed outcomes (legacy)
  for (const contribution of contributions) {
    const workedInteractions = contribution.interactions.filter(
      i => i.interactionType === 'SOLUTION_WORKED'
    );
    outcomeScore += workedInteractions.length * 0.15;
  }
  
  // Contribution outcomes: resolution, validation boost score
  const positiveContributionOutcomes = contributionOutcomes.filter(
    o => o.outcomeType === 'resolution' || o.outcomeType === 'validation'
  );
  outcomeScore += positiveContributionOutcomes.length * 0.2;
  
  // Contribution outcomes: correction, misleading reduce score
  const negativeContributionOutcomes = contributionOutcomes.filter(
    o => o.outcomeType === 'correction' || o.outcomeType === 'misleading'
  );
  outcomeScore -= negativeContributionOutcomes.length * 0.1;
  
  // Hire outcomes: successful hires strongly boost score
  const successfulHires = hireOutcomes.filter(
    o => o.wasSuccessful === true && o.wouldRehire === true
  );
  outcomeScore += successfulHires.length * 0.3;
  
  // Hire outcomes: unsuccessful hires reduce score
  const unsuccessfulHires = hireOutcomes.filter(
    o => o.wasSuccessful === false || (o.performanceScore !== null && o.performanceScore !== undefined && o.performanceScore < 0.5)
  );
  outcomeScore -= unsuccessfulHires.length * 0.15;
  
  // Cap at 1.0
  return Math.max(0, Math.min(outcomeScore, 1.0));
}

/**
 * Scarcity: Rare expertise/therapeutic areas
 */
function calculateScarcity(contributions: ContributionData[]): number {
  // Count unique therapeutic areas
  const areas = new Set(
    contributions
      .filter(c => c.therapeuticArea)
      .map(c => c.therapeuticArea)
  );
  
  // Rare areas get higher scores
  const rareAreas = ['Rare Disease', 'Pediatrics', 'Dermatology', 'Device'];
  const hasRareArea = [...areas].some(area => rareAreas.includes(area));
  
  const baseScore = areas.size * 0.1;
  const rareBonus = hasRareArea ? 0.3 : 0;
  
  return Math.min(baseScore + rareBonus, 1.0);
}

/**
 * DomainRelevance: Relevant to user's domain
 */
function calculateDomainRelevance(contributions: ContributionData[]): number {
  if (contributions.length === 0) return 0.5;
  
  // Check if contributions have diverse issue categories
  const types = new Set(
    contributions.filter(c => c.contributionType).map(c => c.contributionType)
  );
  
  // More diverse contributions = higher relevance
  const diversityScore = Math.min(types.size * 0.15, 0.5);
  
  return 0.5 + diversityScore;
}

export default {
  getTrustVector,
  updateTrustVector,
  getTrustWeight,
  checkPriorityAccess
};