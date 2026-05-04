import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';

/**
 * GET /api/hires - Get all hire records
 * Requires authentication
 */

export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const jobPostingId = searchParams.get('jobPostingId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (jobPostingId) where.jobPostingId = jobPostingId;

    // Get hires
    const [hires, total] = await Promise.all([
      prisma.hire.findMany({
        where,
        include: {
          application: {
            include: {
              jobPosting: {
                include: {
                  creator: {
                    select: {
                      id: true,
                      handle: true,
                      roleCategory: true,
                      companyCategory: true,
                    },
                  },
                },
              },
              operator: {
                select: {
                  id: true,
                  handle: true,
                  role: true,
                },
              },
            },
          },
          feeRecord: true,
          creator: {
            select: {
              id: true,
              handle: true,
              roleCategory: true,
              companyCategory: true,
            },
          },
        },
        orderBy: { hireDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.hire.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: hires,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  });
