import { withAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { applyAutomaticRedaction } from '@/lib/anti-correlation';
import { buildLedgerEvent } from '@/lib/knowledge-ledger';

const transitions: Record<string, string[]> = {
  NEW: ['REVIEWING', 'CLOSED'], REVIEWING: ['MATCHING', 'CLOSED'],
  MATCHING: ['MATCHED', 'CLOSED'], MATCHED: ['COMPLETED', 'CLOSED'], COMPLETED: [], CLOSED: [],
};
export const GET = withAdminAuth(async () => NextResponse.json({
  requests: await prisma.privateHelpRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
  deletionRequests: await prisma.accountDeletionRequest.findMany({ where: { status: 'REQUESTED' }, orderBy: { createdAt: 'asc' }, take: 200 }),
}));
export const PATCH = withAdminAuth(async (req, admin) => {
  const body = await req.json();
  if (typeof body.id !== 'string' || typeof body.status !== 'string' || typeof body.memberUpdate !== 'string' || !body.memberUpdate.trim() || body.memberUpdate.length > 1000) return NextResponse.json({ error: 'Request, status and member update (1–1,000 characters) are required' }, { status: 400 });
  const existing = await prisma.privateHelpRequest.findUnique({ where: { id: body.id } });
  if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (!transitions[existing.status]?.includes(body.status)) return NextResponse.json({ error: 'Invalid status transition' }, { status: 409 });
  // A match is manual: do not imply expert consent or create contact from a role alone.
  if (body.status === 'MATCHED' && (body.consentConfirmed !== true || typeof body.expertId !== 'string')) return NextResponse.json({ error: 'Expert ID and confirmation of both parties’ consent are required' }, { status: 400 });
  if (body.status === 'MATCHED') {
    const expert = await prisma.user.findFirst({ where: { id: body.expertId, verificationStatus: 'Approved', isSuspended: false }, select: { id: true } });
    if (!expert || expert.id === existing.userId) return NextResponse.json({ error: 'An active, approved expert is required' }, { status: 400 });
  }
  const memberUpdate = applyAutomaticRedaction(body.memberUpdate.trim()).redactedContent;
  const changed = await prisma.$transaction(async tx => {
    const result = await tx.privateHelpRequest.updateMany({ where: { id: existing.id, status: existing.status }, data: {
      status: body.status, memberUpdate,
      ...(body.status === 'MATCHED' ? { assignedExpertId: body.expertId } : {}),
      ...(body.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
    } });
    if (result.count) {
      const event = { aggregateType: 'HELP_REQUEST' as const, aggregateId: existing.id, eventType: 'STATUS_CHANGED', actorUserId: admin.userId!, payload: { from: existing.status, to: body.status, memberUpdate, consentConfirmed: body.consentConfirmed === true } };
      const ref = buildLedgerEvent(event).aggregateRefHash;
      const previous = await tx.knowledgeLedgerEvent.findFirst({ where: { aggregateType: 'HELP_REQUEST', aggregateRefHash: ref }, orderBy: { sequence: 'desc' } });
      await tx.knowledgeLedgerEvent.create({ data: buildLedgerEvent({ ...event, sequence: previous ? previous.sequence + 1 : 0, previousEventHash: previous?.rowHash }) });
    }
    return result.count;
  });
  return NextResponse.json(changed ? { success: true } : { error: 'Request changed; refresh and retry' }, { status: changed ? 200 : 409 });
});
