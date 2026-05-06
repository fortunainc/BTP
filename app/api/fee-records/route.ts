import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { AuditLogService, AuditEventType } from '@/lib/audit-logging';

/**
 * GET /api/fee-records - Get all fee records
 * Requires authentication (admin access recommended)
 */

export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (status) where.status = status;

    // Get fee records
    const [feeRecords, total] = await Promise.all([
      prisma.feeRecord.findMany({
        where,
        include: {
          hire: {
            include: {
              application: {
                include: {
                  jobPosting: {
                    select: {
                      id: true,
                      title: true,
                      organizationType: true,
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
          updater: {
            select: {
              id: true,
              handle: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.feeRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: feeRecords,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  });
