/**
 * Rate Limiting Service.
 *
 * Uses Upstash Redis when configured. In private alpha, Redis is optional:
 * if UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are missing, checks fail open
 * without initializing Upstash or blocking core operator flows.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  error?: string;
}

type LimiterName =
  | 'api'
  | 'auth'
  | 'emailVerification'
  | 'threadCreation'
  | 'replyCreation'
  | 'pollCreation';

const FALLBACK_LIMITS: Record<LimiterName, { limit: number; windowMs: number }> = {
  api: { limit: 100, windowMs: 10 * 60 * 1000 },
  auth: { limit: 5, windowMs: 15 * 60 * 1000 },
  emailVerification: { limit: 3, windowMs: 60 * 60 * 1000 },
  threadCreation: { limit: 5, windowMs: 60 * 60 * 1000 },
  replyCreation: { limit: 20, windowMs: 60 * 60 * 1000 },
  pollCreation: { limit: 3, windowMs: 24 * 60 * 60 * 1000 },
};

const hasRedisConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL as string,
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    })
  : null;

function createLimiter(
  limiter: ReturnType<typeof Ratelimit.slidingWindow>
): Ratelimit | null {
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter,
    analytics: true,
  });
}

// Create rate limiter instances for different use cases.
// Values are null when Redis is not configured; RateLimitService fails open.
export const rateLimiters = {
  // API routes: 100 requests per 10 minutes
  api: createLimiter(Ratelimit.slidingWindow(100, '10 m')),

  // Authentication: 5 requests per 15 minutes
  auth: createLimiter(Ratelimit.slidingWindow(5, '15 m')),

  // Email verification: 3 requests per hour
  emailVerification: createLimiter(Ratelimit.slidingWindow(3, '1 h')),

  // Legacy non-alpha routes
  threadCreation: createLimiter(Ratelimit.slidingWindow(5, '1 h')),
  replyCreation: createLimiter(Ratelimit.slidingWindow(20, '1 h')),
  pollCreation: createLimiter(Ratelimit.slidingWindow(3, '1 d')),
};

function failOpen(name: LimiterName): RateLimitResult {
  const fallback = FALLBACK_LIMITS[name];
  return {
    success: true,
    limit: fallback.limit,
    remaining: fallback.limit,
    reset: new Date(Date.now() + fallback.windowMs),
  };
}

async function checkLimiter(
  name: LimiterName,
  identifier: string,
  errorMessage: string
): Promise<RateLimitResult> {
  const limiter = rateLimiters[name];

  if (!limiter) {
    return failOpen(name);
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    return {
      success,
      limit,
      remaining,
      reset: new Date(reset),
      error: success ? undefined : errorMessage,
    };
  } catch (error) {
    console.error(`[Rate Limit] Error checking ${name} rate limit:`, error);
    return failOpen(name);
  }
}

export class RateLimitService {
  /**
   * Check rate limit for API routes
   */
  static async checkAPIRateLimit(identifier: string): Promise<RateLimitResult> {
    return checkLimiter('api', identifier, 'Rate limit exceeded. Please try again later.');
  }

  /**
   * Check rate limit for authentication
   */
  static async checkAuthRateLimit(identifier: string): Promise<RateLimitResult> {
    return checkLimiter('auth', identifier, 'Too many authentication attempts. Please wait 15 minutes.');
  }

  /**
   * Check rate limit for email verification
   */
  static async checkEmailVerificationRateLimit(identifier: string): Promise<RateLimitResult> {
    return checkLimiter('emailVerification', identifier, 'Too many verification attempts. Please wait 1 hour.');
  }

  /**
   * Check rate limit for legacy content creation routes
   */
  static async checkThreadCreationRateLimit(identifier: string): Promise<RateLimitResult> {
    return checkLimiter('threadCreation', identifier, 'Please wait before creating more content.');
  }

  /**
   * Check rate limit for legacy response routes
   */
  static async checkReplyCreationRateLimit(identifier: string): Promise<RateLimitResult> {
    return checkLimiter('replyCreation', identifier, 'Please wait before adding more responses.');
  }

  /**
   * Check rate limit for legacy poll creation routes
   */
  static async checkPollCreationRateLimit(identifier: string): Promise<RateLimitResult> {
    return checkLimiter('pollCreation', identifier, 'Please wait before creating more polls.');
  }

  /**
   * Get rate limit headers for response
   */
  static getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toISOString(),
    };
  }
}