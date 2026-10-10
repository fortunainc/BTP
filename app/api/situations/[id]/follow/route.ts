import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';

function contributionIdFrom(request: NextRequest): string | null {
  return new URL(request.url).pathname.split('/')[3] || null;
}

async function requireVisibleCase(contributionId: string) {
  return prisma.contribution.findFirst({
    where: {
      id: contributionId,
      contributionType: { in: ['question', 'situation'] },
      isHidden: false,
      isFlagged: false,
      forceExcludeFromPatterns: false,
    },
    select: { id: true },
  });
}

export const GET = withAuth(async (request, user) => {
  if (user.verificationStatus !== 'Approved' && user.userRole !== 'admin') {
    return createErrorResponse('Approved BTP membership is required', 403);
  }

  const contributionId = contributionIdFrom(request);
  if (!contributionId) return createErrorResponse('Question ID is required', 400);
  if (!(await requireVisibleCase(contributionId))) return createErrorResponse('Question not found', 404);

  const follow = await prisma.caseFollow.findUnique({
    where: { contributionId_userId: { contributionId, userId: user.id } },
    select: { createdAt: true },
  });

  return createApiResponse({ following: Boolean(follow), followedAt: follow?.createdAt ?? null });
}, { requireAuth: true });

export const POST = withAuth(async (request, user) => {
  if (user.verificationStatus !== 'Approved' && user.userRole !== 'admin') {
    return createErrorResponse('Approved BTP membership is required', 403);
  }

  const contributionId = contributionIdFrom(request);
  if (!contributionId) return createErrorResponse('Question ID is required', 400);
  if (!(await requireVisibleCase(contributionId))) return createErrorResponse('Question not found', 404);

  const follow = await prisma.caseFollow.upsert({
    where: { contributionId_userId: { contributionId, userId: user.id } },
    update: {},
    create: { contributionId, userId: user.id },
    select: { createdAt: true },
  });

  return createApiResponse({ following: true, followedAt: follow.createdAt }, 201);
}, { requireAuth: true });

export const DELETE = withAuth(async (request, user) => {
  if (user.verificationStatus !== 'Approved' && user.userRole !== 'admin') {
    return createErrorResponse('Approved BTP membership is required', 403);
  }

  const contributionId = contributionIdFrom(request);
  if (!contributionId) return createErrorResponse('Question ID is required', 400);

  await prisma.caseFollow.deleteMany({ where: { contributionId, userId: user.id } });
  return createApiResponse({ following: false });
}, { requireAuth: true });
