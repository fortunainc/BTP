import { isApprovedMember } from '@/lib/access-policy';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { InputSanitization } from '@/lib/input-sanitization';

const ALLOWED_REASONS = [
  'IDENTIFYING_INFORMATION',
  'CONFIDENTIAL_INFORMATION',
  'PATIENT_INFORMATION',
  'HARASSMENT',
  'MISINFORMATION',
  'URGENT_SAFETY_OR_MISCONDUCT',
  'OTHER',
];

export const POST = withAuth(async (request, user) => {
  if (!isApprovedMember(user)) {
    return createErrorResponse('Approved BTP membership is required', 403);
  }

  const body = await request.json();
  const contentType = String(body.contentType || '').toUpperCase();
  const contentId = String(body.contentId || '');
  const reason = String(body.reason || '').toUpperCase();
  const description = typeof body.description === 'string'
    ? InputSanitization.sanitizeText(body.description.trim().slice(0, 500))
    : null;

  if (!['QUESTION', 'ANSWER'].includes(contentType) || !contentId) {
    return createErrorResponse('A valid question or answer is required', 400);
  }
  if (!ALLOWED_REASONS.includes(reason)) {
    return createErrorResponse('A valid report reason is required', 400);
  }

  const storedContentType = contentType === 'QUESTION' ? 'Contribution' : 'Interaction';
  const contentExists = contentType === 'QUESTION'
    ? await prisma.contribution.findFirst({
        where: {
          id: contentId,
          contributionType: { in: ['question', 'situation'] },
          isHidden: false,
          isFlagged: false,
          forceExcludeFromPatterns: false,
        },
        select: { id: true },
      })
    : await prisma.interaction.findFirst({
        where: {
          id: contentId,
          interactionType: 'ANSWER',
          displayStatus: 'VISIBLE',
          contribution: { isHidden: false, isFlagged: false, forceExcludeFromPatterns: false },
        },
        select: { id: true },
      });

  if (!contentExists) return createErrorResponse('Content not found', 404);

  const duplicate = await prisma.flaggedContent.findFirst({
    where: {
      contentType: storedContentType,
      contentId,
      reportedBy: user.id,
      status: 'Pending',
    },
    select: { id: true },
  });
  if (duplicate) return createApiResponse({ success: true, reportId: duplicate.id, alreadyReported: true });

  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.flaggedContent.create({
      data: {
        contentType: storedContentType,
        contentId,
        reportedBy: user.id,
        reason,
        description,
      },
      select: { id: true },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'CONTENT_REPORTED',
        resourceType: storedContentType,
        resourceId: contentId,
        details: { reason, reportId: created.id },
      },
    });
    return created;
  });

  return createApiResponse({ success: true, reportId: report.id }, 201);
}, { requireAuth: true });

export const GET = withAuth(async (_request, user) => {
  if (!isApprovedMember(user)) {
    return createErrorResponse('Approved BTP membership is required', 403);
  }
  const reports = await prisma.flaggedContent.findMany({
    where: { reportedBy: user.id },
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: { id: true, contentType: true, reason: true, status: true, action: true, createdAt: true, reviewedAt: true },
  });
  return createApiResponse({ reports });
}, { requireAuth: true });
