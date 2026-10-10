import { randomUUID } from 'crypto';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { applyAutomaticRedaction } from '@/lib/anti-correlation';
import { buildLedgerEvent } from '@/lib/knowledge-ledger';
import { prisma } from '@/lib/prisma';

const HELP_TYPES = ['CONSULTATION', 'WRITTEN_REVIEW', 'DOCUMENT_REVIEW', 'PROJECT_HELP'];

export const GET = withAuth(async (_req, user) => {
  if (user.verificationStatus !== 'Approved' && user.userRole !== 'admin') {
    return createErrorResponse('Approved BTP membership is required', 403);
  }

  const requests = await prisma.privateHelpRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      contributionId: true,
      helpType: true,
      details: true,
      timing: true,
      status: true,
      createdAt: true,
    },
  });

  return createApiResponse({ requests });
}, { requireAuth: true });

export const POST = withAuth(async (req, user) => {
  if (user.verificationStatus !== 'Approved' && user.userRole !== 'admin') {
    return createErrorResponse('Approved BTP membership is required', 403);
  }

  const body = await req.json();
  const contributionId = String(body.contributionId || '');
  const helpType = String(body.helpType || 'CONSULTATION');
  const rawDetails = String(body.details || '').trim();
  const timing = body.timing ? String(body.timing).trim().slice(0, 100) : null;

  if (!contributionId || !rawDetails) return createErrorResponse('Help request details are required', 400);
  if (!HELP_TYPES.includes(helpType)) return createErrorResponse('Invalid help type', 400);
  if (rawDetails.length > 2000) return createErrorResponse('Details must be 2,000 characters or fewer', 400);

  const question = await prisma.contribution.findFirst({
    where: { id: contributionId, contributionType: { in: ['question', 'situation'] } },
    select: { id: true },
  });
  if (!question) return createErrorResponse('Question not found', 404);

  const { redactedContent } = applyAutomaticRedaction(rawDetails);
  const requestId = randomUUID();
  const helpRequestData = {
    data: {
      id: requestId,
      contributionId,
      userId: user.id,
      helpType,
      details: redactedContent,
      timing,
    },
  };
  const ledgerEvent = buildLedgerEvent({
    aggregateType: 'HELP_REQUEST',
    aggregateId: requestId,
    eventType: 'CREATED',
    actorUserId: user.id,
    payload: {
      questionId: contributionId,
      helpType,
      details: redactedContent,
      timing,
      status: 'NEW',
    },
  });
  const [helpRequest] = await prisma.$transaction([
    prisma.privateHelpRequest.create(helpRequestData),
    prisma.knowledgeLedgerEvent.create({ data: ledgerEvent }),
  ]);

  return createApiResponse({ success: true, id: helpRequest.id });
}, { requireAuth: true });
