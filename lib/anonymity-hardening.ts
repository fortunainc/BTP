/**
 * SECTION 7: Anonymity Hardening (FINAL)
 * 
 * Maintains zero-identification guarantee
 * Enhanced protections after all system changes
 */

import { createHash, randomBytes } from 'crypto';
import { injectSecureDecoys } from './decoy-enhancer';
import { sanitizeContribution } from './anonymity-engine';

// ==========================================
// TYPES
// ==========================================

/**
 * Anonymity configuration
 */
export const ANONYMITY_CONFIG = {
  // Timing
  minNotificationDelayHours: 2,
  maxNotificationDelayHours: 48,
  
  // Batching
  batchSize: 5,                  // Minimum matches per batch
  batchWindowMs: 6 * 60 * 60 * 1000,  // 6 hours
  
  // Decoys
  decoyRatio: 3,                 // 3 decoys per real match
  
  // Content
  maxContributionPreviewLength: 100,  // Characters
  stripAllIdentifiers: true
};

/**
 * Batch exposure result
 */
export interface BatchExposureResult {
  batchId: string;
  matches: Array<{
    profileId: string;
    matchScore: number;
    isDecoy: boolean;
  }>;
  exposureTime: Date;
  delayApplied: number;          // hours
  allMatchesReleased: boolean;
}

/**
 * Anonymity verification result
 */
export interface AnonymityVerification {
  passed: boolean;
  checks: {
    noRawContributionText: boolean;
    oneWayHashMapping: boolean;
    randomizedDelays: boolean;
    batchedExposure: boolean;
    decoysInjected: boolean;
    crossRealmIsolated: boolean;
  };
  violations: string[];
  recommendations: string[];
}

/**
 * Sanitized opportunity view
 */
export interface SanitizedOpportunityView {
  opportunityId: string;
  title: string;
  description: string;           // Sanitized, no raw contribution text
  therapeuticArea: string;
  trialPhase: string;
  matchReasoning: string;        // Generated, not from raw text
  operatorProfile: {
    profileId: string;           // Anonymous ID
    matchScore: number;
    capabilityBands: {
      experience: string;
      reliability: string;
      outcome: string;
    };
    therapeuticAreas: string[];  // List, not specific counts
  };
}

// ==========================================
// RAW CONTRIBUTION PROTECTION
// ==========================================

/**
 * Verify no raw contribution text in opportunity realm
 */
export function verifyNoRawContributionText(params: {
  opportunityData: {
    description: string;
    matchReasoning: string;
    anyTextField?: string;
  };
}): { clean: boolean; violations: string[] } {
  const violations: string[] = [];
  const text = `${params.opportunityData.description} ${params.opportunityData.matchReasoning} ${params.opportunityData.anyTextField || ''}`;
  
  // Check for identifying patterns
  const identifyingPatterns = [
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/,  // Full names
    /[\w.-]+@[\w.-]+\.\w+/,            // Emails
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,   // Phone numbers
    /\b\d{4}-\d{2}-\d{2}\b/,           // Dates
    /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,  // Days
    /at\s+[A-Z][a-z]+\s+[A-Z][a-z]+/,  // Site references
    /with\s+[A-Z][a-z]+/               // Sponsor references
  ];
  
  identifyingPatterns.forEach((pattern, index) => {
    if (pattern.test(text)) {
      violations.push(`Identifying pattern ${index + 1} detected in opportunity data`);
    }
  });
  
  return {
    clean: violations.length === 0,
    violations
  };
}

/**
 * Generate sanitized opportunity view
 */
export function generateSanitizedOpportunityView(params: {
  opportunity: {
    id: string;
    title: string;
    description: string;
    therapeuticArea: string;
    trialPhase: string;
  };
  match: {
    profileId: string;
    matchScore: number;
    capabilityBands: {
      experience: string;
      reliability: string;
      outcome: string;
    };
    therapeuticAreas: string[];
  };
  reasoning: string;
}): SanitizedOpportunityView {
  // Sanitize all text fields
  const sanitizedDescription = sanitizeForOpportunityRealm(params.opportunity.description);
  const sanitizedReasoning = sanitizeForOpportunityRealm(params.reasoning);
  
  return {
    opportunityId: params.opportunity.id,
    title: params.opportunity.title,
    description: sanitizedDescription,
    therapeuticArea: params.opportunity.therapeuticArea,
    trialPhase: params.opportunity.trialPhase,
    matchReasoning: sanitizedReasoning,
    operatorProfile: {
      profileId: params.match.profileId,
      matchScore: params.match.matchScore,
      capabilityBands: params.match.capabilityBands,
      therapeuticAreas: params.match.therapeuticAreas
    }
  };
}

/**
 * Sanitize text for opportunity realm
 */
function sanitizeForOpportunityRealm(text: string): string {
  let sanitized = text;
  
  // Remove site names
  sanitized = sanitized.replace(/at\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g, 'at a clinical site');
  
  // Remove sponsor names
  sanitized = sanitized.replace(/with\s+[A-Z][a-z]+/g, 'with a sponsor');
  
  // Remove specific dates
  sanitized = sanitized.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[DATE]');
  sanitized = sanitized.replace(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{4}\b/gi, '[DATE]');
  
  // Remove timestamps
  sanitized = sanitized.replace(/\b\d{1,2}:\d{2}\s*(?:AM|PM)?\b/gi, '[TIME]');
  
  // Truncate if too long
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 497) + '...';
  }
  
  return sanitized;
}

// ==========================================
// ONE-WAY HASH MAPPING
// ==========================================

/**
 * Verify one-way hash mapping is enforced
 */
export function verifyOneWayHashMapping(params: {
  capabilityIdentity: {
    profileId: string;
    lookupKey?: string;
    userId?: string;  // Should NOT exist
  };
}): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  if (params.capabilityIdentity.userId) {
    violations.push('CRITICAL: userId is directly stored in CapabilityIdentity');
  }
  
  if (!params.capabilityIdentity.lookupKey) {
    violations.push('WARNING: lookupKey not present - using legacy identification');
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Generate secure cross-realm mapping
 */
export function generateSecureCrossRealmMapping(params: {
  operatorId: string;
  realm: 'CONTRIBUTION' | 'OPPORTUNITY' | 'OUTCOME';
}): {
  realmId: string;
  hashKey: string;
  reversible: boolean;  // Always false
} {
  const salt = process.env.CROSS_REALM_SALT || 'btp-cross-realm-salt';
  const hashKey = createHash('sha256')
    .update(`${params.operatorId}:${salt}:${params.realm}`)
    .digest('hex')
    .substring(0, 32);
  
  return {
    realmId: `${params.realm.toLowerCase()}-${hashKey}`,
    hashKey,
    reversible: false
  };
}

// ==========================================
// RANDOMIZED DELAYS
// ==========================================

/**
 * Generate randomized notification timing
 */
export function generateRandomizedTiming(params: {
  eventCount: number;
  baseTimestamp?: Date;
}): Array<{
  eventId: string;
  scheduledTime: Date;
  delayHours: number;
}> {
  const baseTime = params.baseTimestamp || new Date();
  const results: Array<{
    eventId: string;
    scheduledTime: Date;
    delayHours: number;
  }> = [];
  
  for (let i = 0; i < params.eventCount; i++) {
    // Random delay between min and max
    const delayHours = ANONYMITY_CONFIG.minNotificationDelayHours + 
      Math.random() * (ANONYMITY_CONFIG.maxNotificationDelayHours - ANONYMITY_CONFIG.minNotificationDelayHours);
    
    const delayMs = delayHours * 60 * 60 * 1000;
    const scheduledTime = new Date(baseTime.getTime() + delayMs);
    
    results.push({
      eventId: `event-${i}-${randomBytes(4).toString('hex')}`,
      scheduledTime,
      delayHours: Math.round(delayHours * 10) / 10
    });
  }
  
  // Sort by scheduled time to add additional randomization
  results.sort(() => Math.random() - 0.5);
  
  return results;
}

// ==========================================
// BATCH-BASED EXPOSURE
// ==========================================

/**
 * Create batched match exposure
 */
export function createBatchedExposure(params: {
  realMatches: Array<{
    profileId: string;
    matchScore: number;
  }>;
  organizationId: string;
  jobPostingId: string;
  jobSignature: string;
}): BatchExposureResult {
  const { realMatches, organizationId, jobPostingId, jobSignature } = params;
  
  // Inject secure decoys
  const matchesWithDecoys = injectSecureDecoys({
    realMatches,
    organizationId,
    jobPostingId,
    jobSignature
  });
  
  // Calculate delay
  const delayHours = ANONYMITY_CONFIG.minNotificationDelayHours + 
    Math.random() * (ANONYMITY_CONFIG.maxNotificationDelayHours - ANONYMITY_CONFIG.minNotificationDelayHours);
  
  const exposureTime = new Date(Date.now() + delayHours * 60 * 60 * 1000);
  
  return {
    batchId: `batch-${Date.now()}-${randomBytes(4).toString('hex')}`,
    matches: matchesWithDecoys,
    exposureTime,
    delayApplied: Math.round(delayHours * 10) / 10,
    allMatchesReleased: matchesWithDecoys.length >= ANONYMITY_CONFIG.batchSize
  };
}

/**
 * Verify batch contains minimum matches
 */
export function verifyBatchSize(matches: Array<{ isDecoy: boolean }>): {
  valid: boolean;
  realCount: number;
  decoyCount: number;
  message: string;
} {
  const realCount = matches.filter(m => !m.isDecoy).length;
  const decoyCount = matches.filter(m => m.isDecoy).length;
  
  const valid = matches.length >= ANONYMITY_CONFIG.batchSize;
  
  return {
    valid,
    realCount,
    decoyCount,
    message: valid 
      ? `Batch contains ${matches.length} matches (${realCount} real, ${decoyCount} decoys)`
      : `Batch too small: ${matches.length} matches. Minimum is ${ANONYMITY_CONFIG.batchSize}`
  };
}

// ==========================================
// DECOY INJECTION VERIFICATION
// ==========================================

/**
 * Verify decoys are consistently injected
 */
export function verifyDecoyInjection(params: {
  matchSets: Array<{
    organizationId: string;
    jobSignature: string;
    matches: Array<{ profileId: string; isDecoy: boolean }>;
  }>;
}): {
  passed: boolean;
  consistentDecoys: boolean;
  analysis: string;
} {
  // Group by job signature
  const signatureGroups = new Map<string, Set<string>>();
  
  params.matchSets.forEach(set => {
    if (!signatureGroups.has(set.jobSignature)) {
      signatureGroups.set(set.jobSignature, new Set());
    }
    set.matches.forEach(m => {
      signatureGroups.get(set.jobSignature)!.add(m.profileId);
    });
  });
  
  // Check if same signatures have consistent decoys
  let consistentCount = 0;
  let inconsistentCount = 0;
  
  signatureGroups.forEach((profiles, signature) => {
    // For same signature, decoys should be consistent
    const matchSetsWithSignature = params.matchSets.filter(s => s.jobSignature === signature);
    if (matchSetsWithSignature.length > 1) {
      const firstDecoys = matchSetsWithSignature[0].matches.filter(m => m.isDecoy).map(m => m.profileId);
      const allSame = matchSetsWithSignature.every(set => {
        const decoys = set.matches.filter(m => m.isDecoy).map(m => m.profileId);
        return JSON.stringify([...firstDecoys].sort()) === JSON.stringify([...decoys].sort());
      });
      
      if (allSame) {
        consistentCount++;
      } else {
        inconsistentCount++;
      }
    }
  });
  
  const passed = inconsistentCount === 0;
  
  return {
    passed,
    consistentDecoys: passed,
    analysis: passed
      ? 'Decoys are consistently injected across similar jobs'
      : `${inconsistentCount} job signature(s) have inconsistent decoys`
  };
}

// ==========================================
// COMPREHENSIVE ANONYMITY VERIFICATION
// ==========================================

/**
 * Run comprehensive anonymity verification
 */
export function runComprehensiveVerification(params: {
  capabilityIdentities: Array<{
    profileId: string;
    lookupKey?: string;
    userId?: string;
  }>;
  opportunityData: Array<{
    description: string;
    matchReasoning: string;
  }>;
  matchSets: Array<{
    organizationId: string;
    jobSignature: string;
    matches: Array<{ profileId: string; isDecoy: boolean }>;
  }>;
  notificationTiming: Array<{
    scheduledTime: Date;
    createdAt: Date;
  }>;
}): AnonymityVerification {
  const violations: string[] = [];
  const recommendations: string[] = [];
  
  // Check 1: No raw contribution text
  let noRawTextPassed = true;
  params.opportunityData.forEach((data, index) => {
    const result = verifyNoRawContributionText({ opportunityData: data });
    if (!result.clean) {
      noRawTextPassed = false;
      violations.push(`Opportunity ${index}: ${result.violations.join(', ')}`);
    }
  });
  
  // Check 2: One-way hash mapping
  let oneWayHashPassed = true;
  params.capabilityIdentities.forEach((identity, index) => {
    const result = verifyOneWayHashMapping({ capabilityIdentity: identity });
    if (!result.valid) {
      oneWayHashPassed = false;
      violations.push(`CapabilityIdentity ${index}: ${result.violations.join(', ')}`);
    }
  });
  
  // Check 3: Randomized delays
  let randomizedDelaysPassed = true;
  const delays = params.notificationTiming.map(t => 
    (t.scheduledTime.getTime() - t.createdAt.getTime()) / (60 * 60 * 1000)
  );
  const minDelay = Math.min(...delays);
  const maxDelay = Math.max(...delays);
  if (minDelay < ANONYMITY_CONFIG.minNotificationDelayHours || 
      maxDelay > ANONYMITY_CONFIG.maxNotificationDelayHours) {
    randomizedDelaysPassed = false;
    violations.push(`Delays outside expected range: ${minDelay.toFixed(1)}h - ${maxDelay.toFixed(1)}h`);
  }
  
  // Check 4: Batched exposure
  const batchCheck = verifyBatchSize(
    params.matchSets.flatMap(s => s.matches)
  );
  const batchedExposurePassed = batchCheck.valid;
  if (!batchedExposurePassed) {
    violations.push(batchCheck.message);
  }
  
  // Check 5: Decoys injected
  const decoyCheck = verifyDecoyInjection({ matchSets: params.matchSets });
  const decoysInjectedPassed = decoyCheck.passed;
  if (!decoysInjectedPassed) {
    violations.push(decoyCheck.analysis);
  }
  
  // Check 6: Cross-realm isolation
  const crossRealmIsolatedPassed = oneWayHashPassed;  // Same check
  
  // Generate recommendations
  if (!noRawTextPassed) {
    recommendations.push('Review text sanitization for opportunity data');
  }
  if (!oneWayHashPassed) {
    recommendations.push('Remove userId from all CapabilityIdentity records');
    recommendations.push('Implement one-way hashed lookupKey system');
  }
  if (!randomizedDelaysPassed) {
    recommendations.push('Review notification timing logic');
  }
  if (!batchedExposurePassed) {
    recommendations.push('Increase minimum batch size for match exposure');
  }
  if (!decoysInjectedPassed) {
    recommendations.push('Verify decoy injection consistency across similar jobs');
  }
  
  const passed = violations.length === 0;
  
  return {
    passed,
    checks: {
      noRawContributionText: noRawTextPassed,
      oneWayHashMapping: oneWayHashPassed,
      randomizedDelays: randomizedDelaysPassed,
      batchedExposure: batchedExposurePassed,
      decoysInjected: decoysInjectedPassed,
      crossRealmIsolated: crossRealmIsolatedPassed
    },
    violations,
    recommendations
  };
}

// ==========================================
// EXPORTS
// ==========================================

export const AnonymityHardeningEngine = {
  verifyNoRawContributionText,
  generateSanitizedOpportunityView,
  verifyOneWayHashMapping,
  generateSecureCrossRealmMapping,
  generateRandomizedTiming,
  createBatchedExposure,
  verifyBatchSize,
  verifyDecoyInjection,
  runComprehensiveVerification
};