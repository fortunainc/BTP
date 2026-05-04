/**
 * Pattern Signals API
 * 
 * Returns pattern information for a contribution
 * 
 * NEVER exposes counts or user data
 * Only returns observable patterns
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
    
    const contribution = await prisma.contribution.findUnique({
      where: { id },
      select: {
        id: true,
        contributionType: true,
        therapeuticArea: true,
        trialPhase: true,
      },
    });

    if (!contribution) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }

    const patterns: string[] = [];

    // Check for SEEN_TOO interactions (pattern validation)
    const seenTooCount = await prisma.interaction.count({
      where: {
        contributionId: contribution.id,
        interactionType: 'SEEN_TOO',
      },
    });

    if (seenTooCount >= 3) {
      patterns.push('Recurring issue');
    }

    if (seenTooCount >= 5) {
      patterns.push('Seen across multiple trials');
    }

    // Check for pattern formation across same therapeutic area
    if (contribution.therapeuticArea) {
      const areaPatternCount = await prisma.contribution.count({
        where: {
          therapeuticArea: contribution.therapeuticArea,
          contributionType: contribution.contributionType,
          id: { not: contribution.id },
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
      });

      if (areaPatternCount >= 5) {
        patterns.push(`Common in ${contribution.therapeuticArea.replace('_', ' ')}`);
      }

      if (contribution.trialPhase && areaPatternCount >= 3) {
        patterns.push(`Common in Phase ${contribution.trialPhase} ${contribution.therapeuticArea.replace('_', ' ')}`);
      }
    }

    // Check for ACCURATE interactions (quality validation)
    const accurateCount = await prisma.interaction.count({
      where: {
        contributionId: contribution.id,
        interactionType: 'ACCURATE',
      },
    });

    if (accurateCount >= 3) {
      patterns.push('Validated by multiple operators');
    }

    // Deduplicate
    const uniquePatterns = [...new Set(patterns)];

    return NextResponse.json({
      patterns: uniquePatterns,
    });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    return NextResponse.json(
      { error: 'Failed to load patterns' },
      { status: 500 }
    );
  }
}