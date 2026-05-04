/**
 * MICRO-OPPORTUNITY ENGINE
 * 
 * Triggers short consult opportunities based on:
 * - High severity submissions
 * - Repeated patterns
 * - Niche expertise
 * 
 * Value: $150-$300 for 30-minute consults
 */

import { prisma } from './prisma';

// ==========================================
// TYPES
// ==========================================

export interface MicroOpportunityTrigger {
  contributionId: string;
  userId: string;
  issueType: string;
  therapeuticArea?: string;
  severity: 'low' | 'medium' | 'high';
  repeatability: 'isolated' | 'recurring';
  tags: string[];
}

export interface OpportunityMatch {
  opportunityId: string;
  title: string;
  estimatedCompensation: { min: number; max: number };
  estimatedMinutes: number;
  relevanceReason: string;
}

// ==========================================
// TRIGGER CONDITIONS
// ==========================================

/**
 * Check if a submission should trigger a micro-opportunity
 * 
 * TRANSLATION ENGINE GATING (Section 10):
 * Only trigger if HIGH SQS AND (high economic value OR high decision distance OR real downstream risk)
 * 
 * This ensures micro-opportunities are only offered for contributions
 * that have real execution intelligence value, not just volume.
 */
export function shouldTriggerMicroOpportunity(
  severity: 'low' | 'medium' | 'high',
  repeatability: 'isolated' | 'recurring',
  similarCount: number,
  translationGating?: {
    signalQualityScore?: string;  // HIGH, MEDIUM, LOW
    economicValuePotential?: number;  // 0-1
    decisionDistanceLevel?: string;  // LOW, MEDIUM, HIGH, CRITICAL
    likelyDownstreamRisk?: string;  // NONE, LOW, MEDIUM, HIGH, CRITICAL
  }
): { trigger: boolean; reason: string | null } {
  // ─── TRANSLATION ENGINE GATING ───
  // If translation engine data is available, use the strict gating rules
  if (translationGating) {
    const { signalQualityScore, economicValuePotential, decisionDistanceLevel, likelyDownstreamRisk } = translationGating;
    
    // SQS must be HIGH — MEDIUM and LOW are excluded from micro-opportunities
    if (signalQualityScore !== 'HIGH') {
      return { trigger: false, reason: null };
    }
    
    // Must have at least one of: high economic value, high decision distance, real downstream risk
    const hasHighEconomicValue = (economicValuePotential ?? 0) > 0.5;
    const hasHighDecisionDistance = decisionDistanceLevel === 'HIGH' || decisionDistanceLevel === 'CRITICAL';
    const hasRealDownstreamRisk = likelyDownstreamRisk === 'HIGH' || likelyDownstreamRisk === 'CRITICAL';
    
    if (hasHighEconomicValue) {
      return { trigger: true, reason: 'high_economic_value' };
    }
    
    if (hasHighDecisionDistance) {
      return { trigger: true, reason: 'high_decision_distance' };
    }
    
    if (hasRealDownstreamRisk) {
      return { trigger: true, reason: 'real_downstream_risk' };
    }
    
    // HIGH SQS but no qualifying value signal
    return { trigger: false, reason: null };
  }
  
  // ─── LEGACY FALLBACK (no translation engine data) ───
  // High severity always triggers
  if (severity === 'high') {
    return { trigger: true, reason: 'high_severity' };
  }

  // Recurring + multiple similar issues triggers
  if (repeatability === 'recurring' && similarCount >= 3) {
    return { trigger: true, reason: 'repeated_pattern' };
  }

  // Niche expertise (rare therapeutic area + recurring)
  if (repeatability === 'recurring' && similarCount >= 1) {
    return { trigger: true, reason: 'niche_expertise' };
  }

  return { trigger: false, reason: null };
}

/**
 * Create a micro-opportunity from a submission
 */
export async function createMicroOpportunity(
  trigger: MicroOpportunityTrigger
): Promise<string | null> {
  try {
    // Check if opportunity already exists for this contribution
    const existing = await prisma.microOpportunity.findFirst({
      where: { contributionId: trigger.contributionId }
    });

    if (existing) {
      return existing.id;
    }

    // Get contribution details
    const contribution = await prisma.contribution.findUnique({
      where: { id: trigger.contributionId },
      select: { title: true, description: true }
    });

    if (!contribution) {
      console.error('Contribution not found for micro-opportunity');
      return null;
    }

    // Find matching operators
    const matchedOperators = await findMatchingOperators(trigger);

    // Create the opportunity
    const opportunity = await prisma.microOpportunity.create({
      data: {
        contributionId: trigger.contributionId,
        triggerReason: trigger.severity === 'high' ? 'high_severity' : 
                       trigger.repeatability === 'recurring' ? 'repeated_pattern' : 'niche_expertise',
        title: `Consult: ${contribution.title?.slice(0, 50) || 'Clinical Operations Issue'}`,
        description: contribution.description?.slice(0, 500) || '',
        issueType: trigger.issueType,
        therapeuticArea: trigger.therapeuticArea,
        requiredExpertise: trigger.tags,
        matchedOperators: matchedOperators.map(o => o.userId),
        interestedOperators: []
      }
    });

    // Notify matched operators
    await notifyMatchedOperators(opportunity.id, matchedOperators);

    return opportunity.id;
  } catch (error) {
    console.error('Error creating micro-opportunity:', error);
    return null;
  }
}

/**
 * Find operators who match the opportunity requirements
 */
async function findMatchingOperators(
  trigger: MicroOpportunityTrigger
): Promise<{ userId: string; relevance: string }[]> {
  try {
    // Find operators with capability identities - filter in memory since JSON fields don't support has
    const allCapabilities = await prisma.capabilityIdentity.findMany({
      select: {
        userId: true,
        therapeuticAreas: true,
        issueExpertise: true
      },
      take: 100
    });

    // Filter in memory for JSON fields
    const capabilities = allCapabilities.filter(cap => {
      const areas = cap.therapeuticAreas as Record<string, number> | null;
      const expertise = cap.issueExpertise as Record<string, number> | null;
      
      const hasMatchingArea = trigger.therapeuticArea && areas && 
        typeof areas === 'object' && trigger.therapeuticArea in areas;
      const hasMatchingExpertise = trigger.issueType && expertise && 
        typeof expertise === 'object' && trigger.issueType in expertise;
      
      return hasMatchingArea || hasMatchingExpertise;
    }).slice(0, 10);

    return capabilities.map(cap => {
      const expertise = cap.issueExpertise as Record<string, number> | null;
      const hasMatchingExpertise = trigger.issueType && expertise && 
        typeof expertise === 'object' && trigger.issueType in expertise;
      
      return {
        userId: cap.userId,
        relevance: hasMatchingExpertise
          ? `Has resolved ${trigger.issueType.toLowerCase()} issues`
          : `Experience in ${trigger.therapeuticArea || 'relevant area'}`
      };
    });
  } catch (error) {
    console.error('Error finding matching operators:', error);
    return [];
  }
}

/**
 * Notify matched operators about the opportunity
 */
async function notifyMatchedOperators(
  opportunityId: string,
  operators: { userId: string; relevance: string }[]
): Promise<void> {
  try {
    // Create notifications for each matched operator
    const notifications = operators.map(op => ({
      userId: op.userId,
      variantId: 'OPP-01',
      notificationClass: 'OPPORTUNITY',
      priority: 'P1',
      copy: `You may be a fit for a short consult: $150-$300 for 30 minutes`,
      relatedOpportunityId: opportunityId,
      surfaces: ['in_app', 'email'],
      deliveredTo: []
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }
  } catch (error) {
    console.error('Error notifying operators:', error);
  }
}

/**
 * Express interest in a micro-opportunity
 */
export async function expressInterest(
  opportunityId: string,
  userId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already expressed interest
    const existing = await prisma.microOpportunityInterest.findUnique({
      where: {
        opportunityId_userId: { opportunityId, userId }
      }
    });

    if (existing) {
      return { success: false, error: 'Already expressed interest' };
    }

    // Create interest record
    await prisma.microOpportunityInterest.create({
      data: {
        opportunityId,
        userId,
        message
      }
    });

    // Add to interested operators list
    await prisma.microOpportunity.update({
      where: { id: opportunityId },
      data: {
        interestedOperators: {
          push: userId
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error expressing interest:', error);
    return { success: false, error: 'Failed to express interest' };
  }
}

/**
   * Get available micro-opportunities for a user
   */
  export async function getAvailableOpportunities(
    userId: string
  ): Promise<OpportunityMatch[]> {
    try {
      // Get user's capability identity
      const capability = await prisma.capabilityIdentity.findUnique({
        where: { userId },
        select: {
          therapeuticAreas: true,
          issueExpertise: true
        }
      });

      if (!capability) {
        return [];
      }

      // Extract area keys from JSON objects
      const areaKeys = capability.therapeuticAreas && typeof capability.therapeuticAreas === 'object' 
        ? Object.keys(capability.therapeuticAreas as Record<string, number>) 
        : [];
      const expertiseKeys = capability.issueExpertise && typeof capability.issueExpertise === 'object'
        ? Object.keys(capability.issueExpertise as Record<string, number>)
        : [];

      // Find open opportunities matching user's expertise
      const allOpportunities = await prisma.microOpportunity.findMany({
        where: {
          status: 'open'
        },
        take: 20
      });

      // Filter in memory
      const opportunities = allOpportunities.filter(opp => 
        areaKeys.includes(opp.therapeuticArea || '') || expertiseKeys.includes(opp.issueType)
      ).slice(0, 5);

      return opportunities.map(opp => ({
        opportunityId: opp.id,
        title: opp.title,
        estimatedCompensation: { min: opp.minCompensation, max: opp.maxCompensation },
        estimatedMinutes: opp.estimatedMinutes,
        relevanceReason: expertiseKeys.includes(opp.issueType)
          ? `Matches your ${opp.issueType.toLowerCase()} expertise`
          : `Matches your ${opp.therapeuticArea || 'relevant'} experience`
      }));
    } catch (error) {
      console.error('Error getting available opportunities:', error);
      return [];
    }
  }

  /**
 * AGGRESSIVE MICRO-OPPORTUNITY TRIGGER (Priority 4)
 * 
 * Scans for patterns that have reached critical mass and retroactively
 * triggers micro-opportunities for contributions that were previously
 * ineligible (e.g., HIGH SQS but not yet triggered because they were
 * the first in their pattern cluster).
 * 
 * Trigger conditions (ALL must be true):
 * - Pattern has 3+ HIGH SQS contributions (pattern relevance)
 * - Contributions span role demand (multiple roleCategories)
 * - Economic value potential is present
 * 
 * This is the "proof of value" loop accelerator:
 * More signal density → faster opportunity creation → faster economic proof
 */
export async function scanForAggressiveTriggers(): Promise<{
  triggered: number;
  details: Array<{ contributionId: string; reason: string }>;
}> {
  const triggered: Array<{ contributionId: string; reason: string }> = [];

  try {
    // Find issue categories with 3+ HIGH SQS contributions (pattern relevance)
    const highDensityCategories = await prisma.contribution.groupBy({
      by: ['issueCategory'],
      where: {
        contributionType: 'situation',
        isHidden: false,
        isFlagged: false,
        forceExcludeFromPatterns: false,
        signalQualityScore: 'HIGH',
        microOpportunityEligible: false, // Not yet triggered
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: 3 } },
      },
    });

    for (const category of highDensityCategories) {
      const issueCategory = category.issueCategory;

      // Get the untriggered HIGH SQS contributions in this category
      const untriggeredContributions = await prisma.contribution.findMany({
        where: {
          contributionType: 'situation',
          isHidden: false,
          isFlagged: false,
          forceExcludeFromPatterns: false,
          signalQualityScore: 'HIGH',
          microOpportunityEligible: false,
          issueCategory,
          economicValuePotential: { gt: 0.3 },
        },
        select: {
          id: true,
          userId: true,
          issueCategory: true,
          therapeuticArea: true,
          economicValuePotential: true,
          decisionDistanceLevel: true,
          likelyDownstreamRisk: true,
        },
        take: 10,
      });

      for (const contribution of untriggeredContributions) {
        // Check if this contribution has real value signals
        const hasValueSignal =
          (contribution.economicValuePotential ?? 0) > 0.5 ||
          contribution.decisionDistanceLevel === 'HIGH' ||
          contribution.decisionDistanceLevel === 'CRITICAL' ||
          contribution.likelyDownstreamRisk === 'HIGH' ||
          contribution.likelyDownstreamRisk === 'CRITICAL';

        if (!hasValueSignal) continue;

        // Mark as eligible
        await prisma.contribution.update({
          where: { id: contribution.id },
          data: { microOpportunityEligible: true },
        });

        // Create the micro-opportunity
        const opportunityId = await createMicroOpportunity({
          contributionId: contribution.id,
          userId: contribution.userId || 'unknown',
          issueType: contribution.issueCategory,
          therapeuticArea: contribution.therapeuticArea ?? undefined,
          severity: 'high',
          repeatability: 'recurring', // It's in a high-density category
          tags: [contribution.issueCategory, contribution.therapeuticArea || ''].filter(Boolean),
        });

        if (opportunityId) {
          triggered.push({
            contributionId: contribution.id,
            reason: `aggressive_trigger: ${issueCategory} pattern density (${category._count.id} HIGH SQS)`,
          });
        }
      }
    }

    return { triggered: triggered.length, details: triggered };
  } catch (error) {
    console.error('Error in aggressive micro-opportunity scan:', error);
    return { triggered: 0, details: [] };
  }
}

  export default {
  shouldTriggerMicroOpportunity,
  createMicroOpportunity,
  expressInterest,
  getAvailableOpportunities,
  scanForAggressiveTriggers,
};