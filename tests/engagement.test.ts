import { describe, expect, it, vi, beforeEach } from 'vitest';

const db = vi.hoisted(() => ({
  answer: null as null | { id: string; userId: string | null; contributionId: string; contribution: { userId: string | null } },
  audit: [] as Array<{ userId: string; action: string; resourceId: string }>,
  notifications: [] as Array<{ userId: string; variantId: string; relatedPostId: string }>,
}));

vi.mock('@/lib/prisma', () => {
  const prisma = {
    interaction: { findFirst: async () => db.answer },
    auditLog: {
      findFirst: async ({ where }: { where: { userId: string; action: string; resourceId: string } }) =>
        db.audit.find((a) => a.userId === where.userId && a.action === where.action && a.resourceId === where.resourceId) ?? null,
      findMany: async ({ where }: { where: { resourceId: { in: string[] }; action: { in: string[] } } }) =>
        db.audit.filter((a) => where.resourceId.in.includes(a.resourceId) && where.action.in.includes(a.action)).map((a) => ({ ...a })),
      create: ({ data }: { data: { userId: string; action: string; resourceId: string } }) => { db.audit.push(data); return data; },
    },
    notification: { create: ({ data }: { data: { userId: string; variantId: string; relatedPostId: string } }) => { db.notifications.push(data); return data; } },
    $transaction: async (ops: unknown[]) => ops,
  };
  return { prisma };
});

import { addReaction, checkReaction, reactionSummary, tallyPoll, validatePollInput } from '@/lib/engagement';
import { engagementMetrics } from '@/lib/engagement-metrics';

beforeEach(() => {
  db.answer = { id: 'a1', userId: 'helper', contributionId: 'q1', contribution: { userId: 'asker' } };
  db.audit = []; db.notifications = [];
});

describe('answer reactions', () => {
  it('blocks reacting to your own answer', async () => {
    expect(await checkReaction('a1', 'helper', 'HELPFUL')).toMatchObject({ ok: false, status: 400 });
  });

  it('lets only the asker mark an answer as worked', async () => {
    expect(await checkReaction('a1', 'someone', 'WORKED')).toMatchObject({ ok: false, status: 403 });
    expect(await checkReaction('a1', 'asker', 'WORKED')).toMatchObject({ ok: true });
  });

  it('sends the helper an "it worked" receipt linked to the question, once', async () => {
    const check = await checkReaction('a1', 'asker', 'WORKED');
    if (!check.ok) throw new Error('expected ok');
    await addReaction('asker', 'WORKED', check.answer);
    await addReaction('asker', 'WORKED', check.answer);
    expect(db.notifications).toHaveLength(1);
    expect(db.notifications[0]).toMatchObject({ userId: 'helper', variantId: 'IMPACT-ANSWER-WORKED', relatedPostId: 'q1' });
  });

  it('does not notify on same-here or saved, and counts reactions per answer', async () => {
    const check = await checkReaction('a1', 'peer', 'SAME_HERE');
    if (!check.ok) throw new Error('expected ok');
    await addReaction('peer', 'SAME_HERE', check.answer);
    await addReaction('peer', 'SAVED', check.answer);
    expect(db.notifications).toHaveLength(0);
    const summary = await reactionSummary(['a1'], 'peer');
    expect(summary.a1.counts).toMatchObject({ SAME_HERE: 1, SAVED: 1, HELPFUL: 0, WORKED: 0 });
    expect(summary.a1.mine.sort()).toEqual(['SAME_HERE', 'SAVED']);
  });
});

describe('polls', () => {
  it('validates questions and options', () => {
    expect(validatePollInput('Too short', ['a'])).toMatchObject({ ok: false });
    expect(validatePollInput('How long does budget sign-off take?', ['<2 weeks', '<2 weeks'])).toMatchObject({ ok: false });
    expect(validatePollInput('How long does budget sign-off take?', ['<2 weeks', '2-6 weeks', '>6 weeks'])).toMatchObject({ ok: true });
  });

  it('tallies votes into percentages and ignores invalid choices', () => {
    const t = tallyPoll(['A', 'B'], [{ context: '0' }, { context: '0' }, { context: '1' }, { context: '9' }, { context: null }]);
    expect(t.total).toBe(3);
    expect(t.results.map((r) => r.percent)).toEqual([67, 33]);
  });
});

describe('engagement metrics', () => {
  it('computes time to first answer excluding the asker, and ask-and-answer members', () => {
    const t0 = new Date('2026-10-01T10:00:00Z');
    const m = engagementMetrics([
      { createdAt: t0, userId: 'u1', interactions: [{ createdAt: new Date(t0.getTime() + 30 * 60000), userId: 'u2' }], outcomes: [{ id: 'o' }] },
      { createdAt: t0, userId: 'u2', interactions: [{ createdAt: new Date(t0.getTime() + 5 * 60000), userId: 'u2' }, { createdAt: new Date(t0.getTime() + 180 * 60000), userId: 'u1' }], outcomes: [] },
      { createdAt: t0, userId: 'u3', interactions: [], outcomes: [] },
    ]);
    expect(m).toMatchObject({ questions: 3, answeredPct: 67, answeredWithin2hPct: 33, medianMinutesToFirstAnswer: 105, outcomeReportedPct: 33, membersWhoAskAndAnswer: 2 });
  });
});

describe('reaction toggles and poll privacy', () => {
  it('does not re-notify when a reaction is removed and added again', async () => {
    const check = await checkReaction('a1', 'asker', 'WORKED');
    if (!check.ok) throw new Error('expected ok');
    await addReaction('asker', 'WORKED', check.answer);
    db.audit = db.audit.filter((a) => a.action !== 'ANSWER_MARKED_WORKED'); // simulate un-react
    await addReaction('asker', 'WORKED', check.answer);
    expect(db.notifications).toHaveLength(1);
  });

  it('hides poll breakdowns until at least 5 members have voted', async () => {
    const { visibleResults } = await import('@/lib/engagement');
    expect(visibleResults(tallyPoll(['A', 'B'], [{ context: '0' }, { context: '1' }]))).toBeNull();
    expect(visibleResults(tallyPoll(['A', 'B'], ['0', '0', '1', '1', '0'].map((c) => ({ context: c })))) ).not.toBeNull();
  });
});
