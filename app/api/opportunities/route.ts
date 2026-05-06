/**
 * Opportunities API - Opportunity Realm
 * 
 * Brokered allocation system for matching operators to opportunities
 * 
 * Architecture Rules:
 * - Uses OpportunityMatch model (NOT direct JobPosting access)
 * - Uses CapabilityIdentity model (separate from User)
 * - NO browsing of opportunities (matched allocation only)
 * - NO applicant pools visible to organizations
 * - Operators see matched opportunities only
 * - Organizations see anonymized Capability Identities
 * - Cross-realm correlation prevention enforced
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { 
  sanitizeOpportunityMatchData,
  calculateCorrelationRisk
} from '@/lib/anti-correlation';
import { checkPriorityAccess } from '@/lib/trust-vector';

/**
 * GET /api/opportunities
 * 
 * Get matched opportunities for operators (NOT browsable)
 */
export const GET = withAuth(async (req, user) => {
      // Only operators can view matched opportunities
      if (user.userRole !== 'operator') {
        return createErrorResponse(
          'Only operators can view opportunities',
          403
        );
      }

      // Check priority access
      const hasPriorityAccess = await checkPriorityAccess(user.id);

      // Get user's capability identity
      const capabilityIdentity = await prisma.capabilityIdentity.findUnique({
        where: { userId: user.id }
      });

      if (!capabilityIdentity) {
        return createErrorResponse(
          'Capability profile required to view opportunities. Please complete your profile.',
          400
        );
      }

      // Get matched opportunities
      const matches = await prisma.opportunityMatch.findMany({
        where: {
          capabilityIdentityId: capabilityIdentity.id,
          status: { in: ['pending', 'viewed'] }
        },
        include: {
          jobPosting: {
            select: {
              id: true,
              title: true,
              therapeuticArea: true,
              trialPhase: true,
              location: true,
              remoteCapable: true,
              priorityLevel: true,
              requiredRole: true,
              experienceLevel: true,
              duration: true,
              compensationBand: true,
              organizationType: true,
              createdAt: true
            }
          }
        },
        orderBy: [
          { matchScore: 'desc' },
          { matchedAt: 'desc' }
        ],
        take: hasPriorityAccess ? 20 : 10
      });

      // Update viewed status
      if (matches.length > 0) {
        await prisma.opportunityMatch.updateMany({
          where: {
            id: { in: matches.map(m => m.id) },
            status: 'pending'
          },
          data: {
            status: 'viewed',
            viewedAt: new Date()
          }
        });
      }

      // Sanitize match data for display
      const sanitizedMatches = matches.map(match => ({
        id: match.id,
        matchScore: Math.round(match.matchScore * 100), // Percentage for display
        opportunity: sanitizeOpportunityMatchData({
          ...match.jobPosting,
          matchId: match.id
        }),
        matchedAt: match.matchedAt
      }));

      // Log the access
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'OPPORTUNITY_VIEW',
          resourceType: 'OpportunityMatch',
          details: {
            matchCount: matches.length,
            hasPriorityAccess
          }
        }
      });

      return createApiResponse({
        opportunities: sanitizedMatches,
        matchMetadata: {
          totalMatches: matches.length,
          priorityAccess: hasPriorityAccess
        },
        profileCompleteness: calculateProfileCompleteness(capabilityIdentity)
      });

    }, { requireAuth: true });

/**
 * POST /api/opportunities
 * 
 * Create a new opportunity (organizations only)
 */
export const POST = withAuth(async (req, user) => {
      // Only organizations can create opportunities
      if (user.userRole !== 'organization') {
        return createErrorResponse(
          'Only organizations can create opportunities',
          403
        );
      }

      const body = await req.json();
      const {
        title,
        description,
        therapeuticArea,
        trialPhase,
        requiredRole,
        requiredSkills,
        experienceLevel,
        duration,
        location,
        remoteCapable,
        organizationType,
        compensationBand,
        priorityLevel
      } = body;

      // Validate required fields
      if (!title || !description) {
        return createErrorResponse('Title and description are required', 400);
      }

      // Create the job posting
      const jobPosting = await prisma.jobPosting.create({
        data: {
          creatorId: user.id,
          title,
          description,
          therapeuticArea: therapeuticArea || 'Other',
          trialPhase: trialPhase || 'Phase 3',
          requiredRole: requiredRole || 'Other',
          requiredSkills: requiredSkills || [],
          experienceLevel: experienceLevel || 'Mid',
          duration: duration || '3 months',
          location: location || null,
          remoteCapable: remoteCapable || false,
          organizationType: organizationType || 'cro',
          contractorType: 'Independent Contractor',
          compensationBand: compensationBand || null,
          priorityLevel: priorityLevel || 'Normal',
          status: 'Open'
        }
      });

      // Trigger matching algorithm to create OpportunityMatches
      try {
        const { createMatchesForJobPosting } = await import('@/lib/matching');
        const matchesCreated = await createMatchesForJobPosting(jobPosting.id);
        console.log(`Created ${matchesCreated} matches for job posting ${jobPosting.id}`);
      } catch (matchingError) {
        console.error('Matching algorithm error:', matchingError);
        // Don't fail the request if matching fails
      }

      // Log creation
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'OPPORTUNITY_CREATED',
          resourceType: 'JobPosting',
          resourceId: jobPosting.id,
          details: {
            therapeuticArea,
            requiredRole,
            priorityLevel
          }
        }
      });

      return createApiResponse({
        success: true,
        id: jobPosting.id,
        message: 'Opportunity created. Matching will begin automatically.'
      });

    }, { requireAuth: true });

/**
 * Calculate profile completeness percentage
 */
function calculateProfileCompleteness(profile: Record<string, unknown>): number {
  const fields = [
    'therapeuticAreas',
    'trialPhases',
    'reliabilityScore',
    'responsivenessScore',
    'isAvailable'
  ];
  
  const filledFields = fields.filter(field => {
    const value = profile[field];
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined;
  });
  
  return Math.round((filledFields.length / fields.length) * 100);
}

