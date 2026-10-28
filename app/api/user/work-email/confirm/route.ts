import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashEmail, hashToken } from '@/lib/work-email';
import { logAuditEvent, AuditEventType } from '@/lib/audit-logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** One-click confirmation from the work email. The token is the proof; no sign-in needed, so it works when opened on another device. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const back = (status: string) => NextResponse.redirect(new URL(`/onboarding?email=${status}`, req.nextUrl.origin));
  if (token.length < 30) return back('invalid');
  const user = await prisma.user.findUnique({
    where: { workEmailTokenHash: hashToken(token) },
    select: { id: true, workEmailPending: true, workEmailTokenExpires: true },
  });
  if (!user?.workEmailPending || !user.workEmailTokenExpires || user.workEmailTokenExpires < new Date()) return back('expired');
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { workEmailVerifiedAt: new Date(), workEmailHash: hashEmail(user.workEmailPending), workEmailTokenHash: null, workEmailTokenExpires: null },
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') return back('in-use');
    throw error;
  }
  await logAuditEvent({ userId: user.id, eventType: AuditEventType.USER_UPDATED, resourceType: 'User', resourceId: user.id, metadata: { workEmailVerified: true } });
  return back('confirmed');
}
