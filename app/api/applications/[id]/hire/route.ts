/**
 * Application Hire API
 * 
 * POST /api/applications/[id]/hire - Create a hire from an application
 * 
 * This creates:
 * 1. Hire record with 25% platform fee
 * 2. FeeRecord for tracking
 * 3. Updates application status to Hired
 * 4. Updates job posting status if filled
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';

// Platform fee percentage (25%)
const PLATFORM_FEE_PERCENTAGE = 0.25;

export const POST = withAuth(async (req, user) => {
      // Extract applicationId from URL path: /api/applications/[id]/hire
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const applicationId = pathSegments[3]; // /api/applications/[id]/hire

      // Only organizations can hire
      if (user.userRole !== 'organization') {
        return createErrorResponse('Only organizations can create hires', 403);
      }

      const body = await req.json();
      const { 
        compensationBand, 
        contractDuration 
      } = body;

      // Get the application with all related data
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          jobPosting: true,
          operator: true,
        },
      });

      if (!application) {
        return createErrorResponse('Application not found', 404);
      }

      // Verify this organization owns the job posting
      if (application.jobPosting.creatorId !== user.id) {
        return createErrorResponse(
          'You can only hire for your own job postings',
          403
        );
      }

      // Check if already hired
      if (application.status === 'Hired') {
        return createErrorResponse('This application has already been hired', 400);
      }

      // Check if there's an existing hire for this application
      const existingHire = await prisma.hire.findUnique({
        where: { applicationId },
      });

      if (existingHire) {
        return createErrorResponse('A hire record already exists for this application', 400);
      }

      // Calculate estimated fee
      const estimatedCompensation = parseCompensationBand(compensationBand || application.jobPosting.compensationBand);
      const estimatedFee = estimatedCompensation ? estimatedCompensation * PLATFORM_FEE_PERCENTAGE : null;

      // Create hire and fee record in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the hire record
        const hire = await tx.hire.create({
          data: {
            applicationId,
            jobPostingId: application.jobPostingId,
            operatorId: application.operatorId,
            organizationId: user.id,
            compensationBand: compensationBand || application.jobPosting.compensationBand,
            contractDuration: contractDuration || application.jobPosting.duration,
            feePercentage: PLATFORM_FEE_PERCENTAGE,
            estimatedFee,
            createdBy: user.id,
          },
        });

        // Create the fee record
        const feeRecord = await tx.feeRecord.create({
          data: {
            hireId: hire.id,
            feePercentage: PLATFORM_FEE_PERCENTAGE,
            estimatedCompensation,
            feeOwed: estimatedFee,
            status: 'Fee Pending',
          },
        });

        // Update application status
        await tx.application.update({
          where: { id: applicationId },
          data: { 
            status: 'Hired',
            reviewedAt: new Date(),
            reviewedBy: user.id,
          },
        });

        // Update job posting status to Filled
        await tx.jobPosting.update({
          where: { id: application.jobPostingId },
          data: { status: 'Filled' },
        });

        return { hire, feeRecord };
      });

      // Log the hire
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'HIRE_CREATED',
          resourceType: 'Hire',
          resourceId: result.hire.id,
          details: {
            applicationId,
            jobPostingId: application.jobPostingId,
            operatorId: application.operatorId,
            compensationBand: result.hire.compensationBand,
            estimatedFee: result.hire.estimatedFee,
          },
        },
      });

      return createApiResponse({
        success: true,
        hire: {
          id: result.hire.id,
          hireDate: result.hire.hireDate,
          compensationBand: result.hire.compensationBand,
          contractDuration: result.hire.contractDuration,
          feePercentage: result.hire.feePercentage,
          estimatedFee: result.hire.estimatedFee,
        },
        feeRecord: {
          id: result.feeRecord.id,
          status: result.feeRecord.status,
          feeOwed: result.feeRecord.feeOwed,
        },
      });

    }, { requireAuth: true });

/**
 * Parse compensation band string to estimated annual value
 * Examples: "$50-75/hr", "$75-100/hr", "$100k-150k"
 */
function parseCompensationBand(compensationBand: string | null): number | null {
  if (!compensationBand) return null;
  
  // Try to extract numbers from the string
  const numbers = compensationBand.match(/\d+/g);
  if (!numbers || numbers.length < 2) return null;
  
  // Get the range midpoint
  const low = parseInt(numbers[0]);
  const high = parseInt(numbers[1]);
  const mid = (low + high) / 2;
  
  // Check if it's hourly or annual
  if (compensationBand.toLowerCase().includes('/hr') || 
      compensationBand.toLowerCase().includes('hour')) {
    // Assume 2000 hours per year
    return mid * 2000;
  } else if (compensationBand.toLowerCase().includes('k')) {
    // Already in thousands
    return mid * 1000;
  }
  
  // Default: assume annual
  return mid;
}
