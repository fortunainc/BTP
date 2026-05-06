import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { AuditLogService, AuditEventType } from '@/lib/audit-logging';

/**
 * GET /api/fee-records/[id] - Get a specific fee record
 * Requires authentication
 */
export const GET = withAuth(async (req, user) => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[3];

    if (!id || id.length > 100) {
      return createErrorResponse('Invalid fee record ID', 400);
    }

    const feeRecord = await prisma.feeRecord.findUnique({
      where: { id },
      include: {
        hire: {
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
    });

    if (!feeRecord) {
      return createErrorResponse('Fee record not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: feeRecord,
    });
  });

/**
 * PATCH /api/fee-records/[id] - Update fee record status
 * Requires authentication
 */
export const PATCH = withAuth(async (req, user) => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[3];

    if (!id || id.length > 100) {
      return createErrorResponse('Invalid fee record ID', 400);
    }

    const feeRecord = await prisma.feeRecord.findUnique({
      where: { id },
    });

    if (!feeRecord) {
      return createErrorResponse('Fee record not found', 404);
    }

    const body = await req.json();
    const { status, collectedAmount, notes } = body;

    // Validate status transition
    const validStatuses = ['Fee Pending', 'Invoiced', 'Collected', 'Waived'];
    if (!validStatuses.includes(status)) {
      return createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Update fee record
    const updateData: any = {
      status,
      updatedBy: user.id,
      notes,
    };

    if (status === 'Invoiced') {
      updateData.invoiceReference = body.invoiceReference;
      updateData.invoiceDate = new Date();
    }

    if (status === 'Collected') {
      if (!collectedAmount) {
        return createErrorResponse('collectedAmount is required when marking as Collected', 400);
      }
      updateData.collectedAmount = collectedAmount;
      updateData.collectedDate = new Date();
    }

    if (status === 'Waived') {
      updateData.waiverReason = body.waiverReason || notes;
      updateData.waivedBy = user.id;
      updateData.waivedAt = new Date();
    }

    const updatedFeeRecord = await prisma.feeRecord.update({
      where: { id },
      data: updateData,
      include: {
        hire: {
          include: {
            application: {
              include: {
                jobPosting: true,
                operator: {
                  select: {
                    id: true,
                    handle: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Log audit event
    await AuditLogService.log({
      userId: user.id,
      eventType: AuditEventType.CONTENT_UPDATED,
      resourceType: 'FeeRecord',
      resourceId: id,
      metadata: { 
        status, 
        collectedAmount: updateData.collectedAmount,
        invoiceReference: updateData.invoiceReference,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFeeRecord,
      message: `Fee record status updated to ${status}`,
    });
  });