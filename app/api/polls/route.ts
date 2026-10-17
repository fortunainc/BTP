import { isApprovedMember } from '@/lib/access-policy';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { POLL_TYPE, POLL_VOTE, parsePollOptions, tallyPoll, visibleResults } from '@/lib/engagement';

/** GET /api/polls — recent polls; results only for polls the member has voted on. */
export const GET = withAuth(async (_request, user) => {
  if (!isApprovedMember(user)) return createErrorResponse('Approved BTP membership is required', 403);
  const polls = await prisma.contribution.findMany({
    where: { contributionType: POLL_TYPE, isHidden: false },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, title: true, relatedContext: true, createdAt: true,
      interactions: { where: { interactionType: POLL_VOTE }, select: { userId: true, context: true } },
    },
  });
  return createApiResponse({
    polls: polls.map((p, index) => {
      const options = parsePollOptions(p.relatedContext);
      const mine = p.interactions.find((v) => v.userId === user.id);
      const tally = tallyPoll(options, p.interactions);
      return {
        id: p.id,
        question: p.title,
        options,
        isDaily: index === 0,
        voted: Boolean(mine),
        myChoice: mine ? Number(mine.context) : null,
        total: mine ? tally.total : null,
        results: mine ? visibleResults(tally) : null,
      };
    }),
  });
}, { requireAuth: true });
