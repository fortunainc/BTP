import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';
import { hashEmail, hashToken, isWorkEmail, newToken, normalizeEmail } from '@/lib/work-email';

/** Emails a one-click link to a work address so the member can show they work in the field. The address is deleted at approval. */
export const POST = withAuth(async (req, user) => {
  if (user.verificationStatus === 'Approved') return NextResponse.json({ error: 'Your membership is already verified.' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  if (!email) return NextResponse.json({ error: 'Enter a valid work email address.' }, { status: 400 });
  if (!isWorkEmail(email)) return NextResponse.json({ error: 'Use your work email, not a personal address.' }, { status: 400 });
  const usedBy = await prisma.user.findUnique({ where: { workEmailHash: hashEmail(email) }, select: { id: true } });
  if (usedBy && usedBy.id !== user.id) return NextResponse.json({ error: 'That work email is already linked to another BTP account. Contact BTP support if this is a mistake.' }, { status: 409 });
  const token = newToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { workEmailPending: email, workEmailTokenHash: hashToken(token), workEmailTokenExpires: new Date(Date.now() + 30 * 60_000), workEmailVerifiedAt: null },
  });
  const link = `${new URL(req.url).origin}/api/user/work-email/confirm?token=${token}`;
  const sent = await sendEmail(email, 'Confirm your work email for BTP',
    `Click to confirm this work email for Behind the Protocol:\n\n${link}\n\nThe link expires in 30 minutes.\n\nBTP uses this address only to confirm you work in clinical research. The address is deleted once your membership is reviewed and is never shown to members.\n\nIf you did not request this, ignore this email.`);
  if (!sent) return NextResponse.json({ error: 'The email could not be sent. Try again or contact BTP support.' }, { status: 502 });
  return NextResponse.json({ success: true });
});
