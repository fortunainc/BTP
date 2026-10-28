import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export type TrafficEvent = 'site_visit' | 'investor_room_login' | 'investor_room_failed' | 'investor_room_view';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|vercel-screenshot|headless|lighthouse/i;

/**
 * Counts a visit without cookies or stored IP addresses. The visitor id is a hash of IP, browser and the date,
 * so it counts unique visitors per day but cannot follow anyone across days. Never throws.
 */
export async function recordTraffic(type: TrafficEvent, headers: Headers, path?: string): Promise<void> {
  try {
    if (process.env.VERCEL_ENV === 'preview') return;
    const ua = headers.get('user-agent') ?? '';
    if (!ua || BOT.test(ua)) return;
    const day = new Date().toISOString().slice(0, 10);
    const ip = (headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
    const salt = process.env.IDENTITY_HASH_SECRET || process.env.CLERK_SECRET_KEY || '';
    const visitor = createHash('sha256').update(`btp-traffic-v1:${salt}:${day}:${ip}:${ua}`).digest('hex').slice(0, 24);
    let referrer: string | null = null;
    try { const r = headers.get('referer'); referrer = r ? new URL(r).hostname : null; } catch { referrer = null; }
    await prisma.analyticsEvent.create({
      data: {
        anonymousUserId: `VIS-${visitor}`,
        eventType: type,
        eventCategory: 'traffic',
        createdAtBucket: day,
        metadataJson: { path: path ?? null, referrer },
      },
    });
  } catch (error) {
    console.error('Traffic record failed', error instanceof Error ? error.name : 'unknown');
  }
}

/** Daily traffic for the last `days` days, newest first. */
export async function trafficSummary(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const rows = await prisma.analyticsEvent.findMany({
    where: { eventCategory: 'traffic', createdAtBucket: { gte: since } },
    select: { eventType: true, createdAtBucket: true, anonymousUserId: true, metadataJson: true },
  });
  const byDay = new Map<string, { date: string; visits: number; visitors: Set<string>; logins: number; failed: number; roomViews: number }>();
  const referrers = new Map<string, number>();
  for (const r of rows) {
    const d = byDay.get(r.createdAtBucket) ?? { date: r.createdAtBucket, visits: 0, visitors: new Set<string>(), logins: 0, failed: 0, roomViews: 0 };
    if (r.eventType === 'site_visit') {
      d.visits++; d.visitors.add(r.anonymousUserId);
      const ref = (r.metadataJson as { referrer?: string | null } | null)?.referrer;
      if (ref && !ref.includes('btp-rho-seven')) referrers.set(ref, (referrers.get(ref) ?? 0) + 1);
    }
    if (r.eventType === 'investor_room_login') d.logins++;
    if (r.eventType === 'investor_room_failed') d.failed++;
    if (r.eventType === 'investor_room_view') d.roomViews++;
    byDay.set(r.createdAtBucket, d);
  }
  const daily = [...byDay.values()].sort((a, b) => b.date.localeCompare(a.date)).map(({ visitors, ...d }) => ({ ...d, uniqueVisitors: visitors.size }));
  const totals = daily.reduce((t, d) => ({ visits: t.visits + d.visits, uniqueVisitors: t.uniqueVisitors + d.uniqueVisitors, logins: t.logins + d.logins, failed: t.failed + d.failed, roomViews: t.roomViews + d.roomViews }), { visits: 0, uniqueVisitors: 0, logins: 0, failed: 0, roomViews: 0 });
  return { days, totals, daily, topReferrers: [...referrers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([source, visits]) => ({ source, visits })) };
}
