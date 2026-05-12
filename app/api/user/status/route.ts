import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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
      },
    });

    if (!user) {
      return NextResponse.json({
        authenticated: true,
        onboardingCompleted: false
      });
    }

    // Check if onboarding is complete
    // Onboarding requires: userRole, handle, and linkedinUrl (optional for alpha)
    const isOnboardingComplete = Boolean(
      user.userRole &&
      user.handle &&
      (user.linkedinUrl || true) // linkedinUrl optional for alpha
    );

    return NextResponse.json({
      authenticated: true,
      onboardingCompleted: isOnboardingComplete,
      userRole: user.userRole,
      handle: user.handle,
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json({ 
      authenticated: false,
      onboardingCompleted: false 
    }, { status: 500 });
  }
}