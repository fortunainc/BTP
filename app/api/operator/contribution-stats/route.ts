/**
 * Operator Contribution Stats API
 * 
 * GET /api/operator/contribution-stats - Get contribution statistics for operator
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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

    // Get all contributions
    const contributions = await prisma.contribution.findMany({
      where: { userId: user.id },
      select: {
        contributionType: true,
        therapeuticArea: true,
      },
    });

    // Calculate breakdown by type (use contributionType field)
    const breakdown = {
      situation: contributions.filter(c => c.contributionType === 'situation').length,
      pattern: contributions.filter(c => c.contributionType === 'pattern').length,
      solution: contributions.filter(c => c.contributionType === 'solution').length,
      question: contributions.filter(c => c.contributionType === 'question').length,
      insight: contributions.filter(c => c.contributionType === 'insight').length,
    };

    // Calculate top therapeutic areas
    const therapeuticAreaCounts = contributions
      .filter(c => c.therapeuticArea)
      .reduce((acc, c) => {
        const area = c.therapeuticArea!;
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topTherapeuticAreas = Object.entries(therapeuticAreaCounts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalContributions: contributions.length,
      breakdown,
      topTherapeuticAreas,
    });
  } catch (error) {
    console.error('Error fetching contribution stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}