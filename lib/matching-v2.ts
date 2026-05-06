/**
 * BTP Matching Engine v2.0
 * 
 * EXECUTION CONTEXT INTELLIGENCE MATCHING
 * 
 * This replaces simple profile matching with deep execution context analysis.
 * 
 * Match Weights:
 * - executionContextMatch: 30%
 * - breakdownPatternMatch: 25%
 * - therapeutic/phase match: 20%
 * - trust reliability: 15%
 * - outcome reinforcement: 10%
 */

import { prisma } from './prisma';
import {
  ExecutionContext,
  ContributionExecutionContext,
  JobExecutionContext,
  extractExecutionContextFromContribution,
  extractExecutionContextFromJobPosting,
  calculateExecutionContextSimilarity,
  generatePatternSignature
} from './execution-context';

// ==========================================
// MATCH WEIGHTS (NEW)
// ==========================================

const MATCH_WEIGHTS = {
  executionContextMatch: 0.30,    // Environment + pressure + intervention alignment
  breakdownPatternMatch: 0.25,    // Problem type similarity
  therapeuticPhaseMatch: 0.20,    // Traditional area/phase match
  trustReliability: 0.15,         // Proven track record
  outcomeReinforcement: 0.10      // Outcome-validated performance
};

// ==========================================
// INTERFACES
// ==========================================

export interface EnhancedMatchResult {
  capabilityIdentityId: string;
  profileId: string;
  matchScore: number;
  
  // MANDATORY FIELDS
  executionContextReasoning: string;
  patternFitExplanation: string;
  outcomeBackedJustification: string | null;
  
  // SCORE BREAKDOWN
  scoreBreakdown: {
    executionContext: { score: number; weight: number; contribution: number; details: string };
    breakdownPattern: { score: number; weight: number; contribution: number; details: string };
    therapeuticPhase: { score: number; weight: number; contribution: number; details: string };
    trustReliability: { score: number; weight: number; contribution: number; details: string };
    outcomeReinforcement: { score: number; weight: number; contribution: number; details: string };
  };
  
  // MATCHING DETAILS
  matchedBreakpoints: string[];
  matchedInterventions: string[];
  matchedPressures: string[];
  
  // CONFIDENCE
  confidence: number;
  recommendation: 'STRONGLY_RECOMMEND' | 'RECOMMEND' | 'CONDITIONAL' | 'NOT_RECOMMENDED';
}

export interface MatchInput {
  jobPostingId: string;
  jobExecutionContext: JobExecutionContext;
}

// ==========================================
// MAIN MATCHING FUNCTION
// ==========================================

export async function runEnhancedMatching(
  jobPostingId: string
): Promise<EnhancedMatchResult[]> {
  
  // 1. Get job posting with full context
  const jobPosting = await prisma.jobPosting.findUnique({
    where: { id: jobPostingId },
    include: {
      creator: {
        select: { id: true, handle: true }
      }
    }
  });
  
  if (!jobPosting) {
    throw new Error(`Job posting not found: ${jobPostingId}`);
  }
  
  // 2. Extract execution context for job posting
  const jobExecutionContext = extractExecutionContextFromJobPosting({
    id: jobPosting.id,
    title: jobPosting.title,
    description: jobPosting.description || '',
    therapeuticArea: jobPosting.therapeuticArea,
    trialPhase: jobPosting.trialPhase
  });
  
  // 3. Get all active capability identities with their contributions
  const capabilityIdentities = await prisma.capabilityIdentity.findMany({
    where: {
      isAvailable: true
    },
    include: {
      user: {
        include: {
          contributions: {
            where: {
              isFlagged: false,
              isHidden: false
            },
            include: {
              outcomes: true
            }
          },
          trustVector: true,
          hireOutcomes: true
        }
      }
    }
  });
  
  // 4. Calculate matches for each capability identity
  const matchResults: EnhancedMatchResult[] = [];
  
  for (const capIdentity of capabilityIdentities) {
    const match = await calculateEnhancedMatch(
      jobPosting,
      jobExecutionContext,
      capIdentity
    );
    
    if (match) {
      matchResults.push(match);
    }
  }
  
  // 5. Sort by match score (highest first)
  matchResults.sort((a, b) => b.matchScore - a.matchScore);
  
  // 6. Store matches in database
  await storeMatches(jobPostingId, matchResults);
  
  return matchResults;
}

// ==========================================
// ENHANCED MATCH CALCULATION
// ==========================================

async function calculateEnhancedMatch(
  jobPosting: any,
  jobContext: JobExecutionContext,
  capIdentity: any
): Promise<EnhancedMatchResult | null> {
  
  const user = capIdentity.user;
  const contributions = user.contributions || [];
  
  // Extract execution contexts from all contributions
  const contributionContexts: ContributionExecutionContext[] = contributions.map((c: any) => 
    extractExecutionContextFromContribution({
      id: c.id,
      contributionType: c.contributionType,
      content: c.content,
      metadata: {
        therapeuticArea: c.therapeuticArea,
        trialPhase: c.trialPhase,
        issueCategory: c.issueCategory
      }
    })
  );
  
  // 1. EXECUTION CONTEXT MATCH (30%)
  const executionContextResult = calculateExecutionContextMatch(
    jobContext,
    contributionContexts
  );
  
  // 2. BREAKDOWN PATTERN MATCH (25%)
  const breakdownPatternResult = calculateBreakdownPatternMatch(
    jobContext,
    contributionContexts
  );
  
  // 3. THERAPEUTIC/PHASE MATCH (20%)
  const therapeuticPhaseResult = calculateTherapeuticPhaseMatch(
    jobPosting,
    capIdentity
  );
  
  // 4. TRUST RELIABILITY (15%)
  const trustReliabilityResult = calculateTrustReliability(user.trustVector);
  
  // 5. OUTCOME REINFORCEMENT (10%)
  const outcomeReinforcementResult = calculateOutcomeReinforcement(
    contributions,
    user.hireOutcomes || []
  );
  
  // Calculate total score
  const totalScore = 
    executionContextResult.contribution +
    breakdownPatternResult.contribution +
    therapeuticPhaseResult.contribution +
    trustReliabilityResult.contribution +
    outcomeReinforcementResult.contribution;
  
  // Generate mandatory reasoning
  const executionContextReasoning = generateExecutionContextReasoning(
    jobContext,
    executionContextResult
  );
  
  const patternFitExplanation = generatePatternFitExplanation(
    jobContext,
    breakdownPatternResult,
    contributionContexts
  );
  
  const outcomeBackedJustification = generateOutcomeJustification(
    contributions,
    user.hireOutcomes || [],
    outcomeReinforcementResult
  );
  
  // Determine recommendation
  const recommendation = determineRecommendation(totalScore);
  
  // Calculate confidence
  const confidence = calculateMatchConfidence(
    executionContextResult.score,
    breakdownPatternResult.score,
    contributions.length
  );
  
  return {
    capabilityIdentityId: capIdentity.id,
    profileId: capIdentity.profileId,
    matchScore: totalScore,
    executionContextReasoning,
    patternFitExplanation,
    outcomeBackedJustification,
    scoreBreakdown: {
      executionContext: executionContextResult,
      breakdownPattern: breakdownPatternResult,
      therapeuticPhase: therapeuticPhaseResult,
      trustReliability: trustReliabilityResult,
      outcomeReinforcement: outcomeReinforcementResult
    },
    matchedBreakpoints: breakdownPatternResult.matchedBreakpoints,
    matchedInterventions: executionContextResult.matchedInterventions,
    matchedPressures: executionContextResult.matchedPressures,
    confidence,
    recommendation
  };
}

// ==========================================
// SCORE CALCULATION FUNCTIONS
// ==========================================

function calculateExecutionContextMatch(
  jobContext: JobExecutionContext,
  contributionContexts: ContributionExecutionContext[]
): { score: number; weight: number; contribution: number; details: string; matchedInterventions: string[]; matchedPressures: string[] } {
  
  if (contributionContexts.length === 0) {
    return {
      score: 0,
      weight: MATCH_WEIGHTS.executionContextMatch,
      contribution: 0,
      details: 'No contribution history available',
      matchedInterventions: [],
      matchedPressures: []
    };
  }
  
  // Find best matching contribution context
  let bestScore = 0;
  let bestMatch: { interventions: string[]; pressures: string[] } = { interventions: [], pressures: [] };
  
  for (const contribContext of contributionContexts) {
    const similarity = calculateExecutionContextSimilarity(jobContext, contribContext);
    
    if (similarity.score > bestScore) {
      bestScore = similarity.score;
      
      // Find matched interventions
      const matchedInterventions = contribContext.interventionTypes.filter(
        i => jobContext.interventionTypes.includes(i)
      );
      
      // Find matched pressures
      const matchedPressures = contribContext.operationalPressureTypes.filter(
        p => jobContext.operationalPressureTypes.includes(p)
      );
      
      bestMatch = { interventions: matchedInterventions, pressures: matchedPressures };
    }
  }
  
  const contribution = bestScore * MATCH_WEIGHTS.executionContextMatch;
  
  const details = bestScore >= 0.7
    ? `Strong execution context alignment: environment=${jobContext.trialEnvironmentType}, ${bestMatch.interventions.length} interventions matched, ${bestMatch.pressures.length} pressure types aligned`
    : bestScore >= 0.4
      ? `Partial execution context match: some alignment in environment and interventions`
      : `Limited execution context overlap`;
  
  return {
    score: bestScore,
    weight: MATCH_WEIGHTS.executionContextMatch,
    contribution,
    details,
    matchedInterventions: bestMatch.interventions,
    matchedPressures: bestMatch.pressures
  };
}

function calculateBreakdownPatternMatch(
  jobContext: JobExecutionContext,
  contributionContexts: ContributionExecutionContext[]
): { score: number; weight: number; contribution: number; details: string; matchedBreakpoints: string[] } {
  
  if (contributionContexts.length === 0) {
    return {
      score: 0,
      weight: MATCH_WEIGHTS.breakdownPatternMatch,
      contribution: 0,
      details: 'No breakdown patterns available',
      matchedBreakpoints: []
    };
  }
  
  // Find matching breakpoints from contributions
  const allBreakpoints = new Set<string>();
  const matchedBreakpoints: string[] = [];
  
  for (const ctx of contributionContexts) {
    ctx.primaryBreakpoints.forEach(b => allBreakpoints.add(b));
  }
  
  // Check which job breakpoints are covered by contributor
  for (const bp of jobContext.primaryBreakpoints) {
    if (allBreakpoints.has(bp)) {
      matchedBreakpoints.push(bp);
    }
  }
  
  // Calculate score based on coverage
  const coverageScore = jobContext.primaryBreakpoints.length > 0
    ? matchedBreakpoints.length / jobContext.primaryBreakpoints.length
    : 0.5; // Default if no breakpoints specified
  
  const score = Math.min(coverageScore * 1.2, 1.0); // Boost slightly for partial matches
  const contribution = score * MATCH_WEIGHTS.breakdownPatternMatch;
  
  const details = matchedBreakpoints.length > 0
    ? `Matched ${matchedBreakpoints.length}/${jobContext.primaryBreakpoints.length} breakdown patterns: ${matchedBreakpoints.join(', ')}`
    : 'No matching breakdown patterns found';
  
  return {
    score,
    weight: MATCH_WEIGHTS.breakdownPatternMatch,
    contribution,
    details,
    matchedBreakpoints
  };
}

function calculateTherapeuticPhaseMatch(
  jobPosting: any,
  capIdentity: any
): { score: number; weight: number; contribution: number; details: string } {
  
  let score = 0;
  const details: string[] = [];
  
  // Therapeutic area match
  const jobArea = jobPosting.therapeuticArea?.toLowerCase() || '';
  const capAreas = capIdentity.therapeuticAreas as Record<string, number> || {};
  
  let areaScore = 0;
  for (const [area, value] of Object.entries(capAreas)) {
    if (area.toLowerCase().includes(jobArea) || jobArea.includes(area.toLowerCase())) {
      areaScore = Math.max(areaScore, value);
    }
  }
  
  // Phase match
  const jobPhase = jobPosting.trialPhase?.toLowerCase() || '';
  const capPhases = capIdentity.trialPhases as Record<string, number> || {};
  
  let phaseScore = 0;
  for (const [phase, value] of Object.entries(capPhases)) {
    if (phase.toLowerCase().includes(jobPhase) || jobPhase.includes(phase.toLowerCase())) {
      phaseScore = Math.max(phaseScore, value);
    }
  }
  
  // Combined score (60% area, 40% phase)
  score = (areaScore * 0.6) + (phaseScore * 0.4);
  const contribution = score * MATCH_WEIGHTS.therapeuticPhaseMatch;
  
  const detailStr = `Therapeutic area: ${Math.round(areaScore * 100)}%, Phase: ${Math.round(phaseScore * 100)}%`;
  
  return {
    score,
    weight: MATCH_WEIGHTS.therapeuticPhaseMatch,
    contribution,
    details: detailStr
  };
}

function calculateTrustReliability(
  trustVector: any
): { score: number; weight: number; contribution: number; details: string } {
  
  if (!trustVector) {
    return {
      score: 0.5,
      weight: MATCH_WEIGHTS.trustReliability,
      contribution: 0.5 * MATCH_WEIGHTS.trustReliability,
      details: 'No trust vector available, using default'
    };
  }
  
  const reliability = trustVector.reliability || 0.5;
  const contribution = reliability * MATCH_WEIGHTS.trustReliability;
  
  const details = reliability >= 0.8
    ? 'High reliability: consistent delivery history'
    : reliability >= 0.6
      ? 'Good reliability: demonstrated consistency'
      : reliability >= 0.4
        ? 'Moderate reliability: some track record'
        : 'Limited reliability data';
  
  return {
    score: reliability,
    weight: MATCH_WEIGHTS.trustReliability,
    contribution,
    details
  };
}

function calculateOutcomeReinforcement(
  contributions: any[],
  hireOutcomes: any[]
): { score: number; weight: number; contribution: number; details: string; hasRealData: boolean } {
  
  // Check for outcome-validated data
  const validatedContributions = contributions.filter(c => 
    c.outcomes && c.outcomes.some((o: any) => o.validationType === 'SOLUTION_WORKED')
  );
  
  const successfulHires = hireOutcomes.filter(h => h.status === 'completed').length;
  
  let score = 0;
  let hasRealData = false;
  
  if (validatedContributions.length > 0 || successfulHires > 0) {
    hasRealData = true;
    
    // Score based on validation count and hire success
    const validationScore = Math.min(validatedContributions.length / 5, 1);
    const hireScore = Math.min(successfulHires / 10, 1);
    
    score = (validationScore * 0.5) + (hireScore * 0.5);
  } else {
    // Default score when no outcome data
    score = 0.3;
  }
  
  const contribution = score * MATCH_WEIGHTS.outcomeReinforcement;
  
  const details = hasRealData
    ? `Outcome-validated: ${validatedContributions.length} solution validations, ${successfulHires} successful hires`
    : 'Limited outcome data available';
  
  return {
    score,
    weight: MATCH_WEIGHTS.outcomeReinforcement,
    contribution,
    details,
    hasRealData
  };
}

// ==========================================
// REASONING GENERATION
// ==========================================

function generateExecutionContextReasoning(
  jobContext: JobExecutionContext,
  executionResult: any
): string {
  const environment = jobContext.trialEnvironmentType;
  const pressures = jobContext.operationalPressureTypes.slice(0, 3).join(', ');
  const matchedInterventions = executionResult.matchedInterventions.slice(0, 3).join(', ');
  
  return `This candidate has demonstrated capability in ${environment} trial environments facing pressures including ${pressures || 'similar operational challenges'}. Their intervention experience includes ${matchedInterventions || 'relevant problem-solving approaches'}, providing ${Math.round(executionResult.score * 100)}% execution context alignment with the role requirements.`;
}

function generatePatternFitExplanation(
  jobContext: JobExecutionContext,
  breakdownResult: any,
  contributionContexts: ContributionExecutionContext[]
): string {
  const jobBreakpoints = jobContext.primaryBreakpoints;
  const matchedBreakpoints = breakdownResult.matchedBreakpoints;
  
  if (matchedBreakpoints.length === 0) {
    return `The job anticipates challenges in ${jobBreakpoints.join(', ') || 'general clinical operations'}. While this candidate has not directly addressed these specific breakdown patterns, their problem-solving approach may still be applicable.`;
  }
  
  // Find contributions that addressed these breakpoints
  const relevantContributions = contributionContexts.filter(ctx =>
    ctx.primaryBreakpoints.some(bp => matchedBreakpoints.includes(bp))
  );
  
  const outcomes = relevantContributions
    .map(ctx => ctx.outcomeType)
    .filter(o => o === 'resolved' || o === 'prevented');
  
  return `The job requires handling ${jobBreakpoints.join(', ')}. This candidate has directly addressed ${matchedBreakpoints.length} of these breakdown types with ${outcomes.length > 0 ? 'successful outcomes (resolved/prevented)' : 'documented interventions'}. Pattern match confidence: ${Math.round(breakdownResult.score * 100)}%.`;
}

function generateOutcomeJustification(
  contributions: any[],
  hireOutcomes: any[],
  outcomeResult: any
): string | null {
  if (!outcomeResult.hasRealData) {
    return null; // Return null when no real outcome data exists
  }
  
  const validatedCount = contributions.filter(c => 
    c.outcomes && c.outcomes.some((o: any) => o.validationType === 'SOLUTION_WORKED')
  ).length;
  
  const successfulHires = hireOutcomes.filter(h => h.status === 'completed').length;
  
  return `Match supported by ${validatedCount} solution validations from peers and ${successfulHires} completed hires with positive outcomes. This outcome-backed evidence increases confidence in the match quality.`;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function determineRecommendation(score: number): 'STRONGLY_RECOMMEND' | 'RECOMMEND' | 'CONDITIONAL' | 'NOT_RECOMMENDED' {
  if (score >= 0.75) return 'STRONGLY_RECOMMEND';
  if (score >= 0.55) return 'RECOMMEND';
  if (score >= 0.35) return 'CONDITIONAL';
  return 'NOT_RECOMMENDED';
}

function calculateMatchConfidence(
  executionScore: number,
  breakdownScore: number,
  contributionCount: number
): number {
  // Base confidence
  let confidence = 0.5;
  
  // Higher scores = higher confidence
  confidence += executionScore * 0.2;
  confidence += breakdownScore * 0.15;
  
  // More contributions = more data = higher confidence
  if (contributionCount >= 10) confidence += 0.15;
  else if (contributionCount >= 5) confidence += 0.1;
  else if (contributionCount >= 3) confidence += 0.05;
  
  return Math.min(confidence, 1.0);
}

// ==========================================
// DATABASE STORAGE
// ==========================================

async function storeMatches(
  jobPostingId: string,
  matches: EnhancedMatchResult[]
): Promise<void> {
  
  for (const match of matches) {
    await prisma.opportunityMatch.upsert({
      where: {
        jobPostingId_capabilityIdentityId: {
          jobPostingId,
          capabilityIdentityId: match.capabilityIdentityId
        }
      },
      create: {
        jobPostingId,
        capabilityIdentityId: match.capabilityIdentityId,
        matchScore: match.matchScore,
        matchFactors: {
          executionContextReasoning: match.executionContextReasoning,
          patternFitExplanation: match.patternFitExplanation,
          outcomeBackedJustification: match.outcomeBackedJustification,
          scoreBreakdown: match.scoreBreakdown,
          matchedBreakpoints: match.matchedBreakpoints,
          matchedInterventions: match.matchedInterventions,
          matchedPressures: match.matchedPressures,
          confidence: match.confidence,
          recommendation: match.recommendation
        },
        status: 'Pending'
      },
      update: {
        matchScore: match.matchScore,
        matchFactors: {
          executionContextReasoning: match.executionContextReasoning,
          patternFitExplanation: match.patternFitExplanation,
          outcomeBackedJustification: match.outcomeBackedJustification,
          scoreBreakdown: match.scoreBreakdown,
          matchedBreakpoints: match.matchedBreakpoints,
          matchedInterventions: match.matchedInterventions,
          matchedPressures: match.matchedPressures,
          confidence: match.confidence,
          recommendation: match.recommendation
        }
      }
    });
  }
}

// ==========================================
// EXPORTS
// ==========================================

export {
  MATCH_WEIGHTS,
  calculateExecutionContextMatch,
  calculateBreakdownPatternMatch,
  calculateTherapeuticPhaseMatch,
  calculateTrustReliability,
  calculateOutcomeReinforcement
};