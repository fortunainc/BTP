/**
 * Interest Expression API
 * 
 * POST /api/opportunities/[id]/interest - Express or decline interest in an opportunity
 * 
 * Architecture Rules:
 * - Operators can only express interest in matched opportunities
 * - NOT "apply" - this is interest expression
 * - CapabilityIdentity shared with organization upon interest
 * - No applicant pools visible
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';

export const POST = withAuth(async (req, user) => {
      // Only operators can express interest
      if (user.userRole !== 'operator') {
        return createErrorResponse('Only operators can express interest', 403);
      }

      // Extract opportunity ID from URL path
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const opportunityId = pathSegments[3]; // /api/opportunities/[id]/interest

      // Parse request body
      const body = await req.json();
      const { declined = false } = body;

      // Verify the opportunity match exists for this user
      const capabilityIdentity = await prisma.capabilityIdentity.findUnique({
        where: { userId: user.id },
      });

      if (!capabilityIdentity) {
        return createErrorResponse(
          'Capability profile required. Please complete your profile.',
          400
        );
      }

      // Find the opportunity match
      const match = await prisma.opportunityMatch.findFirst({
        where: {
          id: opportunityId,
          capabilityIdentityId: capabilityIdentity.id,
        },
        include: {
          jobPosting: true,
        },
      });

      if (!match) {
        return createErrorResponse(
          'This opportunity is not available to you',
          403
        );
      }

      // Update the match status
      const updatedMatch = await prisma.opportunityMatch.update({
        where: { id: match.id },
        data: {
          status: declined ? 'rejected' : 'accepted',
          respondedAt: new Date(),
        },
      });

      // If accepted, create an Application record
      if (!declined) {
        // Get or create operator profile
        let operatorProfile = await prisma.operatorProfile.findUnique({
          where: { userId: user.id },
        });

        if (!operatorProfile) {
          // Create a basic operator profile if it doesn't exist
          operatorProfile = await prisma.operatorProfile.create({
            data: {
              userId: user.id,
              handle: user.handle,
              role: 'other',
              yearsExperience: 0,
              therapeuticAreas: [],
              trialPhases: [],
              siteTypes: [],
              certifications: [],
              languages: [],
            },
          });
        }

        // Check if application already exists
        const existingApplication = await prisma.application.findFirst({
          where: {
            jobPostingId: match.jobPostingId,
            operatorId: operatorProfile.id,
          },
        });

        if (!existingApplication) {
          // Create application record
          await prisma.application.create({
            data: {
              jobPostingId: match.jobPostingId,
              operatorId: operatorProfile.id,
              status: 'Applied',
            },
          });
        }

        // Log the interest expression
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'INTEREST_EXPRESSED',
            resourceType: 'OpportunityMatch',
            resourceId: match.id,
            details: {
              jobPostingId: match.jobPostingId,
              matchScore: match.matchScore,
            },
          },
        });
      } else {
        // Log the rejection
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'INTEREST_DECLINED',
            resourceType: 'OpportunityMatch',
            resourceId: match.id,
            details: {
              jobPostingId: match.jobPostingId,
            },
          },
        });
      }

      return createApiResponse({
        success: true,
        status: updatedMatch.status,
        matchId: match.id,
      });

    }, { requireAuth: true });