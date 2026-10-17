import { isApprovedMember } from '@/lib/access-policy';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { addReaction, checkReaction } from '@/lib/engagement';

function answerIdFrom(request: Request): string | null {
  return new URL(request.url).pathname.split('/')[3] || null;
}

async function visibleAnswer(answerId: string) {
  return prisma.interaction.findFirst({
    where: {
      id: answerId,
      interactionType: 'ANSWER',
      displayStatus: 'VISIBLE',
      contribution: { isHidden: false, isFlagged: false, forceExcludeFromPatterns: false },
    },
    select: { id: true, userId: true },
  });
}

export const GET = withAuth(async (request, user) => {
  if (!isApprovedMember(user)) {
    return createErrorResponse('Approved BTP membership is required', 403);
  }
  const answerId = answerIdFrom(request);
  if (!answerId || !(await visibleAnswer(answerId))) return createErrorResponse('Answer not found', 404);

  const feedback = await prisma.auditLog.findFirst({
    where: { userId: user.id, action: 'ANSWER_MARKED_HELPFUL', resourceType: 'Interaction', resourceId: answerId },
    select: { id: true },
  });
  return createApiResponse({ helpful: Boolean(feedback) });
}, { requireAuth: true });

export const POST = withAuth(async (request, user) => {
  if (!isApprovedMember(user)) {
    return createErrorResponse('Approved BTP membership is required', 403);
  }
  const answerId = answerIdFrom(request);
  if (!answerId) return createErrorResponse('Answer not found', 404);
  const check = await checkReaction(answerId, user.id, 'HELPFUL');
  if (!check.ok) return createErrorResponse(check.error === 'You cannot react to your own answer' ? 'You cannot mark your own answer helpful' : check.error, check.status);
  const { created } = await addReaction(user.id, 'HELPFUL', check.answer);
  return createApiResponse({ helpful: true }, created ? 201 : 200);
}, { requireAuth: true });

export const DELETE = withAuth(async (request, user) => {
  if (!isApprovedMember(user)) {
    return createErrorResponse('Approved BTP membership is required', 403);
  }
  const answerId = answerIdFrom(request);
  if (!answerId) return createErrorResponse('Answer ID is required', 400);
  await prisma.auditLog.deleteMany({
    where: { userId: user.id, action: 'ANSWER_MARKED_HELPFUL', resourceType: 'Interaction', resourceId: answerId },
  });
  return createApiResponse({ helpful: false });
}, { requireAuth: true });
