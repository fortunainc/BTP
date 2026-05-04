import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { AuditLogService, AuditEventType } from '@/lib/audit-logging';
import { RateLimitService } from '@/lib/rate-limiting';

/**
 * Authentication result interface
 */
export interface AuthResult {
  success: boolean;
  userId?: string;
  user?: {
    id: string;
    clerkId: string;
    handle: string;
    roleCategory?: string;
    companyCategory?: string;
  };
  error?: string;
  statusCode?: number;
}

/**
 * API Configuration for authentication requirements
 */
export interface APIAuthConfig {
  requireAuth?: boolean; // Require authentication (default: true)
  allowedRoles?: string[]; // Restrict to specific roles
  rateLimit?: {
    check: (ip: string) => Promise<any>;
    key: string;
  };
}

/**
 * Authenticate user from Clerk session
 * This is the core authentication function for all API routes
 */
export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  try {
    // Get Clerk authentication
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
        statusCode: 401,
      };
    }

    // Get client IP for audit logging
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';

    // Log successful authentication
    AuditLogService.log({
      eventType: AuditEventType.USER_LOGIN,
      userId,
      ipAddress: ip,
      metadata: { endpoint: request.nextUrl.pathname },
      severity: 'low',
    });

    return {
      success: true,
      userId,
    };

  } catch (error) {
    console.error('[API Auth] Authentication error:', error);
    
    // Get client IP for audit logging
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';

    AuditLogService.log({
      eventType: AuditEventType.FAILED_AUTHENTICATION,
      ipAddress: ip,
      metadata: { 
        endpoint: request.nextUrl.pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      severity: 'medium',
    });

    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 500,
    };
  }
}

/**
 * Get full user details from database
 */
export async function getUserDetails(clerkId: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        handle: true,
        userRole: true,
        roleCategory: true,
        companyCategory: true,
        verificationStatus: true,
        trustScore: true,
      },
    });

    return user;
  } catch (error) {
    console.error('[API Auth] Error fetching user details:', error);
    return null;
  }
}

/**
 * Apply rate limiting to API route
 */
export async function applyRateLimit(
  request: NextRequest,
  checkFn: (ip: string) => Promise<any>,
  endpoint: string
): Promise<{ success: boolean; error?: string; headers?: Headers } | null> {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';

    const rateLimitResult = await checkFn(ip);

    if (!rateLimitResult.success) {
      AuditLogService.log({
        eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
        ipAddress: ip,
        metadata: { endpoint },
        severity: 'medium',
      });

      const headersObj = RateLimitService.getRateLimitHeaders(rateLimitResult);
      const headers = new Headers(headersObj);
      return {
        success: false,
        error: rateLimitResult.error,
        headers,
      };
    }

    return null; // Rate limit check passed
  } catch (error) {
    console.error('[API Auth] Rate limiting error:', error);
    // Fail open - allow request if rate limiting fails
    return null;
  }
}

/**
 * Higher-order function to wrap API handlers with authentication
 */
export function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
  config: APIAuthConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Apply rate limiting if configured
      if (config.rateLimit) {
        const rateLimitCheck = await applyRateLimit(
          request,
          config.rateLimit.check,
          config.rateLimit.key
        );

        if (rateLimitCheck && !rateLimitCheck.success) {
          return NextResponse.json(
            { error: rateLimitCheck.error },
            { 
              status: 429,
              headers: rateLimitCheck.headers,
            }
          );
        }
      }

      // Check if authentication is required
      const requireAuth = config.requireAuth !== false; // Default to true

      if (requireAuth) {
        // Authenticate user
        const authResult = await authenticateUser(request);

        if (!authResult.success) {
          return NextResponse.json(
            { error: authResult.error || 'Authentication required' },
            { status: authResult.statusCode || 401 }
          );
        }

        // Get full user details
        const userDetails = await getUserDetails(authResult.userId!);

        if (!userDetails) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Check role restrictions if configured
        if (config.allowedRoles && config.allowedRoles.length > 0) {
          if (!userDetails.roleCategory || !config.allowedRoles.includes(userDetails.roleCategory)) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        }

        // Call the original handler with user details
        return await handler(request, userDetails);
      } else {
        // No authentication required, call handler without user
        return await handler(request, null);
      }

    } catch (error) {
      console.error('[API Auth] Handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Create standardized API response with rate limit headers
 */
export function createApiResponse(
  data: any,
  status: number = 200,
  rateLimitResult?: any
): NextResponse {
  const headers: Record<string, string> = {};

  if (rateLimitResult) {
    const rateLimitHeaders = RateLimitService.getRateLimitHeaders(rateLimitResult);
    Object.assign(headers, rateLimitHeaders);
  }

  return NextResponse.json(data, { status, headers });
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: any
): NextResponse {
  const response: any = { error };
  
  if (details) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}