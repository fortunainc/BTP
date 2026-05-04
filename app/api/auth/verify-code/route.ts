import { NextRequest, NextResponse } from 'next/server';
import { RateLimitService } from '@/lib/rate-limiting';
import { AuditLogService, AuditEventType } from '@/lib/audit-logging';
import { InputSanitization } from '@/lib/input-sanitization';
import { prisma } from '@/lib/prisma';
import { SimpleVerification } from '@/lib/simple-security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, handle, roleCategory } = body;

    // Validate input
    if (!email || !code || !handle || !roleCategory) {
      return NextResponse.json(
        { error: 'Email, code, handle, and role category are required' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedEmail = InputSanitization.sanitizeEmail(email);
    const sanitizedHandle = InputSanitization.sanitizeHandle(handle);
    const sanitizedCode = InputSanitization.sanitizeText(code);

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';

    // Check rate limit
    const rateLimitResult = await RateLimitService.checkAuthRateLimit(ip);
    if (!rateLimitResult.success) {
      AuditLogService.log({
        eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
        ipAddress: ip,
        metadata: { endpoint: 'verify-code', email: sanitizedEmail },
        severity: 'medium',
      });

      const headers = RateLimitService.getRateLimitHeaders(rateLimitResult);
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429, headers }
      );
    }

    // Verify code (in production, would use Redis)
    const storedCode = localStorage.getItem('verificationCode');
    const storedEmail = localStorage.getItem('verificationEmail');
    const expiry = parseInt(localStorage.getItem('verificationCodeExpiry') || '0');

    if (!storedCode || !storedEmail || Date.now() > expiry) {
      AuditLogService.log({
        eventType: AuditEventType.FAILED_AUTHENTICATION,
        ipAddress: ip,
        metadata: { email: sanitizedEmail, reason: 'Code expired or not found' },
        severity: 'medium',
      });

      return NextResponse.json(
        { error: 'Verification code expired or invalid' },
        { status: 400 }
      );
    }

    if (storedEmail !== sanitizedEmail || storedCode !== sanitizedCode) {
      AuditLogService.log({
        eventType: AuditEventType.FAILED_AUTHENTICATION,
        ipAddress: ip,
        metadata: { email: sanitizedEmail, reason: 'Invalid code' },
        severity: 'medium',
      });

      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Create anonymous user using SimpleVerification
    const verification = new SimpleVerification();
    const result = await verification.verifyAndCreateAccount(
      sanitizedEmail,
      sanitizedCode,
      sanitizedHandle,
      roleCategory as any
    );

    if (!result.success) {
      AuditLogService.log({
        eventType: AuditEventType.FAILED_AUTHENTICATION,
        ipAddress: ip,
        metadata: { email: sanitizedEmail, handle: sanitizedHandle, error: result.error },
        severity: 'medium',
      });

      return NextResponse.json(
        { error: result.error || 'Verification failed' },
        { status: 400 }
      );
    }

    // Log successful user creation
    AuditLogService.log({
      eventType: AuditEventType.USER_CREATED,
      userId: result.user?.id,
      ipAddress: ip,
      metadata: { handle: sanitizedHandle, roleCategory },
      severity: 'low',
    });

    // Clean up verification data
    localStorage.removeItem('verificationCode');
    localStorage.removeItem('verificationEmail');
    localStorage.removeItem('verificationCodeExpiry');

    const headers = RateLimitService.getRateLimitHeaders(rateLimitResult);
    return NextResponse.json(
      { 
        success: true, 
        user: {
          id: result.user?.id,
          handle: result.user?.handle,
          roleCategory: result.user?.roleCategory,
          companyCategory: result.user?.companyCategory,
        }
      },
      { headers }
    );

  } catch (error) {
    console.error('[Auth] Error verifying code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}