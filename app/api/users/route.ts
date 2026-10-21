import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';


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
