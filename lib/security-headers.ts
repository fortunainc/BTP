/**
 * Security Headers Configuration
 */

export interface SecurityHeaders {
  'X-DNS-Prefetch-Control': string;
  'Strict-Transport-Security': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'X-XSS-Protection': string;
  'Content-Security-Policy': string;
}

export class SecurityHeadersService {
  /**
   * Get security headers for all responses
   */
  static getHeaders(): SecurityHeaders {
    return {
      // Disable DNS prefetching
      'X-DNS-Prefetch-Control': 'off',
      
      // Force HTTPS
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Control referrer information
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Disable browser features
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      
      // Enable XSS protection (legacy browsers)
      'X-XSS-Protection': '1; mode=block',
      
      // Content Security Policy
      'Content-Security-Policy': this.getContentSecurityPolicy(),
    };
  }

  /**
   * Get Content Security Policy
   */
  private static getContentSecurityPolicy(): string {
    const directives = [
      // Default to self only
      "default-src 'self'",
      
      // Script sources
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://js.clerk.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.cloudflare.com https://*.cloudflareinsights.com",
      
      // Worker sources
      "worker-src 'self' blob:",
      
      // Style sources
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
      
      // Image sources
      "img-src 'self' data: https: blob:",
      
      // Font sources
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      
      // Connect sources
      "connect-src 'self' https://api.clerk.dev https://*.clerk.accounts.dev https://resend.com https://clerk-telemetry.com https://challenges.cloudflare.com https://*.cloudflare.com",
      
      // Frame sources (for Clerk if needed)
      "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.cloudflare.com",
      
      // Media sources
      "media-src 'self'",
      
      // Object sources
      "object-src 'none'",
      
      // Base URI
      "base-uri 'self'",
      
      // Form action
      "form-action 'self'",
      
      // Upgrade insecure requests
      "upgrade-insecure-requests",
      
      // Block mixed content
      "block-all-mixed-content",
    ];

    return directives.join('; ');
  }

  /**
   * Get CORS headers
   */
  static getCORSHeaders(origin?: string): Record<string, string> {
    // In production, whitelist specific origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    const isOriginAllowed = origin && allowedOrigins.includes(origin);

    return {
      'Access-Control-Allow-Origin': isOriginAllowed ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  /**
   * Get rate limit headers
   */
  static getRateLimitHeaders(limit: number, remaining: number, reset: Date): Record<string, string> {
    return {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toISOString(),
    };
  }

  /**
   * Apply security headers to response
   */
  static applyHeaders(response: Response, origin?: string): Response {
    const securityHeaders = this.getHeaders();
    const corsHeaders = this.getCORSHeaders(origin);

    Object.entries({ ...securityHeaders, ...corsHeaders }).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
}