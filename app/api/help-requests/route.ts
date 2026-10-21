import { isApprovedMember } from '@/lib/access-policy';
import { randomUUID } from 'crypto';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { applyAutomaticRedaction } from '@/lib/anti-correlation';
import { buildLedgerEvent } from '@/lib/knowledge-ledger';
import { prisma } from '@/lib/prisma';

const HELP_TYPES = ['CONSULTATION', 'INTERVIEW_PREP', 'WRITTEN_REVIEW', 'DOCUMENT_REVIEW', 'PROJECT_HELP'];

export const GET = withAuth(async (_req, user) => {
  if (!isApprovedMember(user)) {
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
      memberUpdate: true,
      feedback: true,
    },
  });

  return createApiResponse({ requests });
}, { requireAuth: true });

export const POST = withAuth(async (req, user) => {
  if (!isApprovedMember(user)) {
    return createErrorResponse('Approved BTP membership is required', 403);
  }

  const body = await req.json().catch(() => ({}));
  const contributionId = body.contributionId ? String(body.contributionId) : null;
  const helpType = String(body.helpType || 'CONSULTATION');
  const rawDetails = String(body.details || '').trim();
  const timing = body.timing ? applyAutomaticRedaction(String(body.timing).trim().slice(0, 100)).redactedContent : null;

  if (!rawDetails) return createErrorResponse('Help request details are required', 400);
  if (!HELP_TYPES.includes(helpType)) return createErrorResponse('Invalid help type', 400);
  if (rawDetails.length > 2000) return createErrorResponse('Details must be 2,000 characters or fewer', 400);

  const question = contributionId ? await prisma.contribution.findFirst({
    where: {
      id: contributionId,
      contributionType: { in: ['question', 'situation'] },
      isHidden: false,
      isFlagged: false,
      forceExcludeFromPatterns: false,
    },
    select: { id: true },
  }) : null;
  if (contributionId && !question) return createErrorResponse('Question not found', 404);

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

export const PATCH = withAuth(async (req, user) => {
  if (!isApprovedMember(user)) return createErrorResponse('Approved BTP membership is required', 403);
  const body = await req.json().catch(() => ({}));
  if (typeof body.id !== 'string' || typeof body.feedback !== 'string' || !body.feedback.trim() || body.feedback.length > 2000) return createErrorResponse('Request ID and feedback (1–2,000 characters) are required', 400);
  const feedback = applyAutomaticRedaction(body.feedback.trim()).redactedContent;
  const saved = await prisma.$transaction(async tx => {
    const changed = await tx.privateHelpRequest.updateMany({ where: { id: body.id, userId: user.id, status: 'COMPLETED', feedback: null }, data: { feedback } });
    if (!changed.count) return false;
    const event = { aggregateType: 'HELP_REQUEST' as const, aggregateId: body.id, eventType: 'FEEDBACK_RECORDED', actorUserId: user.id, payload: { feedback } };
    const ref = buildLedgerEvent(event).aggregateRefHash;
    const previous = await tx.knowledgeLedgerEvent.findFirst({ where: { aggregateType: 'HELP_REQUEST', aggregateRefHash: ref }, orderBy: { sequence: 'desc' } });
    await tx.knowledgeLedgerEvent.create({ data: buildLedgerEvent({ ...event, sequence: previous ? previous.sequence + 1 : 0, previousEventHash: previous?.rowHash }) });
    return true;
  });
  return saved ? createApiResponse({ success: true }) : createErrorResponse('This completed request is unavailable or already has feedback', 409);
}, { requireAuth: true });
