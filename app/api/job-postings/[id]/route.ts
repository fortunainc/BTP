import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { AuditLogService, AuditEventType } from '@/lib/audit-logging';

/**
 * GET /api/job-postings/[id] - Get a specific job posting
 * No authentication required for viewing (per beta requirements)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length > 100) {
      return createErrorResponse('Invalid job posting ID', 400);
    }

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            handle: true,
            roleCategory: true,
            companyCategory: true,
          },
        },
        applications: {
          include: {
            operator: {
              select: {
                id: true,
                handle: true,
                role: true,
                yearsExperience: true,
                therapeuticAreas: true,
                trialPhases: true,
                location: true,
              },
            },
          },
          orderBy: { appliedAt: 'desc' },
        },
      },
    });

    if (!jobPosting) {
      return createErrorResponse('Job posting not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: jobPosting,
    });
  } catch (error) {
    console.error('Error fetching job posting:', error);
    return createErrorResponse('Failed to fetch job posting', 500);
  }
}

/**
 * PATCH /api/job-postings/[id] - Update a job posting
 * Requires authentication and ownership
 */
export const PATCH = withAuth(async (req, user) => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[3];

    if (!id || id.length > 100) {
      return createErrorResponse('Invalid job posting ID', 400);
    }

    // Check ownership
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!jobPosting) {
      return createErrorResponse('Job posting not found', 404);
    }

    if (jobPosting.creatorId !== user.id) {
      return createErrorResponse('You can only update your own job postings', 403);
    }

    const body = await req.json();
    
    // Update job posting
    const updatedPosting = await prisma.jobPosting.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.requiredSkills !== undefined && { requiredSkills: body.requiredSkills }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.compensationBand !== undefined && { compensationBand: body.compensationBand }),
      },
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
    });

    // Log audit event
    await AuditLogService.log({
      userId: user.id,
      eventType: AuditEventType.JOB_POSTING_UPDATED,
      resourceType: 'JobPosting',
      resourceId: id,
      metadata: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json({
      success: true,
      data: updatedPosting,
      message: 'Job posting updated successfully',
    });
  });

/**
 * DELETE /api/job-postings/[id] - Delete a job posting
 * Requires authentication and ownership
 */
export const DELETE = withAuth(async (req, user) => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[3];

    if (!id || id.length > 100) {
      return createErrorResponse('Invalid job posting ID', 400);
    }

    // Check ownership
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!jobPosting) {
      return createErrorResponse('Job posting not found', 404);
    }

    if (jobPosting.creatorId !== user.id) {
      return createErrorResponse('You can only delete your own job postings', 403);
    }

    await prisma.jobPosting.delete({
      where: { id },
    });

    // Log audit event
    await AuditLogService.log({
      userId: user.id,
      eventType: AuditEventType.CONTENT_REMOVED,
      resourceType: 'JobPosting',
      resourceId: id,
      metadata: { title: jobPosting.title },
    });

    return NextResponse.json({
      success: true,
      message: 'Job posting deleted successfully',
    });
  });