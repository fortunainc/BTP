/**
 * Matching Engine - BTP Opportunity Matching System
 * 
 * Implements the brokered allocation architecture:
 * - Matches JobPostings to CapabilityIdentities
 * - Uses weighted scoring algorithm
 * - Creates OpportunityMatch records
 * 
 * Scoring Weights:
 * - therapeuticArea match: 30%
 * - trialPhase match: 20%
 * - issueCategory match: 20%
 * - trustVector.reliability: 15%
 * - trustVector.quality: 15%
 */

import { prisma } from './prisma';
import { onMatchCreated, onOpportunityDomainMatch } from './return-engine/integration';

// Matching weights as specified
const WEIGHTS = {
  therapeuticArea: 0.30,
  trialPhase: 0.20,
  issueCategory: 0.20,
  reliability: 0.15,
  quality: 0.15,
};

interface MatchFactors {
  therapeuticAreaScore: number;
  trialPhaseScore: number;
  issueCategoryScore: number;
  reliabilityScore: number;
  qualityScore: number;
  totalScore: number;
}

interface MatchResult {
  capabilityIdentityId: string;
  matchScore: number;
  matchFactors: MatchFactors;
}

/**
 * Calculate therapeutic area match score
 * JobPosting.therapeuticArea is a string
 * CapabilityIdentity.therapeuticAreas is JSON: { "Oncology": 0.8, "Rare Disease": 0.6 }
 */
function calculateTherapeuticAreaScore(
  jobTherapeuticArea: string,
  capabilityAreas: Record<string, number> | null
): number {
  if (!capabilityAreas || !jobTherapeuticArea) return 0;
  
  // Direct match lookup
  const score = capabilityAreas[jobTherapeuticArea];
  if (score !== undefined) return score;
  
  // Try partial match (case-insensitive)
  const normalizedJobArea = jobTherapeuticArea.toLowerCase();
  for (const [area, value] of Object.entries(capabilityAreas)) {
    if (area.toLowerCase().includes(normalizedJobArea) || 
        normalizedJobArea.includes(area.toLowerCase())) {
      return value;
    }
  }
  
  return 0;
}

/**
 * Calculate trial phase match score
 * JobPosting.trialPhase is a string
 * CapabilityIdentity.trialPhases is JSON: { "Phase 1": 0.5, "Phase 3": 0.9 }
 */
function calculateTrialPhaseScore(
  jobTrialPhase: string,
  capabilityPhases: Record<string, number> | null
): number {
  if (!capabilityPhases || !jobTrialPhase) return 0;
  
  // Direct match lookup
  const score = capabilityPhases[jobTrialPhase];
  if (score !== undefined) return score;
  
  // Try partial match (case-insensitive)
  const normalizedJobPhase = jobTrialPhase.toLowerCase();
  for (const [phase, value] of Object.entries(capabilityPhases)) {
    if (phase.toLowerCase().includes(normalizedJobPhase) || 
        normalizedJobPhase.includes(phase.toLowerCase())) {
      return value;
    }
  }
  
  return 0;
}

/**
 * Calculate issue category match score
 * JobPosting may have requiredSkills or description containing issue categories
 * CapabilityIdentity.issueExpertise is JSON: { "Enrollment": 0.7, "Regulatory": 0.4 }
 * 
 * For now, we check if any required skills match issue expertise areas
 */
function calculateIssueCategoryScore(
  requiredSkills: string[],
  issueExpertise: Record<string, number> | null
): number {
  if (!issueExpertise || !requiredSkills || requiredSkills.length === 0) return 0.5; // Neutral score if no data
  
  let maxScore = 0;
  for (const skill of requiredSkills) {
    const normalizedSkill = skill.toLowerCase();
    for (const [category, value] of Object.entries(issueExpertise)) {
      if (category.toLowerCase().includes(normalizedSkill) || 
          normalizedSkill.includes(category.toLowerCase())) {
        maxScore = Math.max(maxScore, value);
      }
    }
  }
  
  return maxScore || 0.3; // Default low score if no matches
}

/**
 * Run matching algorithm for a specific job posting
 * Returns array of MatchResult sorted by score descending
 */
export async function runMatchingForJobPosting(jobPostingId: string): Promise<MatchResult[]> {
  // Fetch the job posting
  const jobPosting = await prisma.jobPosting.findUnique({
    where: { id: jobPostingId },
  });
  
  if (!jobPosting) {
    throw new Error(`JobPosting not found: ${jobPostingId}`);
  }
  
  // Fetch all available capability identities with their trust vectors
  const capabilityIdentities = await prisma.capabilityIdentity.findMany({
    where: {
      isAvailable: true,
    },
    include: {
      user: {
        include: {
          trustVector: true,
        },
      },
    },
  });
  
  const results: MatchResult[] = [];
  
  for (const capability of capabilityIdentities) {
    // Parse JSON fields
    const therapeuticAreas = capability.therapeuticAreas as Record<string, number> | null;
    const trialPhases = capability.trialPhases as Record<string, number> | null;
    const issueExpertise = capability.issueExpertise as Record<string, number> | null;
    
    // Calculate individual scores (0-1)
    const therapeuticAreaScore = calculateTherapeuticAreaScore(
      jobPosting.therapeuticArea,
      therapeuticAreas
    );
    
    const trialPhaseScore = calculateTrialPhaseScore(
      jobPosting.trialPhase,
      trialPhases
    );
    
    const issueCategoryScore = calculateIssueCategoryScore(
      jobPosting.requiredSkills,
      issueExpertise
    );
    
    // Get trust vector scores
    const trustVector = capability.user?.trustVector;
    const reliabilityScore = trustVector?.reliability ?? 0.3;
    const qualityScore = trustVector?.quality ?? 0.3;
    
    // Calculate weighted total score
    const totalScore =
      therapeuticAreaScore * WEIGHTS.therapeuticArea +
      trialPhaseScore * WEIGHTS.trialPhase +
      issueCategoryScore * WEIGHTS.issueCategory +
      reliabilityScore * WEIGHTS.reliability +
      qualityScore * WEIGHTS.quality;
    
    const matchFactors: MatchFactors = {
      therapeuticAreaScore,
      trialPhaseScore,
      issueCategoryScore,
      reliabilityScore,
      qualityScore,
      totalScore,
    };
    
    results.push({
      capabilityIdentityId: capability.id,
      matchScore: totalScore,
      matchFactors,
    });
  }
  
  // Sort by score descending
  results.sort((a, b) => b.matchScore - a.matchScore);
  
  return results;
}

/**
 * Create OpportunityMatch records for a job posting
 * Only creates matches above the minimum threshold
 */
export async function createMatchesForJobPosting(
  jobPostingId: string,
  minScore: number = 0.3
): Promise<number> {
  const results = await runMatchingForJobPosting(jobPostingId);
  
  // Filter by minimum score
  const qualifiedMatches = results.filter(r => r.matchScore >= minScore);
  
  // Create OpportunityMatch records
  let createdCount = 0;
  
  for (const match of qualifiedMatches) {
    try {
      const opportunityMatch = await prisma.opportunityMatch.create({
        data: {
          jobPostingId,
          capabilityIdentityId: match.capabilityIdentityId,
          matchScore: match.matchScore,
          matchFactors: JSON.parse(JSON.stringify(match.matchFactors)),
          status: 'pending',
        },
        include: {
          capabilityIdentity: {
            select: { userId: true }
          }
        }
      });
      
      // Fire Return Engine trigger for match created
      if (opportunityMatch.capabilityIdentity?.userId) {
        onMatchCreated({
          matchId: opportunityMatch.id,
          operatorId: opportunityMatch.capabilityIdentity.userId,
          organizationId: jobPostingId, // Using jobPostingId as org proxy
          matchScore: match.matchScore
        }).catch(err => console.error('Return Engine trigger error:', err));
        
        // Fire domain match trigger if therapeutic area matches
        const therapeuticArea = match.matchFactors.therapeuticAreaScore;
        if (therapeuticArea > 0.7) {
          onOpportunityDomainMatch({
            opportunityId: jobPostingId,
            userId: opportunityMatch.capabilityIdentity.userId,
            domain: 'therapeutic_area' // Could be more specific
          }).catch(err => console.error('Return Engine trigger error:', err));
        }
      }
      
      createdCount++;
    } catch (error) {
      // Skip duplicates (unique constraint violation)
      console.error(`Error creating match: ${error}`);
    }
  }
  
  return createdCount;
}

/**
 * Run matching for all open job postings
 * This can be called by a cron job or scheduled task
 */
export async function runMatchingForAllOpenJobs(): Promise<{
  processedJobs: number;
  totalMatches: number;
}> {
  const openJobs = await prisma.jobPosting.findMany({
    where: { status: 'Open' },
    select: { id: true },
  });
  
  let totalMatches = 0;
  
  for (const job of openJobs) {
    const matchesCreated = await createMatchesForJobPosting(job.id);
    totalMatches += matchesCreated;
  }
  
  return {
    processedJobs: openJobs.length,
    totalMatches,
  };
}

/**
 * Get match details for a specific opportunity match
 */
export async function getMatchDetails(matchId: string) {
  return prisma.opportunityMatch.findUnique({
    where: { id: matchId },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          therapeuticArea: true,
          trialPhase: true,
          requiredRole: true,
          requiredSkills: true,
          experienceLevel: true,
          duration: true,
          location: true,
          remoteCapable: true,
          compensationBand: true,
          organizationType: true,
          priorityLevel: true,
        },
      },
      capabilityIdentity: {
        select: {
          id: true,
          profileId: true,
          generatedSummary: true,
          therapeuticAreas: true,
          trialPhases: true,
          issueExpertise: true,
          reliabilityScore: true,
          responsivenessScore: true,
        },
      },
    },
  });
}

export type { MatchFactors, MatchResult };