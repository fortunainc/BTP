import { isApprovedMember } from '@/lib/access-policy';
import { withAuth, createApiResponse } from '@/lib/api-auth';

/**
 * Minimal bearer-token probe for the Expo app. Clerk's route-handler auth reads
 * the Authorization: Bearer <session token> header sent by mobile/lib/api.ts.
 */
export const GET = withAuth(async (_request, user) => createApiResponse({
  authenticated: true,
  member: {
    id: user.id,
    handle: user.handle,
    roleCategory: user.roleCategory,
    companyCategory: user.companyCategory,
    verificationStatus: user.verificationStatus,
    approved: isApprovedMember(user),
  },
}), { requireAuth: true });
