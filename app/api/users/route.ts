import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { AuditLogService, AuditEventType } from '@/lib/audit-logging';
import { InputSanitization } from '@/lib/input-sanitization';

// Generate a random anonymous handle
function generateHandle(role: string = 'Operator'): string {
  const prefix = role === 'CRA' ? 'CRA' : 
                 role === 'SiteLead' ? 'SiteLead' : 
                 role === 'PM' ? 'PM' : 
                 role === 'CRC' ? 'CRC' : 'Operator';
  
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}_${randomNum}`;
}

/**
 * GET /api/users - Get current user profile
 * Requires authentication
 */
export const GET = withAuth(async (req, user) => {
      // Return current user's full profile with new architecture relations
      const userWithDetails = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          trustVector: true,
          capabilityIdentity: true,
          contributions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              contributionType: true,
              therapeuticArea: true,
              trialPhase: true,
              createdAt: true,
              _count: {
                select: { interactions: true }
              }
            }
          },
          _count: {
            select: {
              contributions: true,
              interactions: true,
            }
          }
        }
      });

      if (!userWithDetails) {
        return createErrorResponse('User not found', 404);
      }

      return createApiResponse(userWithDetails);

    }, { requireAuth: true });

/**
 * POST /api/users - Create a new user
 * Note: This should normally go through the onboarding/auth flow
 * This endpoint is kept for potential admin use
 */
export const POST = withAuth(async (req, user) => {
      const body = await req.json();
      const { clerkId, role = 'Operator', roleCategory, companyCategory } = body;

      // Validate required fields
      if (!clerkId) {
        return createErrorResponse('Clerk ID is required', 400);
      }

      // Sanitize inputs
      const sanitizedRole = InputSanitization.sanitizeText(role);
      const sanitizedRoleCategory = roleCategory ? InputSanitization.sanitizeText(roleCategory) : undefined;
      const sanitizedCompanyCategory = companyCategory ? InputSanitization.sanitizeText(companyCategory) : undefined;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { clerkId }
      });

      if (existingUser) {
        return createApiResponse(existingUser);
      }

      // Generate unique handle
      let handle = generateHandle(sanitizedRole);
      let attempts = 0;

      while (attempts < 10) {
        const existing = await prisma.user.findUnique({ where: { handle } });
        if (!existing) break;
        handle = generateHandle(sanitizedRole);
        attempts++;
      }

      // Create new user with TrustVector
      const newUser = await prisma.user.create({
        data: {
          clerkId: sanitizedRole === 'admin' ? clerkId : user.clerkId,
          handle,
          userRole: sanitizedRole,
          roleCategory: sanitizedRoleCategory || 'CRA',
          companyCategory: sanitizedCompanyCategory || 'independent',
          trustVector: {
            create: {}
          }
        }
      });

      AuditLogService.log({
        eventType: AuditEventType.USER_CREATED,
        userId: user.id,
        metadata: { newUserId: newUser.id, handle },
        severity: 'medium',
      });

      return createApiResponse(newUser, 201);

    }, { requireAuth: true });