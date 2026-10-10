import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';

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
  if (user.verificationStatus !== 'Approved' && user.userRole !== 'admin') {
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
  if (user.verificationStatus !== 'Approved' && user.userRole !== 'admin') {
    return createErrorResponse('Approved BTP membership is required', 403);
  }
  const answerId = answerIdFrom(request);
  const answer = answerId ? await visibleAnswer(answerId) : null;
  if (!answerId || !answer) return createErrorResponse('Answer not found', 404);
  if (answer.userId === user.id) return createErrorResponse('You cannot mark your own answer helpful', 400);

  const existing = await prisma.auditLog.findFirst({
    where: { userId: user.id, action: 'ANSWER_MARKED_HELPFUL', resourceType: 'Interaction', resourceId: answerId },
    select: { id: true },
  });
  if (!existing) {
    await prisma.$transaction([
      prisma.auditLog.create({
        data: { userId: user.id, action: 'ANSWER_MARKED_HELPFUL', resourceType: 'Interaction', resourceId: answerId },
      }),
      ...(answer.userId ? [prisma.notification.create({
        data: {
          userId: answer.userId,
          variantId: 'IMPACT-ANSWER-HELPED',
          notificationClass: 'VALIDATION',
          priority: 'P2',
          copy: 'Your answer helped another BTP member.',
          relatedPostId: answerId,
          surfaces: ['in_app', 'push'],
          deliveredTo: [],
        },
      })] : []),
    ]);
  }
  return createApiResponse({ helpful: true }, existing ? 200 : 201);
}, { requireAuth: true });

export const DELETE = withAuth(async (request, user) => {
  if (user.verificationStatus !== 'Approved' && user.userRole !== 'admin') {
    return createErrorResponse('Approved BTP membership is required', 403);
  }
  const answerId = answerIdFrom(request);
  if (!answerId) return createErrorResponse('Answer ID is required', 400);
  await prisma.auditLog.deleteMany({
    where: { userId: user.id, action: 'ANSWER_MARKED_HELPFUL', resourceType: 'Interaction', resourceId: answerId },
  });
  return createApiResponse({ helpful: false });
}, { requireAuth: true });
