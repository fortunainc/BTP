import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';
import { hashCode, isWorkEmail, newCode, normalizeEmail } from '@/lib/work-email';

/** Emails a 6-digit code to a work address so the member can prove they work in the field. The address is deleted at approval. */
export const POST = withAuth(async (req, user) => {
  if (user.verificationStatus === 'Approved') return NextResponse.json({ error: 'Your membership is already verified.' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  if (!email) return NextResponse.json({ error: 'Enter a valid work email address.' }, { status: 400 });
  if (!isWorkEmail(email)) return NextResponse.json({ error: 'Use your work email, not a personal address.' }, { status: 400 });
  const code = newCode();
  await prisma.user.update({
    where: { id: user.id },
    data: { workEmailPending: email, workEmailCodeHash: hashCode(user.id, code), workEmailCodeExpires: new Date(Date.now() + 15 * 60_000), workEmailVerifiedAt: null },
  });
  const sent = await sendEmail(email, 'Your BTP verification code',
    `Your Behind the Protocol verification code is ${code}. It expires in 15 minutes.\n\nBTP uses this address only to confirm you work in clinical research. It is deleted once your membership is reviewed and is never shown to members.\n\nIf you did not request this, ignore this email.`);
  if (!sent) return NextResponse.json({ error: 'The code could not be sent. Try again or contact BTP support.' }, { status: 502 });
  return NextResponse.json({ success: true });
});
