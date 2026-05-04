/**
 * Opportunity Details API
 * 
 * GET /api/opportunities/[id] - Get opportunity details with match info
 * 
 * Architecture Rules:
 * - Only accessible to matched operators
 * - Returns opportunity details with match metadata
 * - Includes CapabilityIdentity compatibility score
 * - No exposing of other applicants
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user to verify they are an operator
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { trustVector: true },
    });

    if (!user || user.userRole !== 'OPERATOR') {
      return NextResponse.json(
        { error: 'Only operators can view opportunity details' },
        { status: 403 }
      );
    }

    // Get job posting (the actual model name)
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            handle: true,
          },
        },
      },
    });

    if (!jobPosting) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Get the user's CapabilityIdentity to check for match
    const capabilityIdentity = await prisma.capabilityIdentity.findUnique({
      where: { userId: user.id },
    });

    if (!capabilityIdentity) {
      return NextResponse.json(
        { error: 'Capability identity not found' },
        { status: 404 }
      );
    }

    // Check if operator has been matched to this opportunity
    const existingMatch = await prisma.opportunityMatch.findFirst({
      where: {
        jobPostingId: id,
        capabilityIdentityId: capabilityIdentity.id,
      },
    });

    if (!existingMatch) {
      return NextResponse.json(
        { error: 'This opportunity is not available to you. Opportunities are only shown based on capability matching.' },
        { status: 403 }
      );
    }

    // Calculate match reasons based on capability identity
    const matchReasons: string[] = [];
    
    // Check therapeutic area match
    if (jobPosting.therapeuticArea && capabilityIdentity.therapeuticAreas) {
      const areas = capabilityIdentity.therapeuticAreas as { area: string; confidence: number }[];
      const matchedArea = areas.find(a => a.area === jobPosting.therapeuticArea);
      if (matchedArea && matchedArea.confidence >= 0.7) {
        matchReasons.push(`Strong experience in ${jobPosting.therapeuticArea.replace('_', ' ')}`);
      }
    }

    // Check trial phase match
    if (jobPosting.trialPhase && capabilityIdentity.trialPhases) {
      const phases = capabilityIdentity.trialPhases as { phase: string; count: number }[];
      const matchedPhase = phases.find(p => p.phase === jobPosting.trialPhase);
      if (matchedPhase) {
        matchReasons.push(`Experience with Phase ${jobPosting.trialPhase} trials`);
      }
    }

    // Check contribution history
    if (user.trustVector && user.trustVector.quality >= 0.7) {
      matchReasons.push('Strong contribution history');
    } else {
      matchReasons.push('Relevant capability match');
    }

    // Check application status via operator profile
    const operatorProfile = await prisma.operatorProfile.findUnique({
      where: { userId: user.id },
    });
    
    let application = null;
    if (operatorProfile) {
      application = await prisma.application.findFirst({
        where: {
          jobPostingId: id,
          operatorId: operatorProfile.id,
        },
      });
    }

    return NextResponse.json({
      opportunity: {
        id: jobPosting.id,
        title: jobPosting.title,
        description: jobPosting.description,
        therapeuticArea: jobPosting.therapeuticArea,
        trialPhase: jobPosting.trialPhase,
        location: jobPosting.location,
        remoteCapable: jobPosting.remoteCapable,
        priorityLevel: jobPosting.priorityLevel,
        requiredRole: jobPosting.requiredRole,
        requiredSkills: jobPosting.requiredSkills,
        compensationBand: jobPosting.compensationBand,
        matchScore: existingMatch.matchScore,
        matchReasons: matchReasons,
        constraints: {
          requiredTherapeuticAreas: jobPosting.therapeuticArea ? [jobPosting.therapeuticArea] : [],
        },
      },
      applicationStatus: application?.status || 'none',
    });
  } catch (error) {
    console.error('Error fetching opportunity details:', error);
    return NextResponse.json(
      { error: 'Failed to load opportunity details' },
      { status: 500 }
    );
  }
}