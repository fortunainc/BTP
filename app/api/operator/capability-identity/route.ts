/**
 * Operator Capability Identity API
 * 
 * GET /api/operator/capability-identity - Get operator's capability identity
 * 
 * IMPORTANT: This API strips all identifying information before returning
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { convertToBands } from '@/lib/anonymity-engine';

export async function GET(request: NextRequest) {
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

    // Get or create CapabilityIdentity
    let capabilityIdentity = await prisma.capabilityIdentity.findUnique({
      where: { userId: user.id },
    });

    if (!capabilityIdentity) {
      // Generate CapabilityIdentity from user's contributions
      const contributions = await prisma.contribution.findMany({
        where: { userId: user.id },
        select: {
          therapeuticArea: true,
          trialPhase: true,
          issueCategory: true,
        },
      });

      // Calculate capability breakdown
      const therapeuticAreas: Record<string, number> = {};
      const trialPhases: Record<string, number> = {};
      const issueExpertise: Record<string, number> = {};

      for (const c of contributions) {
        if (c.therapeuticArea) {
          therapeuticAreas[c.therapeuticArea] = (therapeuticAreas[c.therapeuticArea] || 0) + 1;
        }
        if (c.trialPhase) {
          trialPhases[c.trialPhase] = (trialPhases[c.trialPhase] || 0) + 1;
        }
        if (c.issueCategory) {
          issueExpertise[c.issueCategory] = (issueExpertise[c.issueCategory] || 0) + 1;
        }
      }

      // Normalize to 0-1 scale
      const maxArea = Math.max(...Object.values(therapeuticAreas), 1);
      const maxPhase = Math.max(...Object.values(trialPhases), 1);
      const maxIssue = Math.max(...Object.values(issueExpertise), 1);

      for (const key of Object.keys(therapeuticAreas)) {
        therapeuticAreas[key] = therapeuticAreas[key] / maxArea;
      }
      for (const key of Object.keys(trialPhases)) {
        trialPhases[key] = trialPhases[key] / maxPhase;
      }
      for (const key of Object.keys(issueExpertise)) {
        issueExpertise[key] = issueExpertise[key] / maxIssue;
      }

      // Generate profile code (anonymous identifier)
      const profileCode = `CAP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Generate summary
      const topArea = Object.entries(therapeuticAreas).sort(([,a], [,b]) => b - a)[0];
      const topPhase = Object.entries(trialPhases).sort(([,a], [,b]) => b - a)[0];
      const summary = `Experienced operator${topArea ? ` in ${topArea[0]}` : ''}${topPhase ? ` ${topPhase[0]}` : ''}`;

      capabilityIdentity = await prisma.capabilityIdentity.create({
        data: {
          userId: user.id,
          profileId: profileCode,
          therapeuticAreas,
          trialPhases,
          issueExpertise,
          generatedSummary: summary,
          reliabilityScore: 0.5,
          responsivenessScore: 0.5,
        },
      });
    }

    // ANONYMIZE RESPONSE - Remove userId before returning
    const { userId: _, ...anonymousIdentity } = capabilityIdentity;
    
    // Convert exact metrics to bands (never expose exact numbers)
    const bandedMetrics = convertToBands({
      contributionCount: await prisma.contribution.count({ where: { userId: user.id } }),
    });

    return NextResponse.json({
      ...anonymousIdentity,
      activityLevel: bandedMetrics.activityLevel,
      // Never expose internal userId
    });
  } catch (error) {
    console.error('Error fetching capability identity:', error);
    return NextResponse.json({ error: 'Failed to fetch capability identity' }, { status: 500 });
  }
}