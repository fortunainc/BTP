/**
 * Contribution Outcome API - Intelligence Realm
 * 
 * Records feedback on contributions to close the feedback loop
 * 
 * Architecture Rules:
 * - Uses ContributionOutcome model
 * - Feeds into contribution quality updates
 * - Outcomes reinforce or modify future context handling
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { updateTrustVector } from '@/lib/trust-vector';

// Valid outcome types
const OUTCOME_TYPES = [
  'resolution',  // Situation was resolved using this contribution
  'validation',   // Information was confirmed accurate
  'correction',   // Information needed correction
  'incomplete',   // Information was partial/insufficient
  'misleading'    // Information was misleading or incorrect
];

/**
 * POST /api/situations/[id]/outcome
 * 
 * Record an outcome for a contribution
 */
export const POST = withAuth(async (req, user) => {
      // Extract contributionId from URL path: /api/situations/[id]/outcome
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const contributionId = pathSegments[3]; // /api/situations/[id]/outcome

      const body = await req.json();
      const { 
        outcomeType, 
        outcomeData, 
        wasHelpful,
        impactScore
      } = body;

      // Validate outcome type
      if (!OUTCOME_TYPES.includes(outcomeType)) {
        return createErrorResponse(
          `Invalid outcome type. Must be one of: ${OUTCOME_TYPES.join(', ')}`,
          400
        );
      }

      // Check if contribution exists
      const contribution = await prisma.contribution.findUnique({
        where: { 
          id: contributionId
        },
        select: {
          id: true,
          userId: true,
          therapeuticArea: true,
          contributionType: true
        }
      });

      if (!contribution) {
        return createErrorResponse('Contribution not found', 404);
      }

      // Check if outcome already exists
      const existingOutcome = await prisma.contributionOutcome.findFirst({
        where: {
          contributionId,
          userId: user.id
        }
      });

      if (existingOutcome) {
        return createErrorResponse(
          'You have already recorded an outcome for this contribution',
          400
        );
      }

      // Calculate impact score if not provided
      let finalImpactScore = impactScore;
      if (finalImpactScore === undefined) {
        // Default impact scores based on outcome type
        const defaultImpactScores: Record<string, number> = {
          resolution: 1.0,
          validation: 0.8,
          correction: 0.3,
          incomplete: 0.2,
          misleading: -0.5
        };
        finalImpactScore = defaultImpactScores[outcomeType];
      }

      // Create contribution outcome
      await prisma.contributionOutcome.create({
        data: {
          contributionId,
          userId: user.id,
          outcomeType,
          outcomeData: outcomeData || null,
          wasHelpful: wasHelpful !== undefined ? wasHelpful : (finalImpactScore > 0),
          impactScore: finalImpactScore
        }
      });

      // Update contribution author's trust vector with outcome data
      if (contribution.userId) {
        await updateTrustVector(contribution.userId);
      }

      // Log outcome
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CONTRIBUTION_OUTCOME_RECORDED',
          resourceType: 'ContributionOutcome',
          resourceId: contributionId,
          details: {
            outcomeType,
            impactScore: finalImpactScore,
            wasHelpful,
            targetUserId: contribution.userId
          }
        }
      });

      return createApiResponse({
        success: true,
        message: getOutcomeMessage(outcomeType),
        impactScore: finalImpactScore
      });

    }, { requireAuth: true });

/**
 * GET /api/situations/[id]/outcome
 * 
 * Get outcome summary for a contribution (aggregated, not individual)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contributionId } = await params;

    // Get aggregated outcomes (no individual user data)
    const outcomes = await prisma.contributionOutcome.findMany({
      where: { contributionId },
      select: {
        outcomeType: true,
        wasHelpful: true,
        impactScore: true
      }
    });

    if (outcomes.length === 0) {
      return createApiResponse({
        hasOutcomes: false,
        message: 'No outcomes recorded yet'
      });
    }

    // Calculate aggregates
    const totalOutcomes = outcomes.length;
    const helpfulCount = outcomes.filter(o => o.wasHelpful).length;
    const avgImpactScore = outcomes.reduce((sum, o) => sum + o.impactScore, 0) / totalOutcomes;
    
    const outcomeTypes = outcomes.map(o => o.outcomeType);
    const uniqueTypes = [...new Set(outcomeTypes)];

    return createApiResponse({
      hasOutcomes: true,
      totalOutcomes,
      helpfulCount,
      helpfulPercentage: Math.round((helpfulCount / totalOutcomes) * 100),
      avgImpactScore: Math.round(avgImpactScore * 100) / 100,
      outcomeTypesPresent: uniqueTypes
    });

  } catch (error) {
    console.error('Error fetching outcomes:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get user-friendly message for outcome type
 */
function getOutcomeMessage(type: string): string {
  const messages: Record<string, string> = {
    resolution: 'Thank you for confirming this contribution helped resolve your challenge. This reinforces the author\'s expertise.',
    validation: 'Thank you for validating this information as accurate. This helps maintain content quality.',
    correction: 'Thank you for providing correction feedback. This helps improve content accuracy for everyone.',
    incomplete: 'Thank you for your feedback. This helps identify areas where more detail would be valuable.',
    misleading: 'Thank you for your feedback. This helps maintain the integrity of the intelligence network.'
  };
  return messages[type] || 'Outcome recorded';
}
