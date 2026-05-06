import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { AuditLogService, AuditEventType } from '@/lib/audit-logging';
import { InputSanitization } from '@/lib/input-sanitization';

/**
 * GET /api/applications/[id] - Get a specific application
 * Requires authentication
 */
export const GET = withAuth(async (req, user) => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[3];

    if (!id || id.length > 100) {
      return createErrorResponse('Invalid application ID', 400);
    }

    const application = await prisma.application.findUnique({
      where: { id },
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
            userId: true,
            handle: true,
            role: true,
            yearsExperience: true,
            therapeuticAreas: true,
            trialPhases: true,
            siteTypes: true,
            certifications: true,
            languages: true,
            location: true,
            timezone: true,
            isAvailable: true,
            availabilityNote: true,
          },
        },
        conversation: {
          include: {
            messages: {
              include: {
                sender: {
                  select: {
                    id: true,
                    handle: true,
                    roleCategory: true,
                    companyCategory: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!application) {
      return createErrorResponse('Application not found', 404);
    }

    // Check access permissions
    const isOwner = application.operator.userId === user.id;
    const isJobCreator = application.jobPosting.creatorId === user.id;

    if (!isOwner && !isJobCreator) {
      return createErrorResponse('You do not have permission to view this application', 403);
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  });

/**
 * PATCH /api/applications/[id] - Update application status
 * Requires authentication and job posting ownership
 */
export const PATCH = withAuth(async (req, user) => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[3];

    if (!id || id.length > 100) {
      return createErrorResponse('Invalid application ID', 400);
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        jobPosting: true,
      },
    });

    if (!application) {
      return createErrorResponse('Application not found', 404);
    }

    // Only job posting creator can update status
    if (application.jobPosting.creatorId !== user.id) {
      return createErrorResponse('Only the job posting creator can update application status', 403);
    }

    const body = await req.json();
    const { status } = body;

    // Validate status transition
    const validStatuses = ['Applied', 'Under Review', 'Rejected', 'Hired'];
    if (!validStatuses.includes(status)) {
      return createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Update application
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: user.id,
        notes: body.notes,
      },
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
    });

    // Log audit event
    await AuditLogService.log({
      userId: user.id,
      eventType: AuditEventType.THREAD_UPDATED,
      resourceType: 'Application',
      resourceId: id,
      metadata: { status, operatorId: application.operatorId },
    });

    // If status is "Hired", create hire record and fee record
    if (status === 'Hired') {
      // Check if hire record already exists
      const existingHire = await prisma.hire.findUnique({
        where: { applicationId: id },
      });

      if (!existingHire) {
        // Create hire record
        const hire = await prisma.hire.create({
          data: {
            applicationId: id,
            jobPostingId: application.jobPostingId,
            operatorId: application.operatorId,
            organizationId: user.id,
            feePercentage: 0.25, // 25% platform fee
            createdBy: user.id,
          },
        });

        // Create fee record
        const feeRecord = await prisma.feeRecord.create({
          data: {
            hireId: hire.id,
            feePercentage: 0.25,
            status: 'Fee Pending',
            updatedBy: user.id,
          },
        });

        // Log hire event
        await AuditLogService.log({
          userId: user.id,
          eventType: AuditEventType.HIRE_CREATED,
          resourceType: 'Hire',
          resourceId: hire.id,
          metadata: { 
            applicationId: id,
            operatorId: application.operatorId,
            jobPostingId: application.jobPostingId,
            feePercentage: 0.25,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message: `Application status updated to ${status}`,
    });
  });

/**
 * DELETE /api/applications/[id] - Delete an application
 * Requires authentication and operator ownership
 */
export const DELETE = withAuth(async (req, user) => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[3];

    if (!id || id.length > 100) {
      return createErrorResponse('Invalid application ID', 400);
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        operator: true,
      },
    });

    if (!application) {
      return createErrorResponse('Application not found', 404);
    }

    // Only operator who applied can delete
    if (application.operator.userId !== user.id) {
      return createErrorResponse('You can only delete your own applications', 403);
    }

    // Prevent deletion if already hired
    if (application.status === 'Hired') {
      return createErrorResponse('Cannot delete an application that has been hired', 400);
    }

    await prisma.application.delete({
      where: { id },
    });

    // Log audit event
    await AuditLogService.log({
      userId: user.id,
      eventType: AuditEventType.CONTENT_REMOVED,
      resourceType: 'Application',
      resourceId: id,
      metadata: { jobPostingId: application.jobPostingId },
    });

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    });
  });