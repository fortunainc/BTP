/**
 * Operator Profile API
 * 
 * GET /api/operator/profile - Get operator profile
 * PUT /api/operator/profile - Update operator profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch operator profile
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { operatorProfile: true },
    });

    if (!user || user.userRole !== 'operator') {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    if (!user.operatorProfile) {
      // Return empty profile if none exists
      return NextResponse.json({
        yearsExperience: 0,
        therapeuticAreas: [],
        trialPhases: [],
        siteTypes: [],
        certifications: [],
        languages: [],
        location: null,
        timezone: null,
        role: null,
        roleTitle: null,
        organizationType: null,
        isAvailable: true,
        availabilityNote: null,
        minSites: 1,
        maxSites: 5,
        travelWilling: true,
        remoteCapable: false,
        hourlyRate: null,
      });
    }

    return NextResponse.json(user.operatorProfile);
  } catch (error) {
    console.error('Error fetching operator profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT - Update operator profile
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.userRole !== 'operator') {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    const data = await request.json();

    // Upsert operator profile (use correct field names from schema)
    const profile = await prisma.operatorProfile.upsert({
      where: { userId: user.id },
      update: {
        role: data.role,
        yearsExperience: data.yearsExperience ?? 0,
        therapeuticAreas: data.therapeuticAreas ?? [],
        trialPhases: data.trialPhases ?? [],
        siteTypes: data.siteTypes ?? [],
        certifications: data.certifications ?? [],
        languages: data.languages ?? [],
        location: data.location,
        timezone: data.timezone,
        roleTitle: data.roleTitle,
        organizationType: data.organizationType,
        isAvailable: data.isAvailable ?? true,
        availabilityNote: data.availabilityNote,
        minSites: data.minSites ?? 1,
        maxSites: data.maxSites ?? 5,
        travelWilling: data.travelWilling ?? true,
        remoteCapable: data.remoteCapable ?? false,
        hourlyRate: data.hourlyRate,
      },
      create: {
        userId: user.id,
        handle: user.handle || `Operator_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        role: data.role || 'other',
        yearsExperience: data.yearsExperience ?? 0,
        therapeuticAreas: data.therapeuticAreas ?? [],
        trialPhases: data.trialPhases ?? [],
        siteTypes: data.siteTypes ?? [],
        certifications: data.certifications ?? [],
        languages: data.languages ?? [],
        location: data.location,
        timezone: data.timezone,
        roleTitle: data.roleTitle,
        organizationType: data.organizationType,
        isAvailable: data.isAvailable ?? true,
        availabilityNote: data.availabilityNote,
        minSites: data.minSites ?? 1,
        maxSites: data.maxSites ?? 5,
        travelWilling: data.travelWilling ?? true,
        remoteCapable: data.remoteCapable ?? false,
        hourlyRate: data.hourlyRate,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating operator profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}