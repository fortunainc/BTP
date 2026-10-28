import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { createVouchRequest, vouchStatus } from '@/lib/vouch';
import { logAuditEvent, AuditEventType } from '@/lib/audit-logging';

export const GET = withAuth(async (_req, user) => NextResponse.json({ status: await vouchStatus(user.id) }));

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  const result = await createVouchRequest(user, body.note);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  await logAuditEvent({ userId: user.id, eventType: AuditEventType.USER_UPDATED, resourceType: 'User', resourceId: user.id, metadata: { vouchRequested: true } });
  return NextResponse.json({ link: `${new URL(req.url).origin}/vouch/${result.value}` });
});
