/**
 * Micro-Opportunities API
 * 
 * GET: List available micro-opportunities for the user
 * POST: Express interest in a micro-opportunity
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { getAvailableOpportunities, expressInterest } from '@/lib/micro-opportunity';

/**
 * GET /api/micro-opportunities
 * 
 * Get available micro-opportunities for the current user
 */
export const GET = withAuth(async (req, user) => {
      const opportunities = await getAvailableOpportunities(user.id);

      return createApiResponse({
        opportunities,
        count: opportunities.length
      });
    }, { requireAuth: true });

/**
 * POST /api/micro-opportunities
 * 
 * Express interest in a micro-opportunity
 */
export const POST = withAuth(async (req, user) => {
      const body = await req.json();
      const { opportunityId, message } = body;

      if (!opportunityId) {
        return createErrorResponse('Opportunity ID is required', 400);
      }

      const result = await expressInterest(opportunityId, user.id, message);

      if (!result.success) {
        return createErrorResponse(result.error || 'Failed to express interest', 400);
      }

      // Create confirmation notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          variantId: 'OPP-02',
          notificationClass: 'OPPORTUNITY',
          priority: 'P2',
          copy: 'Your interest has been recorded. We\'ll connect you if selected.',
          relatedOpportunityId: opportunityId,
          surfaces: ['in_app'],
          deliveredTo: ['in_app']
        }
      });

      return createApiResponse({
        success: true,
        message: 'Interest expressed successfully'
      });
    }, { requireAuth: true });

