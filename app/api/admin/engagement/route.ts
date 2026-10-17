import { isAdminMember } from '@/lib/access-policy';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { REACTIONS, POLL_VOTE } from '@/lib/engagement';
import { engagementMetrics } from '@/lib/engagement-metrics';

/** GET /api/admin/engagement — beta engagement health for the last 30 days. */
export const GET = withAuth(async (_request, user) => {
  if (!isAdminMember(user)) return createErrorResponse('Admin access required', 403);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [questions, reactions, pollVotes] = await Promise.all([
    prisma.contribution.findMany({
      where: { contributionType: { in: ['question', 'situation'] }, createdAt: { gte: since }, isHidden: false },
      select: {
        createdAt: true, userId: true,
        interactions: { where: { interactionType: 'ANSWER', displayStatus: 'VISIBLE' }, select: { createdAt: true, userId: true } },
        outcomes: { select: { id: true }, take: 1 },
      },
    }),
    prisma.auditLog.groupBy({ by: ['action'], where: { action: { in: Object.values(REACTIONS) }, createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.interaction.count({ where: { interactionType: POLL_VOTE, createdAt: { gte: since } } }),
  ]);
  const byAction = Object.fromEntries(reactions.map((r) => [r.action, r._count._all]));
  return createApiResponse({
    windowDays: 30,
    ...engagementMetrics(questions),
    reactions: {
      helpful: byAction[REACTIONS.HELPFUL] ?? 0,
      sameHere: byAction[REACTIONS.SAME_HERE] ?? 0,
      saved: byAction[REACTIONS.SAVED] ?? 0,
      worked: byAction[REACTIONS.WORKED] ?? 0,
    },
    pollVotes,
  });
}, { requireAuth: true });
