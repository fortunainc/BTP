/**
 * PATTERN VISIBILITY ENGINE
 * 
 * Clusters Contributions into Patterns based on:
 * - issueCategory
 * - therapeuticArea overlap
 * - trialPhase overlap
 * - semantic similarity
 */

import { prisma } from './prisma';

// ==========================================
// TYPES
// ==========================================

export type PatternMaturity = 'EMERGING' | 'REPEATING' | 'ESTABLISHED';
export type PatternStatus = PatternMaturity;
export type ResolutionStatus = 'unresolved' | 'partial' | 'resolved';

export interface Pattern {
  patternId: string;
  patternTitle: string;
  description: string;
  contributingSituations: string[];
  therapeuticAreas: string[];
  trialPhases: string[];
  issueCategories: string[];
  patternStatus: PatternMaturity;
  resolutionStatus: ResolutionStatus;
  situationCount: number;
  interactionCount: number;
  lastUpdated: Date;
}

export interface Situation {
  id: string;
  title: string;
  description: string;
  issueCategory: string;
  trialPhase: string;
  therapeuticArea: string;
  roleContext: string;
  status: string;
  createdAt: Date;
  interactions: Interaction[];
}

export interface Interaction {
  id: string;
  interactionType: string;
  situationId: string;
  createdAt: Date;
}

// ==========================================
// CONFIGURATION
// ==========================================

const PATTERN_CONFIG = {
  minSituationsForPattern: 2,
  criticalThreshold: 5,
  similarityThreshold: 0.4,
  weights: {
    issueCategory: 0.35,
    therapeuticArea: 0.25,
    trialPhase: 0.20,
    semantic: 0.20
  }
};

// ==========================================
// PATTERN TEMPLATES
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
  'resource-constraints': 'Resource Constraints Impacting Quality'
};

// ==========================================
// MAIN FUNCTIONS
// ==========================================

/**
 * Get all patterns from current situations
 */
export async function getPatterns(): Promise<Pattern[]> {
  const situations = await fetchSituations();
  return clusterIntoPatterns(situations);
}

/**
 * Get active situations for display
 */
export async function getActiveSituations(limit: number = 12): Promise<Situation[]> {
  const contributions = await prisma.contribution.findMany({
    where: {
      contributionType: 'situation',
      isFlagged: false,
      isHidden: false,
      // FOUNDER OVERRIDE: forceExcludeFromPatterns always wins
      forceExcludeFromPatterns: false,
      // SQS FILTER: Only show MEDIUM+ quality, unless admin force-included
      OR: [
        { signalQualityScore: { in: ['HIGH', 'MEDIUM'] } },
        { forceIncludeFromPatterns: true },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      _count: { select: { interactions: true } }
    }
  });

  return contributions.map(c => ({
    id: c.id,
    title: c.title || 'Untitled Situation',
    description: c.description?.substring(0, 200) || '',
    issueCategory: c.issueCategory || 'general',
    trialPhase: c.trialPhase || 'unknown',
    therapeuticArea: c.therapeuticArea || 'unknown',
    roleContext: 'Site Staff', // Default
    status: getStatus(c.createdAt, c._count?.interactions || 0),
    createdAt: c.createdAt,
    interactions: []
  }));
}

/**
 * Get unresolved high-tension items
 */
export async function getUnresolvedPressure(): Promise<Pattern[]> {
  const patterns = await getPatterns();
  return patterns.filter(p => 
    p.resolutionStatus === 'unresolved' && 
    p.patternStatus !== 'EMERGING'
  ).slice(0, 6);
}

// ==========================================
// CLUSTERING LOGIC
// ==========================================

/**
 * Fetch situations from database
 */
async function fetchSituations(): Promise<Situation[]> {
  try {
    const contributions = await prisma.contribution.findMany({
      where: {
        contributionType: 'situation',
        isFlagged: false,
        isHidden: false,
        // FOUNDER OVERRIDE: forceExcludeFromPatterns always wins
        forceExcludeFromPatterns: false,
        // SQS FILTER: Exclude LOW signal quality from pattern detection
        // UNLESS forceIncludeFromPatterns is true (admin override)
        OR: [
          { signalQualityScore: { in: ['HIGH', 'MEDIUM'] } },
          { forceIncludeFromPatterns: true },
        ],
      },
      include: {
        interactions: {
          select: { id: true, createdAt: true, interactionType: true }
        }
      }
    });

    return contributions.map(c => ({
      id: c.id,
      title: c.title || 'Untitled',
      description: c.description || '',
      issueCategory: c.issueCategory || 'general',
      trialPhase: c.trialPhase || 'unknown',
      therapeuticArea: c.therapeuticArea || 'unknown',
      roleContext: 'Site Staff',
      status: 'active',
      createdAt: c.createdAt,
      interactions: c.interactions.map(r => ({
        id: r.id,
        interactionType: r.interactionType,
        situationId: c.id,
        createdAt: r.createdAt
      }))
    }));
  } catch (error) {
    console.error('Error fetching situations:', error);
    return [];
  }
}

/**
 * Cluster situations into patterns
 */
function clusterIntoPatterns(situations: Situation[]): Pattern[] {
  if (situations.length === 0) return [];

  // Group by issue category
  const categoryGroups = new Map<string, Situation[]>();
  
  for (const situation of situations) {
    const category = situation.issueCategory || 'general';
    if (!categoryGroups.has(category)) {
      categoryGroups.set(category, []);
    }
    categoryGroups.get(category)!.push(situation);
  }

  // Build patterns from groups
  const patterns: Pattern[] = [];

  for (const [category, groupSituations] of categoryGroups) {
    if (groupSituations.length < PATTERN_CONFIG.minSituationsForPattern) continue;

    const totalInteractions = groupSituations.reduce(
      (sum, s) => sum + s.interactions.length, 
      0
    );

    const therapeuticAreas = [...new Set(
      groupSituations.map(s => s.therapeuticArea).filter(Boolean)
    )];

    const trialPhases = [...new Set(
      groupSituations.map(s => s.trialPhase).filter(Boolean)
    )];

    const pattern: Pattern = {
      patternId: `pattern-${category.toLowerCase().replace(/\s+/g, '-')}`,
      patternTitle: PATTERN_TITLES[category.toLowerCase()] || `${category} Issues Are Appearing`,
      description: generateDescription(therapeuticAreas, trialPhases, groupSituations.length),
      contributingSituations: groupSituations.map(s => s.id),
      therapeuticAreas,
      trialPhases,
      issueCategories: [category],
      patternStatus: determinePatternStatus(groupSituations.length, totalInteractions),
      resolutionStatus: determineResolutionStatus(groupSituations),
      situationCount: groupSituations.length,
      interactionCount: totalInteractions,
      lastUpdated: new Date()
    };

    patterns.push(pattern);
  }

  // Sort by situation count descending
  return patterns.sort((a, b) => b.situationCount - a.situationCount);
}

/**
 * Determine pattern maturity based on contribution count and engagement
 * 
 * MATURITY LEVELS (from spec):
 * - EMERGING: Early signal, don't surface as strong
 * - REPEATING: Multiple reports, growing confidence
 * - ESTABLISHED: Strong pattern, can be shown confidently
 * 
 * CRITICAL RULE: Do not surface weak patterns as strong signals
 */
function determinePatternStatus(count: number, interactions: number): PatternMaturity {
  if (count >= 7 && interactions >= 10) return 'ESTABLISHED';
  if (count >= PATTERN_CONFIG.criticalThreshold) return 'ESTABLISHED';
  if (count >= 3 || interactions >= 5) return 'REPEATING';
  return 'EMERGING';
}

/**
 * Determine resolution status
 */
function determineResolutionStatus(situations: Situation[]): ResolutionStatus {
  const withInteractions = situations.filter(s => s.interactions.length > 0).length;
  const ratio = withInteractions / situations.length;
  
  if (ratio >= 0.7) return 'partial';
  return 'unresolved';
}

/**
 * Generate pattern description
 */
function generateDescription(areas: string[], phases: string[], count: number): string {
  let desc = 'This issue is appearing across multiple trials';
  
  if (areas.length > 1) {
    desc += ' and therapeutic areas';
  }
  
  if (phases.length > 1) {
    desc += `. It's showing up in different trial phases`;
  }

  desc += `. No consistent solution has emerged yet.`;

  return desc;
}

/**
 * Get status for display
 */
function getStatus(createdAt: Date, interactionCount: number): string {
  const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceCreation < 1) return 'new';
  if (interactionCount > 0) return 'active';
  return 'pending';
}

export default {
  getPatterns,
  getActiveSituations,
  getUnresolvedPressure
};