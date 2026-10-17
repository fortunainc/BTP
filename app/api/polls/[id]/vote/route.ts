import { isApprovedMember } from '@/lib/access-policy';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { POLL_TYPE, POLL_VOTE, parsePollOptions, tallyPoll, visibleResults } from '@/lib/engagement';

/** POST /api/polls/[id]/vote { option } — one vote per member; returns results immediately. */
export const POST = withAuth(async (request, user) => {
  if (!isApprovedMember(user)) return createErrorResponse('Approved BTP membership is required', 403);
  const pollId = new URL(request.url).pathname.split('/')[3];
  const body = await request.json().catch(() => ({}));
  const poll = await prisma.contribution.findFirst({
    where: { id: pollId, contributionType: POLL_TYPE, isHidden: false },
    select: { id: true, relatedContext: true },
  });
  if (!poll) return createErrorResponse('Poll not found', 404);
  const options = parsePollOptions(poll.relatedContext);
  const option = Number(body.option);
  if (!Number.isInteger(option) || option < 0 || option >= options.length) return createErrorResponse('Invalid option', 400);

  const existing = await prisma.interaction.findFirst({
    where: { contributionId: poll.id, userId: user.id, interactionType: POLL_VOTE },
    select: { id: true },
  });
  if (!existing) {
    try {
      await prisma.interaction.create({
        data: { contributionId: poll.id, userId: user.id, interactionType: POLL_VOTE, context: String(option), displayStatus: 'VISIBLE' },
      });
    } catch (error) {
      // A concurrent request already recorded this member's vote.
      if ((error as { code?: string }).code !== 'P2002') throw error;
    }
  }
  const votes = await prisma.interaction.findMany({
    where: { contributionId: poll.id, interactionType: POLL_VOTE },
    select: { userId: true, context: true },
  });
  const mine = votes.find((v) => v.userId === user.id);
  const tally = tallyPoll(options, votes);
  return createApiResponse({ voted: true, myChoice: mine ? Number(mine.context) : option, total: tally.total, results: visibleResults(tally) }, existing ? 200 : 201);
}, { requireAuth: true });
