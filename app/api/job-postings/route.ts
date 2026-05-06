import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import { withAuth, applyRateLimit, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { RateLimitService } from '@/lib/rate-limiting';
import { AuditLogService, AuditEventType } from '@/lib/audit-logging';
import { InputSanitization } from '@/lib/input-sanitization';
import { redactContent } from '@/lib/redaction';

const rateLimitService = new RateLimitService();

/**
 * GET /api/job-postings - List all job postings
 * Public access - all verified users can view job postings
 * Opportunity matching is handled through the OpportunityMatch model
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const therapeuticArea = searchParams.get('therapeuticArea');
    const trialPhase = searchParams.get('trialPhase');
    const requiredRole = searchParams.get('requiredRole');
    const status = searchParams.get('status') || 'Open';

    // Build where clause
    const where: any = { status };
    if (therapeuticArea) where.therapeuticArea = therapeuticArea;
    if (trialPhase) where.trialPhase = trialPhase;
    if (requiredRole) where.requiredRole = requiredRole;

    const [postings, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              handle: true,
              roleCategory: true,
              companyCategory: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: postings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching job postings:', error);
    return createErrorResponse('Failed to fetch job postings', 500);
  }
});

/**
 * POST /api/job-postings - Create a new job posting
 * Requires authentication and verified organization user
 */
export const POST = withAuth(async (request, user) => {
    // Apply rate limiting for job posting creation
    const rateLimitResult = await RateLimitService.checkAPIRateLimit(`jobPostingCreation:${user.id}`);
    if (!rateLimitResult.success) {
      return createErrorResponse('Rate limit exceeded. You can create 5 job postings per hour.', 429);
    }

    // Check if user is verified
    if (user.verificationStatus !== 'Approved') {
      return createErrorResponse('Your account must be verified to post job openings', 403);
    }

    // Check if user is an organization
    if (user.userRole !== 'organization') {
      return createErrorResponse('Only verified organizations can post job openings', 403);
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'requiredRole', 'requiredSkills', 'duration', 'therapeuticArea', 'trialPhase', 'organizationType'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse(`${field} is required`, 400);
      }
    }

    // Sanitize input
    const sanitizedTitle = InputSanitization.sanitizeText(body.title);
    const sanitizedDescription = InputSanitization.sanitizeHTML(body.description);
    const sanitizedSkills = body.requiredSkills.map((skill: string) => InputSanitization.sanitizeText(skill));
    const sanitizedLocation = body.location ? InputSanitization.sanitizeText(body.location) : null;
    const sanitizedCompensation = body.compensationBand ? InputSanitization.sanitizeText(body.compensationBand) : null;

    // Create job posting
    const jobPosting = await prisma.jobPosting.create({
      data: {
        creatorId: user.id,
        title: sanitizedTitle,
        description: sanitizedDescription,
        contractorType: body.contractorType || 'Independent Contractor',
        requiredRole: body.requiredRole,
        requiredSkills: sanitizedSkills,
        experienceLevel: body.experienceLevel || 'Mid',
        duration: body.duration,
        therapeuticArea: body.therapeuticArea,
        trialPhase: body.trialPhase,
        location: sanitizedLocation,
        remoteCapable: body.remoteCapable || false,
        organizationType: body.organizationType,
        compensationBand: sanitizedCompensation,
        status: 'Open', // Postings go live immediately per beta requirements
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
      eventType: AuditEventType.JOB_POSTING_CREATED,
      resourceType: 'JobPosting',
      resourceId: jobPosting.id,
      metadata: { title: sanitizedTitle, organizationType: body.organizationType },
    });

    return NextResponse.json({
      success: true,
      data: jobPosting,
      message: 'Job posting created successfully',
    });
  });