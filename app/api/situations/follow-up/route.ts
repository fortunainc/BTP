/**
 * Truth Loop Follow-Up API
 * 
 * 7-14 Day Truth Loop (Section 8)
 * 
 * When a contributor responds to the follow-up notification,
 * this route creates a ContributionFollowUp record and updates
 * the original contribution's translation engine fields.
 * 
 * Flow:
 * 1. User receives notification at 7 days: "Has anything changed?"
 * 2. User selects a status change: stayed_manageable, got_worse, caused_delay_deviation_dropout, resolved
 * 3. Optional: user adds notes
 * 4. This route stores the follow-up and updates the contribution
 * 
 * The follow-up validates or invalidates the original prediction,
 * building longitudinal intelligence for the translation engine.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { updateTrustVector } from '@/lib/trust-vector';
import { progressPathway } from '@/lib/failure-pathway';

// Valid status changes
const STATUS_CHANGES = [
  'stayed_manageable',
  'got_worse',
  'caused_delay_deviation_dropout',
  'resolved'
] as const;

type StatusChange = typeof STATUS_CHANGES[number];

// Valid follow-up types
const FOLLOW_UP_TYPES = [
  'truth_loop',
  'admin_initiated',
  'self_reported'
] as const;

/**
 * POST /api/situations/follow-up
 * 
 * Submit a truth loop follow-up response
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const {
      contributionId,
      statusChange,
      notes,
      followUpType
    } = body as {
      contributionId?: string;
      statusChange?: string;
      notes?: string;
      followUpType?: string;
    };

    // Validate required fields
    if (!contributionId) {
      return createErrorResponse('Contribution ID is required', 400);
    }

    if (!statusChange || !STATUS_CHANGES.includes(statusChange as StatusChange)) {
      return createErrorResponse(
        `Status change must be one of: ${STATUS_CHANGES.join(', ')}`,
        400
      );
    }

    // Verify the contribution exists and belongs to the user
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      select: {
        id: true,
        userId: true,
        failureTrajectoryPrediction: true,
        signalQualityScore: true,
        patternMaturity: true,
        createdAt: true
      }
    });

    if (!contribution) {
      return createErrorResponse('Contribution not found', 404);
    }

    if (contribution.userId !== user.id) {
      return createErrorResponse('You can only follow up on your own contributions', 403);
    }

    // Calculate days since submission
    const daysSinceSubmission = Math.floor(
      (Date.now() - contribution.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine which prediction this validates
    const validatedPrediction = determineValidatedPrediction(
      contribution.failureTrajectoryPrediction,
      statusChange as StatusChange
    );

    // Create the follow-up record
    const followUp = await prisma.contributionFollowUp.create({
      data: {
        contributionId,
        userId: user.id,
        followUpType: followUpType && FOLLOW_UP_TYPES.includes(followUpType as any)
          ? followUpType
          : 'truth_loop',
        statusChange: statusChange as StatusChange,
        notes: notes || null,
        validatedPrediction,
        daysSinceSubmission
      }
    });

    // Update the contribution based on the follow-up
    await updateContributionFromFollowUp(contributionId, statusChange as StatusChange, contribution);

    // Progress any failure pathways this contribution is part of
    await progressPathway(contributionId, statusChange);

    // Update the contributor's health flag
    await updateContributorHealth(user.id);

    // Update trust vector (responding to follow-ups is positive signal)
    await updateTrustVector(user.id);

    // Log the follow-up
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FOLLOW_UP_SUBMITTED',
        resourceType: 'ContributionFollowUp',
        resourceId: followUp.id,
        details: {
          contributionId,
          statusChange,
          daysSinceSubmission,
          validatedPrediction,
          followUpType: followUp.followUpType
        }
      }
    });

    // Determine appropriate response message
    const message = getFollowUpResponseMessage(statusChange as StatusChange);

    return createApiResponse({
      success: true,
      id: followUp.id,
      message,
      // Show updated trajectory assessment
      trajectoryUpdate: getTrajectoryUpdate(statusChange as StatusChange)
    });

  } catch (error) {
    console.error('Error creating follow-up:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { requireAuth: true });

/**
 * GET /api/situations/follow-up?contributionId=xxx
 * 
 * Check if a follow-up is needed for a contribution
 * Returns pending follow-up status or null
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contributionId = searchParams.get('contributionId');

    if (!contributionId) {
      return createErrorResponse('Contribution ID is required', 400);
    }

    // Check for existing follow-ups
    const existingFollowUps = await prisma.contributionFollowUp.findMany({
      where: { contributionId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Check the contribution
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      select: {
        id: true,
        createdAt: true,
        failureTrajectoryPrediction: true
      }
    });

    if (!contribution) {
      return createErrorResponse('Contribution not found', 404);
    }

    const daysSinceSubmission = Math.floor(
      (Date.now() - contribution.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return createApiResponse({
      contributionId,
      daysSinceSubmission,
      followUps: existingFollowUps.map(fu => ({
        id: fu.id,
        statusChange: fu.statusChange,
        daysSinceSubmission: fu.daysSinceSubmission,
        createdAt: fu.createdAt
      })),
      isEligibleForFollowUp: daysSinceSubmission >= 7 && existingFollowUps.length === 0
    });

  } catch (error) {
    console.error('Error checking follow-up status:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Determine which prediction this follow-up validates or invalidates
 */
function determineValidatedPrediction(
  originalPrediction: string | null,
  statusChange: StatusChange
): string {
  if (!originalPrediction || originalPrediction === 'NONE') {
    return statusChange === 'stayed_manageable' ? 'CONFIRMED_NONE' : 'MISSED_SIGNAL';
  }

  if (originalPrediction === 'LIKELY_ESCALATION') {
    return statusChange === 'got_worse' || statusChange === 'caused_delay_deviation_dropout'
      ? 'PREDICTION_CONFIRMED'
      : 'PREDICTION_NOT_CONFIRMED';
  }

  if (originalPrediction === 'HIGH_RISK_ESCALATION') {
    return statusChange === 'got_worse' || statusChange === 'caused_delay_deviation_dropout'
      ? 'PREDICTION_CONFIRMED'
      : 'PREDICTION_NOT_CONFIRMED';
  }

  return 'UNKNOWN_VALIDATION';
}

/**
 * Update the contribution based on follow-up results
 */
async function updateContributionFromFollowUp(
  contributionId: string,
  statusChange: StatusChange,
  currentData: { failureTrajectoryPrediction: string | null; patternMaturity: string | null; signalQualityScore: string | null }
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  // Update resolution status based on follow-up
  if (statusChange === 'resolved') {
    updateData.resolutionStatus = 'Resolved';
  } else if (statusChange === 'got_worse' || statusChange === 'caused_delay_deviation_dropout') {
    updateData.resolutionStatus = 'In Progress';
    // If it got worse, escalate urgency
    updateData.urgencyLevel = 'Urgent';
  }

  // If prediction was confirmed, increase pattern maturity
  if (statusChange === 'got_worse' || statusChange === 'caused_delay_deviation_dropout') {
    if (currentData.patternMaturity === 'EMERGING') {
      updateData.patternMaturity = 'REPEATING';
    }
  }

  // If prediction was NOT confirmed (stayed manageable), we don't downgrade
  // but we note it in the predictive summary

  if (Object.keys(updateData).length > 0) {
    await prisma.contribution.update({
      where: { id: contributionId },
      data: updateData
    });
  }
}

/**
 * Update contributor health flag based on follow-up activity
 */
async function updateContributorHealth(userId: string): Promise<void> {
  try {
    // Get or create health flag
    const existing = await prisma.contributorHealthFlag.findUnique({
      where: { userId }
    });

    // Count contributions and follow-ups
    const contributionCount = await prisma.contribution.count({
      where: { userId, isHidden: false, isFlagged: false }
    });

    const followUpCount = await prisma.contributionFollowUp.count({
      where: { userId }
    });

    // Calculate follow-up response rate
    const followUpResponseRate = contributionCount > 0
      ? Math.min(1.0, followUpCount / contributionCount)
      : 0;

    // Calculate average SQS
    const contributions = await prisma.contribution.findMany({
      where: { userId, signalQualityScore: { not: null } },
      select: { signalQualityScore: true }
    });

    const sqsValues = contributions
      .map(c => c.signalQualityScore === 'HIGH' ? 1.0 : c.signalQualityScore === 'MEDIUM' ? 0.5 : 0.25)
      .filter(v => v !== undefined);

    const avgSignalQuality = sqsValues.length > 0
      ? sqsValues.reduce((a, b) => a + b, 0) / sqsValues.length
      : 0.5;

    // Determine signal level
    let signalLevel = 'normal';
    if (contributionCount >= 5 && avgSignalQuality >= 0.7) signalLevel = 'high_signal';
    else if (contributionCount === 0) signalLevel = 'dormant';
    else if (avgSignalQuality < 0.3) signalLevel = 'low_signal';

    if (existing) {
      await prisma.contributorHealthFlag.update({
        where: { userId },
        data: {
          signalLevel,
          lastContributionAt: new Date(),
          contributionCount,
          avgSignalQuality,
          followUpResponseRate,
          isInactive: false,
          inactivityDays: 0,
          churnRisk: Math.max(0, 1 - followUpResponseRate) * 0.3
        }
      });
    } else {
      await prisma.contributorHealthFlag.create({
        data: {
          userId,
          signalLevel,
          lastContributionAt: new Date(),
          contributionCount,
          avgSignalQuality,
          followUpResponseRate,
          isInactive: false,
          churnRisk: Math.max(0, 1 - followUpResponseRate) * 0.3
        }
      });
    }
  } catch (error) {
    console.error('Error updating contributor health:', error);
    // Don't fail the follow-up if health update fails
  }
}

/**
 * Get a human-appropriate response message for the follow-up
 */
function getFollowUpResponseMessage(statusChange: StatusChange): string {
  switch (statusChange) {
    case 'stayed_manageable':
      return "Good to know. This helps us understand what typically resolves on its own.";
    case 'got_worse':
      return "Thank you for telling us. We're tracking how these situations develop — your update matters.";
    case 'caused_delay_deviation_dropout':
      return "This is exactly the kind of outcome that needs to be visible. Thank you for following up.";
    case 'resolved':
      return "Glad to hear it. Knowing what resolved helps others understand what works.";
    default:
      return "Thank you for the update.";
  }
}

/**
 * Get a trajectory update message for the confirmation screen
 */
function getTrajectoryUpdate(statusChange: StatusChange): string {
  switch (statusChange) {
    case 'stayed_manageable':
      return "This situation appears to be staying within normal parameters.";
    case 'got_worse':
      return "This situation is escalating. Your update has been flagged for pattern tracking.";
    case 'caused_delay_deviation_dropout':
      return "This situation has led to a significant operational impact. This confirms the prediction pathway.";
    case 'resolved':
      return "This situation has been resolved. The resolution approach has been noted for pattern matching.";
    default:
      return "Your update has been recorded.";
  }
}