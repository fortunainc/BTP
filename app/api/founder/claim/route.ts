import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const FOUNDER_EMAIL = 'fortunaindustriesinc@gmail.com';

export async function POST() {
  const { userId } = await auth();
  const identity = await currentUser();
  if (!userId || !identity) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const verifiedEmail = identity.emailAddresses.find((item) => item.id === identity.primaryEmailAddressId && item.verification?.status === 'verified')?.emailAddress.toLowerCase();
  if (verifiedEmail !== FOUNDER_EMAIL) return NextResponse.json({ error: 'Founder identity does not match' }, { status: 403 });

  const existing = await prisma.user.findFirst({
    where: { OR: [{ clerkId: userId }, { email: FOUNDER_EMAIL }] },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        clerkId: userId,
        email: FOUNDER_EMAIL,
        emailVerified: true,
        userRole: 'founder',
        verificationStatus: 'Approved',
        verificationMethod: existing.verificationMethod || 'founder_claim',
        verifiedAt: existing.verifiedAt || new Date(),
        isSuspended: false,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        clerkId: userId,
        email: FOUNDER_EMAIL,
        emailVerified: true,
        handle: `BTP-Founder-${userId.slice(-6)}`,
        userRole: 'founder',
        roleCategory: 'operations',
        companyCategory: 'sponsor',
        verificationStatus: 'Approved',
        verificationMethod: 'founder_claim',
        verifiedAt: new Date(),
        isFoundingOperator: true,
      },
    });
  }

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { ...identity.publicMetadata, role: 'founder' },
  });

  return NextResponse.json({ success: true });
}
