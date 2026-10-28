import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { generateHandle, isPlaceholderHandle } from '@/lib/handle-words';

/** Suggests a random, unused handle. Returns the member's current handle unless `fresh=1` or it is a placeholder. */
export const GET = withAuth(async (req, user) => {
  const fresh = new URL(req.url).searchParams.get('fresh') === '1';
  if (!fresh && !isPlaceholderHandle(user.handle)) return NextResponse.json({ handle: user.handle });
  for (let attempt = 0; attempt < 6; attempt++) {
    const handle = generateHandle(attempt > 2);
    const taken = await prisma.user.findUnique({ where: { handle }, select: { id: true } });
    if (!taken) return NextResponse.json({ handle });
  }
  return NextResponse.json({ handle: generateHandle(true) });
});
