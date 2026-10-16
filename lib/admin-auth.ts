/**
 * Admin Authorization Module
 * 
 * CRITICAL: All admin access requires Clerk authentication and role verification.
 * No static keys or development bypasses allowed.
 * All access is comprehensively logged.
 */

import { isSuspendedMember, isAdminMember } from '@/lib/access-policy';
import { checkWriteRateLimit } from '@/lib/write-rate-limit';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAdminAccess } from '@/lib/analytics-tracker';
import { privacySafeAuditContext } from '@/lib/privacy-audit';

// Admin roles that can access analytics and trust-safety panels


// Valid reasons for trust-safety investigation access
export const VALID_INVESTIGATION_REASONS = [
  'abuse',
  'spam',
  'legal_issue',
  'suspected_deanonymization_attack',
  'safety_escalation',
  'content_report',
  'user_complaint',
  'security_incident',
] as const;

export type InvestigationReason = typeof VALID_INVESTIGATION_REASONS[number];

/**
 * Result of admin authorization check
 */
export interface AdminAuthResult {
  success: boolean;
  userId?: string;
  clerkId?: string;
  handle?: string;
  role?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Authenticate and verify admin access using Clerk
 * 
 * This function:
 * 1. Verifies Clerk session is valid
 * 2. Checks user exists in database
 * 3. Verifies user has admin/founder role
 * 4. Logs the access attempt
 */
export async function verifyAdminAccess(request: NextRequest): Promise<AdminAuthResult> {
  try {
    // Step 1: Get Clerk authentication
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return {
        success: false,
        error: 'Authentication required. Please sign in.',
        statusCode: 401,
      };
    }

    // Step 2: Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        handle: true,
        userRole: true,
        verificationStatus: true,
        isSuspended: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found in database.',
        statusCode: 404,
      };
    }

    // Step 3: Check if user is suspended
    if (isSuspendedMember(user)) {
      return {
        success: false,
        error: 'Account is suspended.',
        statusCode: 403,
      };
    }

    // Step 4: Verify admin role
    if (!isAdminMember(user)) {
      // Log unauthorized access attempt
      const auditContext = privacySafeAuditContext(request);
      
      await logAdminAccess({
        adminUserId: user.id,
        action: 'unauthorized_access_attempt',
        targetType: 'AdminPanel',
        targetId: request.nextUrl.pathname,
        fieldsAccessed: [],
        ...auditContext,
      });

      return {
        success: false,
        error: 'Access denied. Admin privileges required.',
        statusCode: 403,
      };
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const budget = await checkWriteRateLimit(user.id, request.nextUrl.pathname);
      if (!budget.allowed) return { success: false, error: 'Too many requests; retry shortly.', statusCode: 429 };
    }
    // Step 5: Log successful admin access
    const auditContext = privacySafeAuditContext(request);

    await logAdminAccess({
      adminUserId: user.id,
      action: 'admin_access_granted',
      targetType: 'AdminPanel',
      targetId: request.nextUrl.pathname,
      fieldsAccessed: ['dashboard_access'],
      ...auditContext,
    });

    return {
      success: true,
      userId: user.id,
      clerkId: user.clerkId!,
      handle: user.handle,
      role: user.userRole,
    };

  } catch (error) {
    console.error('[Admin Auth] Error verifying admin access:', error);
    return {
      success: false,
      error: 'Internal server error during authentication.',
      statusCode: 500,
    };
  }
}

/**
 * Verify trust-safety investigation access with reason
 * 
 * This requires:
 * 1. Valid admin authentication
 * 2. A valid reason from the allowed list
 */
export async function verifyInvestigationAccess(
  request: NextRequest,
  reason?: string
): Promise<AdminAuthResult & { investigationReason?: string }> {
  // First verify admin access
  const adminAuth = await verifyAdminAccess(request);
  
  if (!adminAuth.success) {
    return adminAuth;
  }

  // Verify reason is provided and valid
  if (!reason) {
    return {
      success: false,
      error: 'Investigation reason is required for Trust & Safety access.',
      statusCode: 400,
    };
  }

  if (!VALID_INVESTIGATION_REASONS.includes(reason as InvestigationReason)) {
    return {
      success: false,
      error: `Invalid reason. Allowed reasons: ${VALID_INVESTIGATION_REASONS.join(', ')}`,
      statusCode: 400,
    };
  }

  // Log the investigation access with reason
  const auditContext = privacySafeAuditContext(request);

  await logAdminAccess({
    adminUserId: adminAuth.userId!,
    action: 'investigation_access',
    reason: reason,
    targetType: 'TrustSafetyPanel',
    targetId: request.nextUrl.pathname,
    fieldsAccessed: [],
    ...auditContext,
  });

  return {
    ...adminAuth,
    investigationReason: reason,
  };
}

/**
 * Higher-order function to wrap admin API handlers
 */
export function withAdminAuth(
  handler: (request: NextRequest, admin: AdminAuthResult) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const adminAuth = await verifyAdminAccess(request);
    
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.statusCode || 403 }
      );
    }
    
    return handler(request, adminAuth);
  };
}

/**
 * Higher-order function for trust-safety investigation handlers
 */
export function withInvestigationAuth(
  handler: (request: NextRequest, admin: AdminAuthResult, reason: string) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || undefined;
    
    const investigationAuth = await verifyInvestigationAccess(request, reason);
    
    if (!investigationAuth.success) {
      return NextResponse.json(
        { error: investigationAuth.error },
        { status: investigationAuth.statusCode || 403 }
      );
    }
    
    return handler(request, investigationAuth, investigationAuth.investigationReason!);
  };
}
