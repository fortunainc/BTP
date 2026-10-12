import { createHmac } from 'crypto';
import type { NextRequest } from 'next/server';

function auditSecret(): string | null {
  return process.env.ADMIN_AUDIT_HASH_SALT || process.env.CLERK_SECRET_KEY || null;
}

function fingerprint(value: string | null): string | undefined {
  const secret = auditSecret();
  if (!secret || !value) return undefined;
  return `hmac:${createHmac('sha256', secret).update(value).digest('hex').slice(0, 24)}`;
}

/**
 * Returns stable, one-way request fingerprints for abuse investigations without
 * persisting readable IP addresses or full browser signatures.
 */
export function privacySafeAuditContext(request: NextRequest): { ipAddress?: string; userAgent?: string } {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip');
  return {
    ipAddress: fingerprint(ip),
    userAgent: fingerprint(request.headers.get('user-agent')),
  };
}
