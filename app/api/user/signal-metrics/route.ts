/**
 * User Signal Metrics API
 * 
 * Provides user's contribution statistics for tier-gated marketplace access
 * 
 * Architecture Rules:
 * - NO trust vector or score exposure
 * - Tier based on contribution count
 * - Signal score based on interaction quality
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';

// Tier thresholds based on contribution count
const TIER_THRESHOLDS = [
  { minContributions: 0, tier: 0, name: 'Observer' },
  { minContributions: 3, tier: 1, name: 'Contributor' },
  { minContributions: 10, tier: 2, name: 'Operator' },
  { minContributions: 25, tier: 3, name: 'Expert' },
  { minContributions: 50, tier: 4, name: 'Authority' },
];

function calculateTier(contributionCount: number): number {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (contributionCount >= TIER_THRESHOLDS[i].minContributions) {
      return TIER_THRESHOLDS[i].tier;
    }
  }
  return 0;
}

/**
 * GET /api/user/signal-metrics
 * Get the current user's signal metrics for marketplace access
 */

export const GET = withAuth(async (req, user) => {
    try {
      // Get contribution counts
      const contributionCount = await prisma.contribution.count({
        where: { userId: user.id }
      });

      // Get interaction counts (signals that received engagement)
      const interactionCount = await prisma.interaction.count({
        where: { 
          contribution: { userId: user.id }
        }
      });

      // Calculate tier based on contributions
      const tier = calculateTier(contributionCount);

      // Calculate signal score (0-100 scale)
      // Based on: contribution quality, interaction quality, resolution rate
      const positiveInteractions = await prisma.interaction.count({
        where: {
          contribution: { userId: user.id },
          interactionType: { in: ['SEEN_TOO', 'ACCURATE', 'WORKED'] }
        }
      });

      const totalInteractions = interactionCount || 1;
      const interactionQuality = positiveInteractions / totalInteractions;

      // Get resolution stats
      const resolvedCount = await prisma.contribution.count({
        where: {
          userId: user.id,
          resolutionStatus: { in: ['Resolved', 'Avoided'] }
        }
      });

      const resolutionRate = contributionCount > 0 
        ? resolvedCount / contributionCount 
        : 0;

      // Signal score formula: weighted average of quality factors
      const signalScore = Math.round(
        (interactionQuality * 40 + resolutionRate * 30 + Math.min(contributionCount / 50, 1) * 30) * 100
      ) / 100;

      // Get available jobs count for this tier
      // Note: JobPosting doesn't have minTierRequired field
      // All open jobs are available to matched operators regardless of tier
      const availableJobsCount = await prisma.jobPosting.count({
        where: {
          status: 'Open'
        }
      });

      return createApiResponse({
        accessLevel: tier,
        accessLevelName: TIER_THRESHOLDS.find(t => t.tier === tier)?.name || 'Observer',
        helpfulnessScore: signalScore,
        contributionCount,
        availableJobsCount,
        breakdown: {
          contributions: contributionCount,
          interactions: interactionCount,
          positiveInteractions,
          resolutionRate: Math.round(resolutionRate * 100)
        }
      });

    } catch (error) {
      console.error('Error fetching signal metrics:', error);
      return createErrorResponse('Failed to fetch signal metrics', 500);
    }
  }, { requireAuth: true });
