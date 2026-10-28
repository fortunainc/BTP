import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requestToJoin } from '@/lib/referrals';

export const runtime = 'nodejs';

/** Someone asks to join through a verified member's link; BTP sends them a sign-up invitation automatically. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await requestToJoin(body.code, body.email);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  if (!result.alreadyRequested) {
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      await (await clerkClient()).invitations.createInvitation({
        emailAddress: result.email,
        redirectUrl: `${req.nextUrl.origin}/sign-up`,
        ignoreExisting: true,
      });
      await prisma.accessRequest.update({ where: { email: result.email }, data: { status: 'invited', invitedAt: new Date() } });
    } catch (error) {
      // The request is saved either way; BTP can send the invitation from the admin side.
      console.error('Invitation send failed', error instanceof Error ? error.name : 'unknown');
    }
  }
  return NextResponse.json({ success: true });
}
