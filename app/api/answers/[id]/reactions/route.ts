import { isApprovedMember } from '@/lib/access-policy';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { addReaction, checkReaction, isReactionType, reactionSummary, removeReaction } from '@/lib/engagement';

function answerIdFrom(request: Request): string | null {
  return new URL(request.url).pathname.split('/')[3] || null;
}

export const GET = withAuth(async (request, user) => {
  if (!isApprovedMember(user)) return createErrorResponse('Approved BTP membership is required', 403);
  const answerId = answerIdFrom(request);
  if (!answerId) return createErrorResponse('Answer not found', 404);
  const summary = await reactionSummary([answerId], user.id);
  return createApiResponse(summary[answerId]);
}, { requireAuth: true });

export const POST = withAuth(async (request, user) => {
  if (!isApprovedMember(user)) return createErrorResponse('Approved BTP membership is required', 403);
  const answerId = answerIdFrom(request);
  const body = await request.json().catch(() => ({}));
  if (!answerId) return createErrorResponse('Answer not found', 404);
  if (!isReactionType(body.type)) return createErrorResponse('Invalid reaction', 400);
  const check = await checkReaction(answerId, user.id, body.type);
  if (!check.ok) return createErrorResponse(check.error, check.status);
  const { created } = await addReaction(user.id, body.type, check.answer);
  const summary = await reactionSummary([answerId], user.id);
  return createApiResponse(summary[answerId], created ? 201 : 200);
}, { requireAuth: true });

export const DELETE = withAuth(async (request, user) => {
  if (!isApprovedMember(user)) return createErrorResponse('Approved BTP membership is required', 403);
  const answerId = answerIdFrom(request);
  const type = new URL(request.url).searchParams.get('type');
  if (!answerId) return createErrorResponse('Answer not found', 404);
  if (!isReactionType(type)) return createErrorResponse('Invalid reaction', 400);
  await removeReaction(user.id, type, answerId);
  const summary = await reactionSummary([answerId], user.id);
  return createApiResponse(summary[answerId]);
}, { requireAuth: true });
