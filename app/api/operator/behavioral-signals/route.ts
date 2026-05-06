/**
 * Behavioral Signals API
 * 
 * Returns reward and feedback signals for user engagement
 * 
 * NO numbers, NO scores, NO points - only language-based signals
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface BehavioralSignal {
  type: 'validation' | 'impact' | 'opportunity';
  message: string;
  timestamp: Date;
}

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const signals: BehavioralSignal[] = [];

    // LOOP A - VALIDATION (Feel Seen)
    // Check if user's recent contributions have SEEN_TOO or ACCURATE interactions
    const recentContributions = await prisma.contribution.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: { id: true },
      take: 5,
    });

    for (const contribution of recentContributions) {
      const interactions = await prisma.interaction.findMany({
        where: {
          contributionId: contribution.id,
          interactionType: { in: ['SEEN_TOO', 'ACCURATE'] },
        },
        select: { interactionType: true, createdAt: true },
        take: 10,
      });

      const seenTooCount = interactions.filter(i => i.interactionType === 'SEEN_TOO').length;
      const accurateCount = interactions.filter(i => i.interactionType === 'ACCURATE').length;

      if (seenTooCount >= 2) {
        signals.push({
          type: 'validation',
          message: 'Others are seeing this too',
          timestamp: interactions[0].createdAt,
        });
      }

      if (accurateCount >= 2) {
        signals.push({
          type: 'validation',
          message: 'This is happening across multiple sites',
          timestamp: interactions[0].createdAt,
        });
      }
    }

    // LOOP B - IMPACT (Feel Useful)
    // Check if user's contributions have triggered pattern formation
    const contributionsWithInteractions = await prisma.contribution.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        _count: {
          select: { interactions: true },
        },
      },
      take: 10,
    });

    for (const contribution of contributionsWithInteractions) {
      if (contribution._count.interactions >= 3) {
        signals.push({
          type: 'impact',
          message: 'Your input helped clarify a recurring issue',
          timestamp: contribution.createdAt,
        });
      }

      if (contribution._count.interactions >= 5) {
        signals.push({
          type: 'impact',
          message: 'Operators are using this to understand what\'s happening',
          timestamp: contribution.createdAt,
        });
      }
    }

    // LOOP C - OPPORTUNITY (Feel Rewarded)
    // Check for new opportunity matches (without exposing scores)
    const recentMatches = await prisma.opportunityMatch.findMany({
      where: {
        userId: user.id,
        status: 'available',
        createdAt: {
          gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Last 3 days
        },
      },
      include: {
        jobPosting: {
          select: { title: true },
        },
      },
      take: 3,
    });

    if (recentMatches.length > 0) {
      signals.push({
        type: 'opportunity',
        message: 'New opportunity aligned with your experience',
        timestamp: recentMatches[0].createdAt,
      });
    }

    // Check for TrustVector movement (without exposing numbers)
    const trustVector = await prisma.trustVector.findUnique({
      where: { userId: user.id },
    });

    if (trustVector && trustVector.outcomeReinforcement > 0.5) {
      signals.push({
        type: 'opportunity',
        message: 'Your recent activity increased your access to relevant work',
        timestamp: trustVector.updatedAt,
      });
    }

    // Deduplicate signals by message and sort by timestamp
    const uniqueSignals = signals
      .filter((signal, index, self) =>
        index === self.findIndex(s => s.message === signal.message)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5); // Max 5 signals

    return NextResponse.json({ signals: uniqueSignals });
  } catch (error) {
    console.error('Error fetching behavioral signals:', error);
    return NextResponse.json(
      { error: 'Failed to load signals' },
      { status: 500 }
    );
  }
}