import { withAuth, createApiResponse } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (_request, user) => {
  const request = await prisma.accountDeletionRequest.upsert({
    where: { userId: user.id }, update: {}, create: { userId: user.id },
    select: { id: true, status: true, createdAt: true },
  });
  return createApiResponse({ request });
}, { requireAuth: true, allowSuspended: true });
export const GET = withAuth(async (_request, user) => {
  return createApiResponse({ request: await prisma.accountDeletionRequest.findUnique({
    where: { userId: user.id }, select: { id: true, status: true, createdAt: true },
  }) });
}, { requireAuth: true, allowSuspended: true });
