import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { referralCodeFor, referralStats } from '@/lib/referrals';

export const GET = withAuth(async (req, user) => {
  const code = await referralCodeFor(user);
  if (!code) return NextResponse.json({ error: 'Invite links open once your membership is verified.' }, { status: 403 });
  return NextResponse.json({ link: `${new URL(req.url).origin}/join/${code}`, ...(await referralStats(user.id)) });
});
