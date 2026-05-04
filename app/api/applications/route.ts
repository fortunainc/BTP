import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { RateLimitService } from '@/lib/rate-limiting';
import { AuditLogService, AuditEventType } from '@/lib/audit-logging';
import { InputSanitization } from '@/lib/input-sanitization';

/**
 * GET /api/applications - Get applications for current user
 * Requires authentication
 */

export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const jobPostingId = searchParams.get('jobPostingId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if user is an operator
    if (user.userRole !== 'operator') {
      return createErrorResponse('Only operators can view their applications', 403);
    }

    // Build where clause
    const where: any = { operatorId: user.id };
    if (jobPostingId) where.jobPostingId = jobPostingId;
    if (status) where.status = status;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
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
        },
        orderBy: { appliedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: applications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  });

/**
 * POST /api/applications - Apply to a job posting
 * Requires authentication and verified operator
 */

export const POST = withAuth(async (req, user) => {
    // Apply rate limiting for applications
    const rateLimitResult = await RateLimitService.checkAPIRateLimit(`application:${user.id}`);
    if (!rateLimitResult.success) {
      return createErrorResponse('Rate limit exceeded. You can submit 10 applications per hour.', 429);
    }

    // Check if user is verified
    if (user.verificationStatus !== 'Approved') {
      return createErrorResponse('Your account must be verified to apply for positions', 403);
    }

    // Check if user is an operator
    if (user.userRole !== 'operator') {
      return createErrorResponse('Only verified operators can apply for positions', 403);
    }

    // Get operator profile
    const operatorProfile = await prisma.operatorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!operatorProfile) {
      return createErrorResponse('Operator profile not found', 404);
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.jobPostingId) {
      return createErrorResponse('jobPostingId is required', 400);
    }

    // Check if job posting exists and is open
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: body.jobPostingId },
    });

    if (!jobPosting) {
      return createErrorResponse('Job posting not found', 404);
    }

    if (jobPosting.status !== 'Open') {
      return createErrorResponse('This job posting is not accepting applications', 400);
    }

    // Check if already applied (using operatorProfile.id for the foreign key)
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobPostingId_operatorId: {
          jobPostingId: body.jobPostingId,
          operatorId: operatorProfile.id,
        },
      },
    });

    if (existingApplication) {
      return createErrorResponse('You have already applied to this position', 400);
    }

    // Sanitize message
    const sanitizedMessage = body.message ? InputSanitization.sanitizeHTML(body.message) : null;

    // Create application (use operatorProfile.id for the foreign key relationship)
    const application = await prisma.application.create({
      data: {
        jobPostingId: body.jobPostingId,
        operatorId: operatorProfile.id,
        message: sanitizedMessage,
        status: 'Applied',
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
      },
    });

    // Create conversation for messaging
    const conversation = await prisma.conversation.create({
      data: {
        applicationId: application.id,
        jobPostingId: body.jobPostingId,
        organizationId: jobPosting.creatorId!,
        operatorId: user.id,
      },
    });

    // Link conversation to application (conversation is automatically linked via applicationId in Conversation model)
    // No manual update needed as the relationship is already established

    // Log audit event
    await AuditLogService.log({
      userId: user.id,
      eventType: AuditEventType.APPLICATION_CREATED,
      resourceType: 'Application',
      resourceId: application.id,
      metadata: { jobPostingId: body.jobPostingId },
    });

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
    });
  });
