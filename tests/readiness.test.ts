import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ viewer: { id: 'u1', userRole: 'operator', verificationStatus: 'Approved' }, settings: null as any, queries: [] as any[] }));
vi.mock('@/lib/api-auth', () => ({
  withAuth: (fn: any) => (req: NextRequest) => fn(req, state.viewer),
  createApiResponse: (data: unknown, status = 200) => Response.json(data, {status}),
  createErrorResponse: (error: string, status = 500) => Response.json({error}, {status}),
}));
vi.mock('@/lib/prisma', () => ({ prisma: {
  userNotificationSettings: { findUnique: async () => state.settings },
  notification: {
    findMany: async (args: any) => { state.queries.push(args); return []; },
    count: async (args: any) => { state.queries.push(args); return 0; },
    groupBy: async (args: any) => { state.queries.push(args); return []; },
  },
}}));
vi.mock('@/lib/return-engine/engine', () => ({ ReturnEngine: class {} }));
import { POST as review } from '@/app/api/situations/review/route';
import { GET as notifications } from '@/app/api/notifications/route';
const reviewRequest = (description: string) => new NextRequest('https://btp.test/api/situations/review', {method:'POST',body:JSON.stringify({description})});
beforeEach(() => { state.viewer.verificationStatus = 'Approved'; state.settings = null; state.queries = []; });
describe('question preview contract', () => {
  it('returns a successful sanitized preview without writing a post', async () => {
    const res = await review(reviewRequest('How can we reduce duplicate entry? Email qa@example.com for details.'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.redactedContent).not.toContain('qa@example.com');
    expect(body.redactionsApplied).toBeGreaterThan(0);
  });
  it('does not preview a pending member’s question', async () => {
    state.viewer.verificationStatus = 'Pending';
    expect((await review(reviewRequest('A clinical research question'))).status).toBe(403);
  });
  it.each(['', ' ', 'x'.repeat(5001)])('rejects empty or oversized input', async description => {
    expect((await review(reviewRequest(description))).status).toBe(400);
  });
});
describe('notification preference enforcement', () => {
  it('applies the member’s disabled categories to the feed and all badges', async () => {
    state.settings = { inAppEnabled:true, validationEnabled:false, expansionEnabled:true, momentumEnabled:true, pressureEnabled:true };
    await notifications(new NextRequest('https://btp.test/api/notifications'));
    expect(state.queries).toHaveLength(4);
    for (const q of state.queries) {
      expect(q.where.userId).toBe('u1');
      expect(q.where.notificationClass.in).not.toContain('VALIDATION');
      expect(q.where.notificationClass.in).toContain('EXPANSION');
    }
  });
  it('cannot bypass preferences with a class filter', async () => {
    state.settings = { inAppEnabled:false };
    await notifications(new NextRequest('https://btp.test/api/notifications?class=VALIDATION'));
    for (const q of state.queries) expect(q.where.notificationClass.in).toEqual([]);
  });
  it('allows current community updates by default without advertising opportunities', async () => {
    await notifications(new NextRequest('https://btp.test/api/notifications'));
    expect(state.queries[0].where.notificationClass.in).toEqual(['VALIDATION','EXPANSION','MOMENTUM','PRESSURE']);
  });
});
