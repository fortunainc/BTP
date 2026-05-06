/**
 * Capability Identity Service
 * 
 * Generates and maintains anonymized capability profiles
 * for the Opportunity Realm
 * 
 * Architecture Rules:
 * - STRICTLY SEPARATE FROM USER
 * - NO raw content reuse
 * - Generated summary only
 * - Used for matching display
 */

import { prisma } from './prisma';
import { getTrustVector } from './trust-vector';

// ==========================================
// Types
// ==========================================

export interface CapabilityBreakdown {
  therapeuticAreas: Record<string, number>;
  trialPhases: Record<string, number>;
  issueExpertise: Record<string, number>;
}

export interface CapabilityIdentityResult {
  profileId: string;
  capabilityBreakdown: CapabilityBreakdown;
  reliabilityScore: number;
  responsivenessScore: number;
  generatedSummary: string;
  isAvailable: boolean;
}

// ==========================================
// Main Functions
// ==========================================

/**
 * Get or create capability identity for a user
 */
export async function getCapabilityIdentity(userId: string): Promise<CapabilityIdentityResult | null> {
  try {
    let capabilityIdentity = await prisma.capabilityIdentity.findUnique({
      where: { userId }
    });

    if (!capabilityIdentity) {
      // Create new capability identity
      capabilityIdentity = await createCapabilityIdentity(userId);
    }

    if (!capabilityIdentity) return null;

    return {
      profileId: capabilityIdentity.profileId,
      capabilityBreakdown: {
        therapeuticAreas: (capabilityIdentity.therapeuticAreas as Record<string, number>) || {},
        trialPhases: (capabilityIdentity.trialPhases as Record<string, number>) || {},
        issueExpertise: (capabilityIdentity.issueExpertise as Record<string, number>) || {}
      },
      reliabilityScore: capabilityIdentity.reliabilityScore,
      responsivenessScore: capabilityIdentity.responsivenessScore,
      generatedSummary: capabilityIdentity.generatedSummary || '',
      isAvailable: capabilityIdentity.isAvailable
    };
  } catch (error) {
    console.error('Error getting capability identity:', error);
    return null;
  }
}

/**
 * Create a new capability identity for a user
 */
async function createCapabilityIdentity(userId: string) {
  try {
    // Generate anonymous profile ID
    const profileId = generateAnonymousProfileId();

    // Get user's contributions to calculate capabilities
    const contributions = await prisma.contribution.findMany({
      where: { userId },
      select: {
        therapeuticArea: true,
        trialPhase: true,
        issueCategory: true,
        contributionType: true
      }
    });

    // Get trust vector for reliability score
    const trustVector = await getTrustVector(userId);

    // Calculate capability breakdown
    const breakdown = calculateCapabilityBreakdown(contributions);

    // Generate summary
    const summary = generateSummary(breakdown, trustVector?.overallWeight || 0.5);

    return await prisma.capabilityIdentity.create({
      data: {
        userId,
        profileId,
        therapeuticAreas: breakdown.therapeuticAreas,
        trialPhases: breakdown.trialPhases,
        issueExpertise: breakdown.issueExpertise,
        reliabilityScore: trustVector?.overallWeight || 0.5,
        responsivenessScore: 0.5,
        generatedSummary: summary,
        isAvailable: true
      }
    });
  } catch (error) {
    console.error('Error creating capability identity:', error);
    return null;
  }
}

/**
 * Update capability identity based on new contributions
 */
export async function updateCapabilityIdentity(userId: string): Promise<void> {
  try {
    // Get user's contributions
    const contributions = await prisma.contribution.findMany({
      where: { userId },
      select: {
        therapeuticArea: true,
        trialPhase: true,
        issueCategory: true,
        contributionType: true
      }
    });

    // Get trust vector
    const trustVector = await getTrustVector(userId);

    // Calculate updated breakdown
    const breakdown = calculateCapabilityBreakdown(contributions);

    // Generate updated summary
    const summary = generateSummary(breakdown, trustVector?.overallWeight || 0.5);

    // Upsert capability identity
    await prisma.capabilityIdentity.upsert({
      where: { userId },
      update: {
        therapeuticAreas: breakdown.therapeuticAreas,
        trialPhases: breakdown.trialPhases,
        issueExpertise: breakdown.issueExpertise,
        reliabilityScore: trustVector?.overallWeight || 0.5,
        generatedSummary: summary,
        lastUpdated: new Date()
      },
      create: {
        userId,
        profileId: generateAnonymousProfileId(),
        therapeuticAreas: breakdown.therapeuticAreas,
        trialPhases: breakdown.trialPhases,
        issueExpertise: breakdown.issueExpertise,
        reliabilityScore: trustVector?.overallWeight || 0.5,
        generatedSummary: summary
      }
    });
  } catch (error) {
    console.error('Error updating capability identity:', error);
  }
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Generate anonymous profile ID
 */
function generateAnonymousProfileId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CAP-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate capability breakdown from contributions
 */
function calculateCapabilityBreakdown(contributions: Array<{
  therapeuticArea: string;
  trialPhase: string;
  issueCategory: string;
}>): CapabilityBreakdown {
  const therapeuticAreas: Record<string, number> = {};
  const trialPhases: Record<string, number> = {};
  const issueExpertise: Record<string, number> = {};

  for (const contribution of contributions) {
    // Count therapeutic areas
    if (contribution.therapeuticArea) {
      therapeuticAreas[contribution.therapeuticArea] = 
        (therapeuticAreas[contribution.therapeuticArea] || 0) + 1;
    }

    // Count trial phases
    if (contribution.trialPhase) {
      trialPhases[contribution.trialPhase] = 
        (trialPhases[contribution.trialPhase] || 0) + 1;
    }

    // Count issue categories
    if (contribution.issueCategory) {
      issueExpertise[contribution.issueCategory] = 
        (issueExpertise[contribution.issueCategory] || 0) + 1;
    }
  }

  // Normalize to 0-1 scale
  const total = contributions.length || 1;
  
  for (const key of Object.keys(therapeuticAreas)) {
    therapeuticAreas[key] = Math.min(therapeuticAreas[key] / Math.max(total * 0.3, 1), 1);
  }
  
  for (const key of Object.keys(trialPhases)) {
    trialPhases[key] = Math.min(trialPhases[key] / Math.max(total * 0.3, 1), 1);
  }
  
  for (const key of Object.keys(issueExpertise)) {
    issueExpertise[key] = Math.min(issueExpertise[key] / Math.max(total * 0.3, 1), 1);
  }

  return { therapeuticAreas, trialPhases, issueExpertise };
}

/**
 * Generate anonymous summary for matching display
 */
function generateSummary(
  breakdown: CapabilityBreakdown, 
  trustWeight: number
): string {
  const parts: string[] = [];

  // Top therapeutic areas
  const topAreas = Object.entries(breakdown.therapeuticAreas)
    .filter(([, score]) => score > 0.3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([area]) => area);

  if (topAreas.length > 0) {
    parts.push(`experienced in ${topAreas.join(' and ')}`);
  }

  // Top trial phases
  const topPhases = Object.entries(breakdown.trialPhases)
    .filter(([, score]) => score > 0.3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([phase]) => phase);

  if (topPhases.length > 0) {
    parts.push(`${topPhases.join(' and ')} trials`);
  }

  // Top issue expertise
  const topIssues = Object.entries(breakdown.issueExpertise)
    .filter(([, score]) => score > 0.3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([issue]) => issue.toLowerCase());

  if (topIssues.length > 0) {
    parts.push(`strong in ${topIssues.join(' and ')}`);
  }

  // Trust level indicator
  if (trustWeight > 0.7) {
    parts.unshift('Highly reliable operator');
  } else if (trustWeight > 0.5) {
    parts.unshift('Reliable operator');
  } else {
    parts.unshift('Operator');
  }

  return parts.join(' with ') + '.';
}

export default {
  getCapabilityIdentity,
  updateCapabilityIdentity
};