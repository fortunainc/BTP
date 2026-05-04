/**
 * Patterns API
 * 
 * Returns clustered patterns from situations
 * No counts displayed - uses wording like "across multiple"
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ==========================================
// TYPES
// ==========================================

interface PatternResponse {
  patternId: string;
  patternTitle: string;
  description: string;
  therapeuticAreas: string[];
  trialPhases: string[];
  patternStatus: 'emerging' | 'repeating' | 'critical';
  resolutionStatus: 'unresolved' | 'partial' | 'resolved';
  situationCount: number;
}

// ==========================================
// PATTERN TITLES
// ==========================================

const PATTERN_TITLES: Record<string, string> = {
  'enrollment': 'Enrollment Challenges Keep Appearing',
  'protocol-burden': 'Protocol Burden is Slowing Things Down',
  'site-overload': 'Sites Are Getting Overwhelmed',
  'patient-burden': 'Patient Burden is Driving Withdrawals',
  'cro-disconnect': 'CRO-Sponsor Communication Gaps',
  'reimbursement': 'Reimbursement Issues Blocking Progress',
  'data-quality': 'Data Quality Problems at Multiple Sites',
  'timeline-pressure': 'Timeline Pressure Creating Shortcuts',
  'training-gaps': 'Training Gaps Causing Protocol Deviations',
  'resource-constraints': 'Resource Constraints Impacting Quality',
  'operational': 'Operational Challenges Are Recurring',
  'staffing': 'Staffing Issues Impacting Quality'
};

// ==========================================
// GET /api/patterns
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // Fetch all approved situations (use isFlagged instead of moderationStatus)
    // SQS FILTER: Only cluster MEDIUM+ quality situations into patterns
    // LOW SQS contributions are internal-only — they don't form user-facing patterns
    // FOUNDER OVERRIDE: forceIncludeFromPatterns bypasses SQS gate; forceExcludeFromPatterns always wins
    const situations = await prisma.contribution.findMany({
      where: {
        contributionType: 'situation',
        isFlagged: false,
        isHidden: false,
        forceExcludeFromPatterns: false,
        OR: [
          { signalQualityScore: { in: ['HIGH', 'MEDIUM'] } },
          { forceIncludeFromPatterns: true },
        ],
      },
      select: {
        id: true,
        issueCategory: true,
        therapeuticArea: true,
        trialPhase: true,
        createdAt: true,
        interactions: {
          select: { id: true }
        }
      }
    });

    // Group by issue category
    const categoryGroups = new Map<string, typeof situations>();
    
    for (const situation of situations) {
      const category = normalizeCategory(situation.issueCategory);
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(situation);
    }

    // Build patterns
    const patterns: PatternResponse[] = [];

    for (const [category, groupSituations] of categoryGroups) {
      // Need at least 2 situations to form a pattern
      if (groupSituations.length < 2) continue;

      const therapeuticAreas = [...new Set(
        groupSituations.map(s => s.therapeuticArea).filter(Boolean)
      )] as string[];

      const trialPhases = [...new Set(
        groupSituations.map(s => s.trialPhase).filter(Boolean)
      )] as string[];

      const totalInteractions = groupSituations.reduce(
        (sum, s) => sum + s.interactions.length, 
        0
      );

      const patternStatus = determinePatternStatus(
        groupSituations.length, 
        totalInteractions
      );

      const resolutionStatus = determineResolutionStatus(groupSituations);

      patterns.push({
        patternId: `pattern-${category}`,
        patternTitle: PATTERN_TITLES[category] || `${formatCategory(category)} Issues Are Appearing`,
        description: generateDescription(therapeuticAreas, trialPhases),
        therapeuticAreas,
        trialPhases,
        patternStatus,
        resolutionStatus,
        situationCount: groupSituations.length
      });
    }

    // Sort by situation count
    patterns.sort((a, b) => b.situationCount - a.situationCount);

    return NextResponse.json({ patterns: patterns.slice(0, 6) });

  } catch (error) {
    console.error('Error fetching patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    );
  }
}

// ==========================================
// HELPERS
// ==========================================

function normalizeCategory(category: string | null): string {
  if (!category) return 'operational';
  
  const normalized = category.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  return normalized || 'operational';
}

function formatCategory(category: string): string {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function determinePatternStatus(
  count: number, 
  interactions: number
): 'emerging' | 'repeating' | 'critical' {
  if (count >= 5) return 'critical';
  if (count >= 3 || interactions >= 5) return 'repeating';
  return 'emerging';
}

function determineResolutionStatus(
  situations: { interactions: { id: string }[] }[]
): 'unresolved' | 'partial' | 'resolved' {
  // Check if situations have interactions
  const withInteractions = situations.filter(s => s.interactions.length > 0).length;
  
  if (withInteractions >= situations.length * 0.5) return 'partial';
  return 'unresolved';
}

function generateDescription(
  therapeuticAreas: string[], 
  trialPhases: string[]
): string {
  let description = 'This issue is appearing across multiple trials';
  
  if (therapeuticAreas.length > 1) {
    description += ' and therapeutic areas';
  }
  
  if (trialPhases.length > 1) {
    description += `. It's showing up in different trial phases`;
  }

  description += `. No consistent solution has emerged yet.`;

  return description;
}
