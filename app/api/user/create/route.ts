import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (existingUser) {
      return NextResponse.json({ user: existingUser });
    }

    // Generate anonymous handle based on user ID
    const anonymousHandle = `Operator_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create new user with TrustVector
    const user = await prisma.user.create({
      data: {
        clerkId: userId,
        handle: anonymousHandle,
        userRole: 'operator',
        roleCategory: 'CRA',
        companyCategory: 'independent',
        // Create initial TrustVector for new user
        trustVector: {
          create: {}
        }
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}