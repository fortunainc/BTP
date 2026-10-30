import { isApprovedMember } from '@/lib/access-policy';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { savedAnswersFor } from '@/lib/member-saved';

/** GET /api/me/saved-answers: the signed-in member's saved answers, newest first. */
export const GET = withAuth(async (_request, user) => {
  if (!isApprovedMember(user)) return createErrorResponse('Approved BTP membership is required', 403);
  const items = await savedAnswersFor(user.id);
  const response = createApiResponse({ items });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}, { requireAuth: true });
