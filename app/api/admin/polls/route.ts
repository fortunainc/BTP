import { isAdminMember } from '@/lib/access-policy';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { POLL_TYPE, validatePollInput } from '@/lib/engagement';

/** POST /api/admin/polls { question, options[] } — the newest poll is the daily question. */
export const POST = withAuth(async (request, user) => {
  if (!isAdminMember(user)) return createErrorResponse('Admin access required', 403);
  const body = await request.json().catch(() => ({}));
  const input = validatePollInput(body.question, body.options);
  if (!input.ok) return createErrorResponse(input.error, 400);
  const poll = await prisma.contribution.create({
    data: {
      userId: user.id,
      contributionType: POLL_TYPE,
      title: input.question,
      description: input.question,
      therapeuticArea: typeof body.therapeuticArea === 'string' && body.therapeuticArea ? body.therapeuticArea : 'Other',
      trialPhase: 'Multi-phase',
      issueCategory: 'Other',
      relatedContext: { poll: { options: input.options } },
      // Polls are member-facing questions, not operator situations.
      forceExcludeFromPatterns: true,
    },
    select: { id: true },
  });
  await prisma.auditLog.create({ data: { userId: user.id, action: 'POLL_CREATED', resourceType: 'Contribution', resourceId: poll.id } });
  return createApiResponse({ id: poll.id }, 201);
}, { requireAuth: true });
