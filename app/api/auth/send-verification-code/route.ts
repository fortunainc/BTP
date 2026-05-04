import { NextRequest, NextResponse } from 'next/server';
import { EmailVerificationService } from '@/lib/email-verification';
import { RateLimitService } from '@/lib/rate-limiting';
import { AuditLogService, AuditEventType } from '@/lib/audit-logging';
import { InputSanitization } from '@/lib/input-sanitization';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, handle } = body;

    // Validate input
    if (!email || !code || !handle) {
      return NextResponse.json(
        { error: 'Email, code, and handle are required' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedEmail = InputSanitization.sanitizeEmail(email);
    const sanitizedHandle = InputSanitization.sanitizeHandle(handle);

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';

    // Check rate limit
    const rateLimitResult = await RateLimitService.checkEmailVerificationRateLimit(ip);
    if (!rateLimitResult.success) {
      AuditLogService.log({
        eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
        ipAddress: ip,
        metadata: { endpoint: 'send-verification-code', email: sanitizedEmail },
        severity: 'medium',
      });

      const headers = RateLimitService.getRateLimitHeaders(rateLimitResult);
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429, headers }
      );
    }

    // Send verification email
    const result = await EmailVerificationService.sendVerificationCode({
      to: sanitizedEmail,
      code,
      handle: sanitizedHandle,
    });

    if (!result.success) {
      AuditLogService.log({
        eventType: AuditEventType.EMAIL_VERIFICATION_FAILED,
        ipAddress: ip,
        metadata: { email: sanitizedEmail, error: result.error },
        severity: 'medium',
      });

      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Log successful email send
    AuditLogService.log({
      eventType: AuditEventType.EMAIL_VERIFICATION_FAILED, // Will be updated to EMAIL_SENT
      ipAddress: ip,
      metadata: { email: sanitizedEmail, handle: sanitizedHandle },
      severity: 'low',
    });

    const headers = RateLimitService.getRateLimitHeaders(rateLimitResult);
    return NextResponse.json(
      { success: true, message: 'Verification code sent' },
      { headers }
    );

  } catch (error) {
    console.error('[Auth] Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}