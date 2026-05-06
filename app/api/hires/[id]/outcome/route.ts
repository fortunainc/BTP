/**
 * Hire Outcome API - Opportunity Realm
 * 
 * Records feedback on hire outcomes to close the feedback loop
 * 
 * Architecture Rules:
 * - Uses HireOutcome model
 * - Feeds into TrustVector update
 * - Outcomes reinforce or modify trust scores
 * - Performance scores are internal only (never exposed to UI)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { updateTrustVector } from '@/lib/trust-vector';

/**
 * POST /api/hires/[id]/outcome
 * 
 * Record an outcome for a hire
 */
export const POST = withAuth(async (req, user) => {
      // Extract hireId from URL path: /api/hires/[id]/outcome
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const hireId = pathSegments[3]; // /api/hires/[id]/outcome

      const body = await req.json();
      const { 
        wasSuccessful, 
        wouldRehire, 
        feedback,
        performanceScore
      } = body;

      // Get the hire record
      const hire = await prisma.hire.findUnique({
        where: { id: hireId },
        select: {
          id: true,
          operatorId: true,
          organizationId: true,
          jobPostingId: true,
          createdBy: true
        }
      });

      if (!hire) {
        return createErrorResponse('Hire record not found', 404);
      }

      // Verify user is authorized to record outcome
      // Either the organization that hired, or the user who created the hire record
      if (hire.organizationId !== user.id && hire.createdBy !== user.id) {
        return createErrorResponse(
          'You are not authorized to record an outcome for this hire',
          403
        );
      }

      // Check if outcome already exists
      const existingOutcome = await prisma.hireOutcome.findUnique({
        where: { hireId }
      });

      if (existingOutcome) {
        return createErrorResponse(
          'An outcome has already been recorded for this hire',
          400
        );
      }

      // Calculate performance score if not provided
      let finalPerformanceScore = performanceScore;
      if (finalPerformanceScore === undefined && wasSuccessful !== undefined) {
        // Default performance score based on success
        if (wouldRehire && wasSuccessful) {
          finalPerformanceScore = 1.0;  // Perfect
        } else if (wouldRehire) {
          finalPerformanceScore = 0.7;  // Good
        } else if (wasSuccessful) {
          finalPerformanceScore = 0.5;  // Mixed
        } else {
          finalPerformanceScore = 0.0;  // Poor
        }
      }

      // Create hire outcome
      await prisma.hireOutcome.create({
        data: {
          hireId,
          userId: hire.operatorId,
          wasSuccessful,
          wouldRehire,
          feedback: feedback || null,
          performanceScore: finalPerformanceScore
        }
      });

      // Update operator's trust vector with outcome data
      await updateTrustVector(hire.operatorId);

      // Log outcome
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'HIRE_OUTCOME_RECORDED',
          resourceType: 'HireOutcome',
          resourceId: hireId,
          details: {
            wasSuccessful,
            wouldRehire,
            performanceScore: finalPerformanceScore,
            operatorId: hire.operatorId,
            organizationId: hire.organizationId
          }
        }
      });

      return createApiResponse({
        success: true,
        message: getOutcomeMessage(wasSuccessful, wouldRehire),
        performanceScore: finalPerformanceScore
      });

    }, { requireAuth: true });

/**
 * GET /api/hires/[id]/outcome
 * 
 * Get outcome for a hire (only for authorized users)
 */
export const GET = withAuth(async (req, user) => {
      // Extract hireId from URL path: /api/hires/[id]/outcome
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const hireId = pathSegments[3]; // /api/hires/[id]/outcome

      // Get the hire record
      const hire = await prisma.hire.findUnique({
        where: { id: hireId },
        select: {
          id: true,
          operatorId: true,
          organizationId: true,
          createdBy: true
        }
      });

      if (!hire) {
        return createErrorResponse('Hire record not found', 404);
      }

      // Verify user is authorized
      if (hire.operatorId !== user.id && 
          hire.organizationId !== user.id && 
          hire.createdBy !== user.id) {
        return createErrorResponse(
          'You are not authorized to view this outcome',
          403
        );
      }

      // Get outcome
      const outcome = await prisma.hireOutcome.findUnique({
        where: { hireId },
        select: {
          wasSuccessful: true,
          wouldRehire: true,
          createdAt: true
          // performanceScore and feedback are internal only
        }
      });

      if (!outcome) {
        return createApiResponse({
          hasOutcome: false,
          message: 'No outcome recorded yet'
        });
      }

      return createApiResponse({
        hasOutcome: true,
        wasSuccessful: outcome.wasSuccessful,
        wouldRehire: outcome.wouldRehire,
        recordedAt: outcome.createdAt
      });

    }, { requireAuth: true });

/**
 * Get user-friendly message for outcome
 */
function getOutcomeMessage(wasSuccessful?: boolean, wouldRehire?: boolean): string {
  if (wasSuccessful && wouldRehire) {
    return 'Thank you for confirming a successful hire. This reinforces the operator\'s reliability.';
  } else if (wasSuccessful) {
    return 'Thank you for your feedback. This helps improve future matching.';
  } else if (wouldRehire) {
    return 'Thank you for your feedback. This helps us understand the factors for effective matching.';
  } else {
    return 'Thank you for your honest feedback. This helps maintain quality standards in the operator network.';
  }
}
