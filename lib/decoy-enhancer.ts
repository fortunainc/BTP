/**
 * Decoy Enhancement System
 * 
 * CRITICAL FIX: Ensures that no single real operator can be isolated
 * through multi-account attacks.
 * 
 * Problem: If real operator appears in all matches across fake accounts,
 * but decoys are different, attacker can identify real operator.
 * 
 * Solution: 
 * 1. Use CONSISTENT decoys across similar job postings
 * 2. Ensure decoy pool includes profiles that appear in multiple match sets
 * 3. Never let a real operator be uniquely identifiable
 */

import { randomBytes, randomInt } from 'crypto';
import { prisma } from './prisma';

// Pool of persistent decoy profiles
interface DecoyProfile {
  profileId: string;
  createdAt: Date;
  usageCount: number;
  lastUsed: Date;
}

// In-memory cache of decoy profiles (would be database in production)
const decoyPool: Map<string, DecoyProfile> = new Map();

// Initialize some persistent decoys
for (let i = 0; i < 100; i++) {
  const profileId = `CAP-${randomBytes(4).toString('hex').toUpperCase()}`;
  decoyPool.set(profileId, {
    profileId,
    createdAt: new Date(),
    usageCount: 0,
    lastUsed: new Date()
  });
}

/**
 * Get a selection of decoys that will appear consistently
 * across similar job postings from the same organization
 */
export function getConsistentDecoys(params: {
  organizationId: string;
  realProfileIds: string[];
  count: number;
  jobSignature: string; // Hash of job characteristics
}): string[] {
  
  const { organizationId, realProfileIds, count, jobSignature } = params;
  
  // Generate a deterministic seed based on org + job signature
  // This ensures same decoys appear for similar jobs from same org
  const seed = `${organizationId}:${jobSignature}`;
  const seedHash = simpleHash(seed);
  
  // Select decoys based on seed
  const allDecoyIds = [...decoyPool.keys()];
  const selectedDecoys: string[] = [];
  
  // Use seeded selection for consistency
  for (let i = 0; i < count && i < allDecoyIds.length; i++) {
    const index = (seedHash + i * 17) % allDecoyIds.length; // 17 is a prime for better distribution
    const decoyId = allDecoyIds[index];
    
    if (!realProfileIds.includes(decoyId) && !selectedDecoys.includes(decoyId)) {
      selectedDecoys.push(decoyId);
      
      // Update usage stats
      const decoy = decoyPool.get(decoyId);
      if (decoy) {
        decoy.usageCount++;
        decoy.lastUsed = new Date();
      }
    }
  }
  
  return selectedDecoys;
}

/**
 * Enhanced decoy injection that prevents isolation attacks
 * 
 * CRITICAL: Uses jobSignature for CONSISTENT decoys across organizations
 * This ensures that the same decoys appear for similar jobs, preventing
 * attackers from isolating real operators through multi-account attacks.
 */
export function injectSecureDecoys(params: {
  realMatches: Array<{ profileId: string; matchScore: number }>;
  organizationId: string;
  jobPostingId: string;
  jobSignature: string;
}): Array<{ profileId: string; matchScore: number; isDecoy: boolean }> {
  
  const { realMatches, organizationId, jobSignature } = params;
  
  // CRITICAL: Use ONLY jobSignature for decoy selection (ignore organizationId)
  // This ensures same decoys appear regardless of which org posts the job
  const seed = `global:${jobSignature}`;
  const seedHash = simpleHash(seed);
  
  // Get ALL decoy IDs
  const allDecoyIds = [...decoyPool.keys()];
  
  // Select decoys deterministically based on job signature ONLY
  // This ensures SAME decoys appear across all organizations posting similar jobs
  const selectedDecoyIds: string[] = [];
  const decoyCount = Math.max(realMatches.length * 3, 8); // More decoys
  
  for (let i = 0; i < decoyCount && selectedDecoyIds.length < allDecoyIds.length; i++) {
    const index = (seedHash + i * 17) % allDecoyIds.length;
    const decoyId = allDecoyIds[index];
    
    if (!realMatches.map(m => m.profileId).includes(decoyId) && !selectedDecoyIds.includes(decoyId)) {
      selectedDecoyIds.push(decoyId);
    }
  }
  
  // Create decoy matches with deterministic scores based on job signature
  const decoyMatches = selectedDecoyIds.map((profileId, index) => {
    // Deterministic score based on index and seed
    const baseScore = 0.5 + ((seedHash + index * 7) % 40) / 100; // 0.50 - 0.90
    const variation = ((seedHash + index * 3) % 10) / 100; // 0.00 - 0.10
    
    return {
      profileId,
      matchScore: Math.min(Math.max(baseScore + variation, 0.4), 0.92),
      isDecoy: true
    };
  });
  
  // Combine real and decoy matches
  const mixed = [
    ...realMatches.map(m => ({ ...m, isDecoy: false })),
    ...decoyMatches
  ];
  
  // Deterministic shuffle based on job signature (same order for same job)
  const shuffleSeed = seedHash;
  for (let i = mixed.length - 1; i > 0; i--) {
    const j = (shuffleSeed + i * 31) % (i + 1);
    [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
  }
  
  return mixed;
}

/**
 * Verify that no real operator can be uniquely identified
 * across multiple match sets
 */
export function verifyNoIsolation(params: {
  matchSets: Array<{
    organizationId: string;
    matches: Array<{ profileId: string; isDecoy: boolean }>;
  }>;
}): {
  secure: boolean;
  isolatedProfiles: string[];
  warning: string | null;
} {
  
  const profileAppearances = new Map<string, number>();
  const realProfileAppearances = new Map<string, number>();
  
  for (const matchSet of params.matchSets) {
    for (const match of matchSet.matches) {
      const count = profileAppearances.get(match.profileId) || 0;
      profileAppearances.set(match.profileId, count + 1);
      
      if (!match.isDecoy) {
        const realCount = realProfileAppearances.get(match.profileId) || 0;
        realProfileAppearances.set(match.profileId, realCount + 1);
      }
    }
  }
  
  // Check for profiles that appear in ALL match sets
  const totalSets = params.matchSets.length;
  const isolatedProfiles: string[] = [];
  
  for (const [profileId, count] of profileAppearances) {
    if (count === totalSets) {
      // This profile appears in ALL match sets
      const isReal = realProfileAppearances.has(profileId);
      const otherProfilesInAll = [...profileAppearances.entries()]
        .filter(([id, c]) => c === totalSets && id !== profileId)
        .length;
      
      if (isReal && otherProfilesInAll === 0) {
        // CRITICAL: Real profile is the ONLY one in all match sets
        isolatedProfiles.push(profileId);
      }
    }
  }
  
  const secure = isolatedProfiles.length === 0;
  const warning = isolatedProfiles.length > 0
    ? `CRITICAL: ${isolatedProfiles.length} real profiles can be isolated through multi-account attack`
    : null;
  
  return {
    secure,
    isolatedProfiles,
    warning
  };
}

/**
 * Generate a job signature for decoy consistency
 */
export function generateJobSignature(params: {
  title: string;
  therapeuticArea: string;
  trialPhase: string;
}): string {
  const normalized = `${params.title.toLowerCase()}:${params.therapeuticArea.toLowerCase()}:${params.trialPhase.toLowerCase()}`;
  return simpleHash(normalized).toString();
}

/**
 * Simple hash function for deterministic selection
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get statistics about decoy pool
 */
export function getDecoyPoolStats(): {
  totalDecoys: number;
  avgUsage: number;
  maxUsage: number;
} {
  const decoys = [...decoyPool.values()];
  
  return {
    totalDecoys: decoys.length,
    avgUsage: decoys.reduce((sum, d) => sum + d.usageCount, 0) / decoys.length || 0,
    maxUsage: Math.max(...decoys.map(d => d.usageCount))
  };
}

export default {
  getConsistentDecoys,
  injectSecureDecoys,
  verifyNoIsolation,
  generateJobSignature,
  getDecoyPoolStats
};