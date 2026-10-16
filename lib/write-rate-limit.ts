import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

/** Shared across serverless instances; failures deny writes rather than bypassing limits. */
export async function checkWriteRateLimit(userId: string, pathname: string) {
  const windowMs = 60_000;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  // Bound cardinality: individual question IDs share one write budget per member.
  const category = pathname.startsWith('/api/admin/') ? 'admin' : 'member';
  const key = createHash('sha256').update(`${category}:${userId}`).digest('hex');
  const limit = category === 'admin' ? 60 : 30;
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "ApiRateLimit" ("key", "windowStart", "count") VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "ApiRateLimit"."windowStart" >= EXCLUDED."windowStart"
        THEN "ApiRateLimit"."count" + 1 ELSE 1 END,
      "windowStart" = GREATEST("ApiRateLimit"."windowStart", EXCLUDED."windowStart")
    RETURNING "count"`;
  return { allowed: rows[0].count <= limit, retryAfter: Math.ceil((windowStart.getTime() + windowMs - now) / 1000) };
}
