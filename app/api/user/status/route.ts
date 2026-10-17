import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { onboardingComplete } from '@/lib/member-provisioning';
import { isApprovedMember } from '@/lib/access-policy';

/**
 * GET /api/user/status
 * 
 * Returns the user's status including onboarding completion
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        authenticated: false,
        onboardingCompleted: false 
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        userRole: true,
        handle: true,
        linkedinUrl: true,
        roleCategory: true,
        verificationStatus: true,
        isSuspended: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        authenticated: true,
        onboardingCompleted: false
      });
    }

    const isOnboardingComplete = onboardingComplete(user);

    return NextResponse.json({
      authenticated: true,
      onboardingCompleted: isOnboardingComplete,
      userRole: user.userRole,
      handle: user.handle,
      verificationStatus: user.verificationStatus,
      approved: isApprovedMember(user),
      suspended: user.isSuspended,
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json({ 
      authenticated: false,
      onboardingCompleted: false 
    }, { status: 500 });
  }
}