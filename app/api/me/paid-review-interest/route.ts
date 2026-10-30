import { isApprovedMember } from '@/lib/access-policy';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { getPaidReviewInterest, setPaidReviewInterest } from '@/lib/paid-review-interest';

function privateResponse(data: unknown, status = 200) {
  const response = createApiResponse(data, status);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/me/paid-review-interest: { interested, roleLabel, yearsExperience } for the signed-in member only. */
export const GET = withAuth(async (_request, user) => {
  if (!isApprovedMember(user)) return createErrorResponse('Approved BTP membership is required', 403);
  return privateResponse(await getPaidReviewInterest(user.id));
}, { requireAuth: true });

/** PUT /api/me/paid-review-interest with { interested: boolean }. */
export const PUT = withAuth(async (request, user) => {
  if (!isApprovedMember(user)) return createErrorResponse('Approved BTP membership is required', 403);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.interested !== 'boolean') return createErrorResponse('interested must be true or false', 400);
  const result = await setPaidReviewInterest(user.id, body.interested);
  if (!result.ok) return createErrorResponse(result.error, result.status);
  return privateResponse(result.value);
}, { requireAuth: true });
