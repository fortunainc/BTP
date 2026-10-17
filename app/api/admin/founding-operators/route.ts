import { isAdminMember } from '@/lib/access-policy';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';

/** PATCH { userId, founding } — founding operators get first-answer alerts for new questions. */
export const PATCH = withAuth(async (request, user) => {
  if (!isAdminMember(user)) return createErrorResponse('Admin access required', 403);
  const body = await request.json().catch(() => ({}));
  if (typeof body.userId !== 'string' || typeof body.founding !== 'boolean') return createErrorResponse('userId and founding are required', 400);
  const target = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true, verificationStatus: true } });
  if (!target) return createErrorResponse('Member not found', 404);
  if (body.founding && target.verificationStatus !== 'Approved') return createErrorResponse('Approve the member first', 400);
  await prisma.$transaction([
    prisma.user.update({ where: { id: target.id }, data: { isFoundingOperator: body.founding } }),
    prisma.auditLog.create({ data: { userId: user.id, action: body.founding ? 'FOUNDING_OPERATOR_ADDED' : 'FOUNDING_OPERATOR_REMOVED', resourceType: 'User', resourceId: target.id } }),
  ]);
  return createApiResponse({ userId: target.id, founding: body.founding });
}, { requireAuth: true });
