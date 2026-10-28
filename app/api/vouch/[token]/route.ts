import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { confirmVouch, viewVouchRequest } from '@/lib/vouch';
import { logAuditEvent, AuditEventType } from '@/lib/audit-logging';

const tokenFrom = (url: string) => decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '');

export const GET = withAuth(async (req, user) => {
  const result = await viewVouchRequest(tokenFrom(req.url), user);
  return result.ok ? NextResponse.json(result.value) : NextResponse.json({ error: result.error }, { status: result.status });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  const result = await confirmVouch(tokenFrom(req.url), user, body.attested);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  await logAuditEvent({ userId: user.id, targetUserId: result.value.applicantId, eventType: AuditEventType.USER_UPDATED, resourceType: 'User', resourceId: result.value.applicantId, metadata: { vouchedFor: true } });
  return NextResponse.json({ success: true });
});
