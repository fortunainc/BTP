import { prisma } from '@/lib/prisma';
import { verifiedRoleLabel } from '@/lib/role-label';

/**
 * Engagement layer: answer reactions, "it worked" receipts, founding responders,
 * and instant-reveal polls. Built on existing tables (AuditLog, Interaction,
 * Contribution, Notification) so no schema migration is required.
 */

export const REACTIONS = {
  HELPFUL: 'ANSWER_MARKED_HELPFUL', // same action the existing helpful endpoint writes
  SAME_HERE: 'ANSWER_REACTION_SAME_HERE',
  SAVED: 'ANSWER_REACTION_SAVED',
  WORKED: 'ANSWER_MARKED_WORKED',
} as const;
export type ReactionType = keyof typeof REACTIONS;
export const REACTION_TYPES = Object.keys(REACTIONS) as ReactionType[];
const ACTION_TO_TYPE = Object.fromEntries(Object.entries(REACTIONS).map(([k, v]) => [v, k])) as Record<string, ReactionType>;

export function isReactionType(value: unknown): value is ReactionType {
  return typeof value === 'string' && (REACTION_TYPES as string[]).includes(value);
}

export type ReactionCounts = Record<ReactionType, number>;
const emptyCounts = (): ReactionCounts => ({ HELPFUL: 0, SAME_HERE: 0, SAVED: 0, WORKED: 0 });

/** Counts per answer plus the viewer's own reactions. */
export async function reactionSummary(answerIds: string[], viewerId: string) {
  const result: Record<string, { counts: ReactionCounts; mine: ReactionType[] }> = {};
  for (const id of answerIds) result[id] = { counts: emptyCounts(), mine: [] };
  if (answerIds.length === 0) return result;
  const rows = await prisma.auditLog.findMany({
    where: { resourceType: 'Interaction', resourceId: { in: answerIds }, action: { in: Object.values(REACTIONS) } },
    select: { resourceId: true, action: true, userId: true },
  });
  for (const row of rows) {
    const type = ACTION_TO_TYPE[row.action];
    const entry = row.resourceId ? result[row.resourceId] : undefined;
    if (!type || !entry) continue;
    entry.counts[type] += 1;
    if (row.userId === viewerId) entry.mine.push(type);
  }
  return result;
}

type ReactionCheck =
  | { ok: true; answer: { id: string; userId: string | null; contributionId: string; questionAuthorId: string | null } }
  | { ok: false; status: number; error: string };

/** Validates who may react: never your own answer; only the asker can say it worked. */
export async function checkReaction(answerId: string, userId: string, type: ReactionType): Promise<ReactionCheck> {
  const answer = await prisma.interaction.findFirst({
    where: {
      id: answerId, interactionType: 'ANSWER', displayStatus: 'VISIBLE',
      contribution: { isHidden: false, isFlagged: false, forceExcludeFromPatterns: false },
    },
    select: { id: true, userId: true, contributionId: true, contribution: { select: { userId: true } } },
  });
  if (!answer) return { ok: false, status: 404, error: 'Answer not found' };
  if (answer.userId === userId) return { ok: false, status: 400, error: 'You cannot react to your own answer' };
  if (type === 'WORKED' && answer.contribution.userId !== userId) {
    return { ok: false, status: 403, error: 'Only the member who asked can mark an answer as worked' };
  }
  return { ok: true, answer: { id: answer.id, userId: answer.userId, contributionId: answer.contributionId, questionAuthorId: answer.contribution.userId } };
}

const RECEIPT_COPY: Partial<Record<ReactionType, { variant: string; copy: string }>> = {
  HELPFUL: { variant: 'IMPACT-ANSWER-HELPED', copy: 'Your answer helped another BTP member.' },
  WORKED: { variant: 'IMPACT-ANSWER-WORKED', copy: 'The member you helped says your answer worked.' },
};

export async function addReaction(userId: string, type: ReactionType, answer: { id: string; userId: string | null; contributionId: string }) {
  const action = REACTIONS[type];
  const existing = await prisma.auditLog.findFirst({
    where: { userId, action, resourceType: 'Interaction', resourceId: answer.id },
    select: { id: true },
  });
  if (existing) return { created: false };
  const receipt = RECEIPT_COPY[type];
  await prisma.$transaction([
    prisma.auditLog.create({ data: { userId, action, resourceType: 'Interaction', resourceId: answer.id, details: { contributionId: answer.contributionId } } }),
    ...(receipt && answer.userId ? [prisma.notification.create({
      data: {
        userId: answer.userId, variantId: receipt.variant, notificationClass: 'VALIDATION', priority: type === 'WORKED' ? 'P1' : 'P2',
        copy: receipt.copy, relatedPostId: answer.contributionId, surfaces: ['in_app', 'push'], deliveredTo: [],
      },
    })] : []),
  ]);
  return { created: true };
}

export async function removeReaction(userId: string, type: ReactionType, answerId: string) {
  await prisma.auditLog.deleteMany({ where: { userId, action: REACTIONS[type], resourceType: 'Interaction', resourceId: answerId } });
}

/** Copy for the asker when a peer answers: says who answered, never their identity. */
export async function answeredByCopy(actorId: string | undefined): Promise<string> {
  if (!actorId) return 'A BTP member answered your question.';
  const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { roleCategory: true, verificationStatus: true } });
  if (!actor || actor.verificationStatus !== 'Approved') return 'A BTP member answered your question.';
  const label = verifiedRoleLabel(actor.roleCategory);
  return `A ${label.charAt(0).toLowerCase()}${label.slice(1)} answered your question.`;
}

/** Ask founding operators to give a fast first answer on a new, visible question. */
export async function notifyFoundingResponders(params: { contributionId: string; authorId: string; therapeuticArea?: string | null }) {
  const responders = await prisma.user.findMany({
    where: { isFoundingOperator: true, isSuspended: false, verificationStatus: 'Approved', id: { not: params.authorId } },
    select: { id: true },
    take: 50,
  });
  if (responders.length === 0) return 0;
  const area = params.therapeuticArea && params.therapeuticArea !== 'Other' ? ` in ${params.therapeuticArea}` : '';
  await prisma.notification.createMany({
    data: responders.map((r) => ({
      userId: r.id, variantId: 'FOUNDING-FIRST-ANSWER', notificationClass: 'EXPANSION', priority: 'P1',
      copy: `New question${area}. Be the first to help.`, relatedPostId: params.contributionId,
      surfaces: ['in_app', 'push'], deliveredTo: [],
    })),
  });
  return responders.length;
}

// ---------------- Polls ----------------

export const POLL_TYPE = 'poll';
export const POLL_VOTE = 'POLL_VOTE';

export function parsePollOptions(relatedContext: unknown): string[] {
  const ctx = relatedContext as { poll?: { options?: unknown } } | null;
  const options = ctx?.poll?.options;
  return Array.isArray(options) ? options.filter((o): o is string => typeof o === 'string') : [];
}

export function validatePollInput(question: unknown, options: unknown): { ok: true; question: string; options: string[] } | { ok: false; error: string } {
  const q = typeof question === 'string' ? question.trim() : '';
  if (q.length < 8 || q.length > 200) return { ok: false, error: 'Question must be 8-200 characters' };
  if (!Array.isArray(options)) return { ok: false, error: 'Options are required' };
  const opts = options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean);
  if (opts.length < 2 || opts.length > 6) return { ok: false, error: 'Provide 2-6 options' };
  if (opts.some((o) => o.length > 80)) return { ok: false, error: 'Each option must be 80 characters or fewer' };
  if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) return { ok: false, error: 'Options must be different' };
  return { ok: true, question: q, options: opts };
}

/** Results are revealed only to members who have voted. */
export function tallyPoll(options: string[], votes: { context: string | null }[]) {
  const counts = options.map(() => 0);
  for (const v of votes) {
    if (v.context === null || v.context.trim() === '') continue;
    const i = Number(v.context);
    if (Number.isInteger(i) && i >= 0 && i < counts.length) counts[i] += 1;
  }
  const total = counts.reduce((a, b) => a + b, 0);
  return { total, results: options.map((label, i) => ({ label, count: counts[i], percent: total ? Math.round((counts[i] / total) * 100) : 0 })) };
}
