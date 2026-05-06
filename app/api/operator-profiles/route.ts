import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redactContent, validateContent } from '@/lib/redaction';
import { currentUser } from '@clerk/nextjs/server';

// GET - Get operator profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const profile = await prisma.operatorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            handle: true,
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching operator profile:', error);
    return NextResponse.json({ error: 'Failed to fetch operator profile' }, { status: 500 });
  }
}

// POST - Create or update operator profile
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      role,
      yearsExperience,
      therapeuticAreas,
      trialPhases,
      siteTypes,
      certifications,
      languages,
      location,
      timezone,
      isAvailable,
      availabilityNote,
      minSites,
      maxSites,
      travelWilling,
      remoteCapable,
      hourlyRate
    } = await request.json();

    // Validate content
    const contentToValidate = (location || '') + (availabilityNote || '') + (certifications?.join('') || '');
    const contentValidation = validateContent(contentToValidate);
    if (!contentValidation.isValid) {
      return NextResponse.json({ error: contentValidation.errors.join(', ') }, { status: 400 });
    }

    // Get or create user handle
    let userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { handle: true }
    });

    if (!userData) {
      // Create user record with TrustVector
      userData = await prisma.user.create({
        data: {
          id: user.id,
          clerkId: user.id,
          handle: `Operator_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          userRole: 'operator',
          roleCategory: 'CRA',
          companyCategory: 'independent',
          trustVector: {
            create: {}
          }
        },
        select: { handle: true }
      });
    }

    // Create or update operator profile
    const profile = await prisma.operatorProfile.upsert({
      where: { userId: user.id },
      update: {
        role,
        yearsExperience,
        therapeuticAreas,
        trialPhases,
        siteTypes,
        certifications,
        languages,
        location: location ? redactContent(location) : null,
        timezone,
        isAvailable,
        availabilityNote: availabilityNote ? redactContent(availabilityNote) : null,
        minSites,
        maxSites,
        travelWilling,
        remoteCapable,
        hourlyRate
      },
      create: {
        userId: user.id,
        handle: userData.handle,
        role,
        yearsExperience: yearsExperience || 0,
        therapeuticAreas: therapeuticAreas || [],
        trialPhases: trialPhases || [],
        siteTypes: siteTypes || [],
        certifications: certifications || [],
        languages: languages || [],
        location: location ? redactContent(location) : null,
        timezone,
        isAvailable: isAvailable ?? true,
        availabilityNote: availabilityNote ? redactContent(availabilityNote) : null,
        minSites: minSites || 1,
        maxSites: maxSites || 5,
        travelWilling: travelWilling ?? true,
        remoteCapable: remoteCapable ?? false,
        hourlyRate
      },
      include: {
        user: {
          select: {
            id: true,
            handle: true,
          }
        }
      }
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error creating operator profile:', error);
    return NextResponse.json({ error: 'Failed to create operator profile' }, { status: 500 });
  }
}
