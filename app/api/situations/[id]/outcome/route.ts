import { OUTCOME_POLICY, isOutcomeType } from '@/lib/outcome-policy';
import { isApprovedMember, isAdminMember } from '@/lib/access-policy';
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
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { updateTrustVector } from '@/lib/trust-vector';
import { applyAutomaticRedaction } from '@/lib/anti-correlation';
import { buildLedgerEvent } from '@/lib/knowledge-ledger';

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
      if (!isApprovedMember(user)) {
        return createErrorResponse('Approved BTP membership is required', 403);
      }

      // Extract contributionId from URL path: /api/situations/[id]/outcome
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const contributionId = pathSegments[3]; // /api/situations/[id]/outcome

      const body = await req.json();
      const { 
        outcomeType, 
        outcomeData, 
      } = body;

      // Validate outcome type
      if (!isOutcomeType(outcomeType)) {
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
          contributionType: true,
          isHidden: true,
          isFlagged: true,
          forceExcludeFromPatterns: true,
        }
      });

      if (!contribution) {
        return createErrorResponse('Contribution not found', 404);
      }

      if (contribution.isHidden || contribution.isFlagged || contribution.forceExcludeFromPatterns) {
        return createErrorResponse('Contribution not found', 404);
      }

      if (contribution.userId !== user.id && !isAdminMember(user)) {
        return createErrorResponse('Only the question author can report what happened', 403);
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

      // Impact is derived from the validated outcome type. Never trust a
      // client-supplied score because it feeds trust and quality signals.
      const { impactScore: finalImpactScore, wasHelpful: finalWasHelpful } = OUTCOME_POLICY[outcomeType];

      const sanitizedOutcomeData = typeof outcomeData === 'string'
        ? applyAutomaticRedaction(outcomeData.slice(0, 2000)).redactedContent
        : null;

      // Create contribution outcome
      const outcomeId = randomUUID();
      const outcomeDataRecord = {
        data: {
          id: outcomeId,
          contributionId,
          userId: user.id,
          outcomeType,
          outcomeData: sanitizedOutcomeData,
          wasHelpful: finalWasHelpful,
          impactScore: finalImpactScore
        }
      };
      const ledgerEvent = buildLedgerEvent({
        aggregateType: 'OUTCOME',
        aggregateId: outcomeId,
        eventType: 'CREATED',
        actorUserId: user.id,
        payload: {
          questionId: contributionId,
          outcomeType,
          outcomeData: sanitizedOutcomeData,
          wasHelpful: finalWasHelpful,
          impactScore: finalImpactScore,
        },
      });
      const [outcome] = await prisma.$transaction([
        prisma.contributionOutcome.create(outcomeDataRecord),
        prisma.knowledgeLedgerEvent.create({ data: ledgerEvent }),
      ]);

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
            wasHelpful: finalWasHelpful,
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
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    if (!isApprovedMember(user)) {
      return createErrorResponse('Approved BTP membership is required', 403);
    }

    const contributionId = new URL(request.url).pathname.split('/')[3];

    const contribution = await prisma.contribution.findFirst({
      where: {
        id: contributionId,
        contributionType: { in: ['question', 'situation'] },
        isHidden: false,
        isFlagged: false,
        forceExcludeFromPatterns: false,
      },
      select: { id: true },
    });
    if (!contribution) return createErrorResponse('Contribution not found', 404);

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
}, { requireAuth: true });

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
