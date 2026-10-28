import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { codeMatches } from '@/lib/work-email';
import { logAuditEvent, AuditEventType } from '@/lib/audit-logging';

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: 'Enter the 6-digit code from your email.' }, { status: 400 });
  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { workEmailCodeHash: true, workEmailCodeExpires: true } });
  if (!record?.workEmailCodeHash || !record.workEmailCodeExpires || record.workEmailCodeExpires < new Date()) {
    return NextResponse.json({ error: 'That code has expired. Send a new one.' }, { status: 400 });
  }
  if (!codeMatches(user.id, code, record.workEmailCodeHash)) return NextResponse.json({ error: 'That code is not right. Check the email and try again.' }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { workEmailVerifiedAt: new Date(), workEmailCodeHash: null, workEmailCodeExpires: null } });
  await logAuditEvent({ userId: user.id, eventType: AuditEventType.USER_UPDATED, resourceType: 'User', resourceId: user.id, metadata: { workEmailVerified: true } });
  return NextResponse.json({ success: true });
});
