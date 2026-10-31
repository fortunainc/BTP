import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  viewer: { id: 'viewer', userRole: 'operator', verificationStatus: 'Approved', isSuspended: false, roleCategory: 'cra' } as Record<string, unknown>,
  calls: [] as Array<{ model: string; op: string; args: any }>,
  contributions: [] as any[],
  answer: null as any,
  audit: [] as any[],
  interactions: [] as any[],
  member: null as any,
  accessRequest: null as any,
  createError: null as null | { code: string },
}));

vi.mock('@/lib/api-auth', () => ({
  withAuth: (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) => handler(req, state.viewer),
  createApiResponse: (data: unknown, status = 200) => Response.json(data, { status }),
  createErrorResponse: (error: string, status = 500) => Response.json({ error }, { status }),
}));

vi.mock('@/lib/prisma', () => {
  const track = (model: string, op: string, result: (args: any) => unknown) => async (args: any) => { state.calls.push({ model, op, args }); return result(args); };
  const prisma = {
    contribution: { findMany: track('contribution', 'findMany', () => state.contributions) },
    interaction: {
      findFirst: track('interaction', 'findFirst', () => state.answer),
      findMany: track('interaction', 'findMany', () => state.interactions),
    },
    auditLog: {
      findFirst: track('auditLog', 'findFirst', ({ where }) => state.audit.find((a) => a.userId === where.userId && a.action === where.action && a.resourceId === where.resourceId) ?? null),
      findMany: track('auditLog', 'findMany', () => state.audit),
      create: track('auditLog', 'create', ({ data }) => { state.audit.push(data); return data; }),
      deleteMany: track('auditLog', 'deleteMany', () => ({ count: 0 })),
    },
    notification: { create: track('notification', 'create', () => ({})), createMany: track('notification', 'createMany', () => ({})) },
    user: { findUnique: track('user', 'findUnique', () => state.member), update: track('user', 'update', () => ({})) },
    accessRequest: {
      findFirst: track('accessRequest', 'findFirst', () => state.accessRequest),
      findUnique: track('accessRequest', 'findUnique', () => state.accessRequest),
      update: track('accessRequest', 'update', () => ({})),
      create: track('accessRequest', 'create', ({ data }) => { if (state.createError) throw state.createError; return data; }),
    },
    $transaction: async (ops: unknown[]) => Promise.all(ops),
  };
  return { prisma };
});

import { authorHandle, publicAuthor } from '@/lib/public-author';
import { ISSUE_CATEGORIES, issueCategoryWhere, isUnansweredParam } from '@/lib/situation-filters';
import { GET as listSituations } from '@/app/api/situations/route';
import { POST as react } from '@/app/api/answers/[id]/reactions/route';
import { savedAnswersFor, excerptOf } from '@/lib/member-saved';
import { getPaidReviewInterest, setPaidReviewInterest } from '@/lib/paid-review-interest';

const approved = { handle: 'quiet_heron', roleCategory: 'crc', verificationStatus: 'Approved', isSuspended: false };

beforeEach(() => {
  state.calls = []; state.contributions = []; state.audit = []; state.interactions = [];
  state.answer = null; state.member = null; state.accessRequest = null; state.createError = null;
  state.viewer = { id: 'viewer', userRole: 'operator', verificationStatus: 'Approved', isSuspended: false, roleCategory: 'cra' };
});

describe('public author fields', () => {
  it('returns a handle only for approved, unsuspended members', () => {
    expect(authorHandle(approved)).toBe('quiet_heron');
    expect(authorHandle({ ...approved, verificationStatus: 'Pending' })).toBeNull();
    expect(authorHandle({ ...approved, isSuspended: true })).toBeNull();
    expect(authorHandle(null)).toBeNull();
    expect(publicAuthor({ ...approved, handle: 'BTP_Team' })).toEqual({ authorHandle: null, authorRole: 'Community question' });
    expect(publicAuthor(approved)).toEqual({ authorHandle: 'quiet_heron', authorRole: 'Verified site professional' });
    expect(publicAuthor({ ...approved, verificationStatus: 'Pending' })).toEqual({ authorHandle: null, authorRole: 'BTP member' });
  });
});

describe('situation list filters', () => {
  it('accepts the listed categories case-insensitively and rejects others', () => {
    expect(ISSUE_CATEGORIES).toContain('Protocol burden');
    expect(issueCategoryWhere('protocol BURDEN')).toEqual({ equals: 'Protocol burden', mode: 'insensitive' });
    expect(issueCategoryWhere('Nonsense')).toBeNull();
    expect(isUnansweredParam('1')).toBe(true);
    expect(isUnansweredParam('true')).toBe(true);
    expect(isUnansweredParam('0')).toBe(false);
    expect(isUnansweredParam(null)).toBe(false);
  });

  it('combines unanswered with search, category and cursor, and returns only public author fields', async () => {
    state.contributions = [{ id: 'q1', title: 'T', description: 'D', therapeuticArea: 'Oncology', trialPhase: 'Phase 2', issueCategory: 'Enrollment', urgencyLevel: 'Normal', resolutionStatus: null, createdAt: new Date(), user: approved, interactions: [] }];
    const res = await listSituations(new NextRequest('https://btp.test/api/situations?unanswered=1&q=consent&issueCategory=enrollment&cursor=q0'));
    const body = await res.json();
    const args = state.calls.find((c) => c.model === 'contribution')!.args;
    expect(args.where.interactions).toEqual({ none: { interactionType: 'ANSWER', displayStatus: 'VISIBLE' } });
    expect(args.where.OR).toHaveLength(3);
    expect(args.where.issueCategory).toEqual({ equals: 'Enrollment', mode: 'insensitive' });
    expect(args.cursor).toEqual({ id: 'q0' });
    expect(Object.keys(args.select.user.select).sort()).toEqual(['handle', 'isSuspended', 'roleCategory', 'verificationStatus']);
    expect(body.situations[0]).toMatchObject({ authorHandle: 'quiet_heron', authorRole: 'Verified site professional', hasVisibleAnswer: false });
    expect(body.situations[0]).not.toHaveProperty('user');
    expect(body.situations[0]).not.toHaveProperty('userId');
  });

  it('does not filter on answers when unanswered is absent', async () => {
    await listSituations(new NextRequest('https://btp.test/api/situations'));
    expect(state.calls.find((c) => c.model === 'contribution')!.args.where.interactions).toBeUndefined();
  });
});

describe('reactions', () => {
  const post = (type: string) => react(new NextRequest('https://btp.test/api/answers/a1/reactions', { method: 'POST', body: JSON.stringify({ type }) }));

  it('rejects WORKED from anyone but the question author with 403', async () => {
    state.answer = { id: 'a1', userId: 'helper', contributionId: 'q1', contribution: { userId: 'asker' } };
    expect((await post('WORKED')).status).toBe(403);
    state.viewer.id = 'asker';
    expect((await post('WORKED')).status).toBe(201);
  });

  it('never notifies the answerer for SAVED', async () => {
    state.answer = { id: 'a1', userId: 'helper', contributionId: 'q1', contribution: { userId: 'asker' } };
    expect((await post('SAVED')).status).toBe(201);
    expect(state.calls.some((c) => c.model === 'notification')).toBe(false);
  });
});

describe('saved answers', () => {
  it('filters to visible answers on visible questions and returns only public fields, newest first', async () => {
    state.audit = [
      { resourceId: 'a2', createdAt: new Date('2026-10-02T00:00:00Z') },
      { resourceId: 'a1', createdAt: new Date('2026-10-01T00:00:00Z') },
    ];
    state.interactions = [
      { id: 'a1', context: 'x'.repeat(300), contributionId: 'q1', contribution: { title: 'Q1' }, user: approved },
      { id: 'a2', context: 'Short answer', contributionId: 'q2', contribution: { title: 'Q2' }, user: { ...approved, verificationStatus: 'Pending' } },
    ];
    const items = await savedAnswersFor('viewer');
    const where = state.calls.find((c) => c.model === 'interaction')!.args.where;
    expect(where).toMatchObject({ displayStatus: 'VISIBLE', contribution: { isHidden: false, isFlagged: false, forceExcludeFromPatterns: false } });
    expect(items.map((i) => i.answerId)).toEqual(['a2', 'a1']);
    expect(items[0]).toEqual({ answerId: 'a2', situationId: 'q2', situationTitle: 'Q2', excerpt: 'Short answer', authorHandle: null, authorRole: 'BTP member', savedAt: '2026-10-02T00:00:00.000Z' });
    expect(items[1].excerpt.length).toBeLessThanOrEqual(201);
    expect(excerptOf('a  b\n c')).toBe('a b c');
  });
});

describe('paid review interest', () => {
  it('reads profile fields and matches the waitlist row case-insensitively', async () => {
    state.member = { email: 'Member@Site.org', clerkId: null, roleCategory: 'cra', yearsExperience: 7 };
    state.accessRequest = { id: 'r1', paidReviewInterest: true };
    expect(await getPaidReviewInterest('viewer')).toEqual({ interested: true, roleLabel: 'Verified CRA / monitor', yearsExperience: 7 });
    expect(state.calls.find((c) => c.model === 'accessRequest')!.args.where).toEqual({ email: { equals: 'member@site.org', mode: 'insensitive' } });
  });

  it('updates only the interest flag on an existing row', async () => {
    state.member = { email: 'member@site.org', clerkId: null, roleCategory: 'cra', yearsExperience: 7 };
    state.accessRequest = { id: 'r1', paidReviewInterest: false };
    await setPaidReviewInterest('viewer', true);
    const update = state.calls.find((c) => c.model === 'accessRequest' && c.op === 'update')!;
    expect(update.args).toEqual({ where: { id: 'r1' }, data: { paidReviewInterest: true } });
  });

  it('creates a joined row without referral, notification, email or approval side effects', async () => {
    state.member = { email: 'member@site.org', clerkId: null, roleCategory: 'unspecified', yearsExperience: null };
    const result = await setPaidReviewInterest('viewer', true);
    expect(result).toEqual({ ok: true, value: { interested: true, roleLabel: null, yearsExperience: null } });
    const create = state.calls.find((c) => c.model === 'accessRequest' && c.op === 'create')!;
    expect(create.args.data).toMatchObject({ email: 'member@site.org', status: 'joined', source: 'member profile', paidReviewInterest: true });
    expect(create.args.data).not.toHaveProperty('referrerId');
    const writes = state.calls.filter((c) => !['findFirst', 'findUnique', 'findMany'].includes(c.op));
    expect(writes.map((c) => `${c.model}.${c.op}`)).toEqual(['accessRequest.create']);
  });

  it('refuses to write when the member has no email', async () => {
    state.member = { email: null, clerkId: null, roleCategory: 'cra', yearsExperience: 3 };
    expect(await setPaidReviewInterest('viewer', true)).toMatchObject({ ok: false, status: 409 });
  });
});
