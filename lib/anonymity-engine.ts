/**
 * BTP Hardcore Anonymity Engine
 * 
 * NON-NEGOTIABLE PRINCIPLE:
 * It is IMPOSSIBLE for an organization (or malicious user) to identify an operator
 * Even with:
 *   - multiple fake accounts
 *   - repeated job postings
 *   - timing analysis
 *   - cross-referencing contributions
 * 
 * This module implements ALL anonymity protections.
 */

import { createHash, randomBytes, randomInt } from 'crypto';

// ==========================================
// CORE TYPES
// ==========================================

export interface AnonymizationResult {
  sanitizedContent: string;
  removedElements: string[];
  noiseInjected: boolean;
  riskScore: number; // 0-1, lower is better
}

export interface TimingNoise {
  delayMs: number;
  batchKey: string;
  decoyInjected: boolean;
}

export interface CorrelationRisk {
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendedAction: 'allow' | 'delay' | 'block' | 'decoy';
}

export interface DecoyMatch {
  id: string;
  profileId: string;
  isDecoy: true;
  matchedAt: Date;
}

// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
  // Timing randomization
  notificationDelayMinMs: 2 * 60 * 60 * 1000,  // 2 hours
  notificationDelayMaxMs: 48 * 60 * 60 * 1000, // 48 hours
  
  // Batch windows
  batchWindowSizeMs: 4 * 60 * 60 * 1000, // 4 hours
  
  // Decoy ratio (1 real : decoyRatio decoys)
  decoyRatio: 3,
  
  // Semantic noise
  noiseInjectionRate: 0.15, // 15% of content gets noise
  
  // Thresholds
  maxMatchesPerOrgPerDay: 50,
  maxSimilarJobPostsPerOrg: 5,
  suspiciousMatchThreshold: 3, // Same operator matched 3+ times = suspicious
  
  // Bands for metrics (never expose exact counts)
  experienceBands: ['newcomer', 'developing', 'experienced', 'expert'],
  hireBands: ['few', 'several', 'many', 'numerous'],
  reliabilityBands: ['developing', 'reliable', 'highly_reliable', 'proven'],
  qualityBands: ['standard', 'good', 'high', 'exceptional']
};

// ==========================================
// 1. CONTRIBUTION-LEVEL PROTECTION
// ==========================================

/**
 * Sanitize contribution content to prevent identification
 */
export function sanitizeContribution(content: string, metadata?: {
  therapeuticArea?: string;
  trialPhase?: string;
  siteLocation?: string;
}): AnonymizationResult {
  
  let sanitizedContent = content;
  const removedElements: string[] = [];
  let noiseInjected = false;
  
  // 1. STRIP TIMESTAMPS - bucket to day/week
  sanitizedContent = stripTimestamps(sanitizedContent, removedElements);
  
  // 2. REDACT LOCATION INDICATORS
  sanitizedContent = redactLocations(sanitizedContent, removedElements);
  
  // 3. REPLACE SPONSOR/SITE REFERENCES
  sanitizedContent = replaceSponsorReferences(sanitizedContent, removedElements);
  
  // 4. SEMANTIC NOISE INJECTION
  if (Math.random() < CONFIG.noiseInjectionRate) {
    sanitizedContent = injectSemanticNoise(sanitizedContent);
    noiseInjected = true;
  }
  
  // 5. PATTERN NORMALIZATION
  sanitizedContent = normalizePatterns(sanitizedContent, removedElements);
  
  // Calculate risk score
  const riskScore = calculateContentRiskScore(sanitizedContent, removedElements);
  
  return {
    sanitizedContent,
    removedElements,
    noiseInjected,
    riskScore
  };
}

function stripTimestamps(content: string, removed: string[]): string {
  // Remove specific dates/times
  const datePatterns = [
    /\b(?:on|at|by|before|after)\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{4}\b/gi,
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b(?:at\s+)?\d{1,2}:\d{2}\s*(?:AM|PM)?\b/gi,
    /\b(?:yesterday|tomorrow|last\s+week|next\s+week|last\s+month)\b/gi
  ];
  
  let result = content;
  for (const pattern of datePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      removed.push(...matches.map(m => `timestamp:${m}`));
      result = result.replace(pattern, '[TIME_PERIOD]');
    }
  }
  
  return result;
}

function redactLocations(content: string, removed: string[]): string {
  // Common location patterns
  const locationPatterns = [
    // US States
    /\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/g,
    // Major cities
    /\b(?:New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|Fort Worth|Columbus|Charlotte|San Francisco|Indianapolis|Seattle|Denver|Washington|Boston|Nashville|Baltimore|Louisville|Portland|Las Vegas|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Kansas City|Long Beach|Mesa|Atlanta|Colorado Springs|Virginia Beach|Raleigh|Omaha|Miami|Oakland|Minneapolis|Tulsa|Cleveland|Wichita|Arlington|New Orleans|Bakersfield|Tampa|Honolulu)\b/gi,
    // Countries
    /\b(?:United States|USA|UK|United Kingdom|Canada|Germany|France|Japan|China|India|Brazil|Australia)\b/gi,
    // Site identifiers
    /\b(?:site\s+\d+|location\s+\d+|center\s+\d+|facility\s+\d+)\b/gi
  ];
  
  let result = content;
  for (const pattern of locationPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      removed.push(...matches.map(m => `location:${m}`));
      result = result.replace(pattern, '[LOCATION]');
    }
  }
  
  return result;
}

function replaceSponsorReferences(content: string, removed: string[]): string {
  // Sponsors/CROs/Sites
  const sponsorPatterns = [
    // Major pharma
    /\b(?:Pfizer|Merck|Novartis|Roche|GSK|AstraZeneca|Johnson & Johnson|J&J|Eli Lilly|Bristol-Myers|BMS|AbbVie|Sanofi|Bayer|Amgen|Gilead|Biogen|Moderna|BioNTech)\b/gi,
    // Major CROs
    /\b(?:IQVIA|Parexel|Syneos|PPD|PRA|Covance|LabCorp|Charles River|Medidata|ICON|WCG|Fortrea)\b/gi,
    // Protocol IDs (NCT numbers)
    /\bNCT\d{8}\b/gi,
    // Protocol numbers
    /\b(?:protocol|study)\s+[A-Z]{2,4}-\d{3,6}[A-Z]?\b/gi,
    // IND numbers
    /\bIND\s*\d{5,6}\b/gi
  ];
  
  let result = content;
  for (const pattern of sponsorPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      removed.push(...matches.map(m => `sponsor:${m}`));
      result = result.replace(pattern, '[SPONSOR]');
    }
  }
  
  return result;
}

function injectSemanticNoise(content: string): string {
  // Expanded synonym variations to prevent fingerprinting
  const synonymMap: Record<string, string[]> = {
    'patient': ['subject', 'participant', 'individual'],
    'site': ['location', 'center', 'facility'],
    'enrollment': ['recruitment', 'accrual', 'enrollment'],
    'protocol': ['study plan', 'procedures', 'protocol design'],
    'data': ['information', 'records', 'study data'],
    'issue': ['problem', 'challenge', 'situation'],
    'resolved': ['addressed', 'handled', 'resolved'],
    'challenge': ['difficulty', 'obstacle', 'challenge'],
    'significant': ['notable', 'considerable', 'substantial'],
    'experienced': ['seasoned', 'skilled', 'knowledgeable'],
    'successfully': ['effectively', 'efficiently', 'successfully'],
    'implemented': ['established', 'deployed', 'implemented'],
    'team': ['group', 'staff', 'personnel'],
    'process': ['workflow', 'procedure', 'process'],
    'regulatory': ['compliance', 'regulatory', 'governing'],
    'clinical': ['study', 'trial', 'clinical'],
    'trial': ['study', 'investigation', 'trial'],
    'management': ['oversight', 'coordination', 'management'],
    'increase': ['improve', 'enhance', 'increase'],
    'decrease': ['reduce', 'lower', 'decrease'],
    'initially': ['at first', 'originally', 'initially'],
    'ultimately': ['eventually', 'finally', 'ultimately'],
    'collaborated': ['worked together', 'partnered', 'collaborated'],
    'identified': ['discovered', 'found', 'identified'],
    'developed': ['created', 'designed', 'developed'],
    'analyzed': ['examined', 'reviewed', 'analyzed'],
    'conducted': ['performed', 'carried out', 'executed'],
    'established': ['set up', 'created', 'implemented'],
    'monitored': ['tracked', 'observed', 'monitored'],
    'reported': ['documented', 'recorded', 'noted']
  };
  
  // Sentence structure variations
  const structureVariations = [
    { pattern: /we faced/gi, replacements: ['there was', 'we encountered', 'the team experienced'] },
    { pattern: /we implemented/gi, replacements: ['implementation included', 'the approach involved', 'steps taken included'] },
    { pattern: /this resulted in/gi, replacements: ['the outcome was', 'this led to', 'results showed'] },
    { pattern: /due to/gi, replacements: ['because of', 'as a result of', 'stemming from'] }
  ];
  
  let result = content;
  
  // Apply word-level synonym replacements
  for (const [word, synonyms] of Object.entries(synonymMap)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(result)) {
      // Only replace some occurrences to add noise, not complete rewrite
      const matches = result.match(regex) || [];
      for (let i = 0; i < matches.length; i++) {
        if (Math.random() > 0.6) { // 40% chance to replace each occurrence
          const replacement = synonyms[Math.floor(Math.random() * synonyms.length)];
          result = result.replace(new RegExp(`\\b${word}\\b`, 'i'), replacement);
        }
      }
    }
  }
  
  // Apply structure variations
  for (const { pattern, replacements } of structureVariations) {
    if (pattern.test(result) && Math.random() > 0.5) {
      const replacement = replacements[Math.floor(Math.random() * replacements.length)];
      result = result.replace(pattern, replacement);
    }
  }
  
  return result;
}

function normalizePatterns(content: string, removed: string[]): string {
  // Normalize unique phrasing patterns
  let result = content;
  
  // Normalize numbers that could be identifying
  result = result.replace(/\b(\d{3,})\b/g, (match) => {
    const num = parseInt(match);
    if (num > 100) {
      return `[COUNT]`;
    }
    return match;
  });
  
  // Normalize email patterns
  result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[CONTACT]');
  
  // Normalize phone patterns
  result = result.replace(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g, '[CONTACT]');
  
  return result;
}

function calculateContentRiskScore(content: string, removedElements: string[]): number {
  let risk = 0;
  
  // Each removed element adds risk
  risk += removedElements.length * 0.05;
  
  // Check for remaining potentially identifying patterns
  const remainingRiskPatterns = [
    /\bmy\s+(?:name|email|phone|company|site)\b/gi,
    /\bI\s+(?:work|worked|am|was)\s+(?:at|with|for)\b/gi,
    /\bour\s+(?:site|team|company)\b/gi
  ];
  
  for (const pattern of remainingRiskPatterns) {
    if (pattern.test(content)) {
      risk += 0.1;
    }
  }
  
  return Math.min(risk, 1.0);
}

// ==========================================
// 2. CAPABILITY IDENTITY PROTECTION
// ==========================================

/**
 * Convert exact metrics to bands - NEVER expose exact counts
 */
export function convertToBands(metrics: {
  yearsExperience?: number;
  hireCount?: number;
  reliabilityScore?: number;
  qualityScore?: number;
  contributionCount?: number;
}): {
  experienceBand: string;
  hireBand: string;
  reliabilityBand: string;
  qualityBand: string;
  activityLevel: string;
} {
  
  // Experience bands
  let experienceBand: string;
  if (!metrics.yearsExperience || metrics.yearsExperience < 2) {
    experienceBand = 'newcomer';
  } else if (metrics.yearsExperience < 5) {
    experienceBand = 'developing';
  } else if (metrics.yearsExperience < 10) {
    experienceBand = 'experienced';
  } else {
    experienceBand = 'expert';
  }
  
  // Hire bands (NEVER exact counts)
  let hireBand: string;
  if (!metrics.hireCount || metrics.hireCount < 3) {
    hireBand = 'few';
  } else if (metrics.hireCount < 10) {
    hireBand = 'several';
  } else if (metrics.hireCount < 25) {
    hireBand = 'many';
  } else {
    hireBand = 'numerous';
  }
  
  // Reliability bands
  let reliabilityBand: string;
  if (!metrics.reliabilityScore || metrics.reliabilityScore < 0.5) {
    reliabilityBand = 'developing';
  } else if (metrics.reliabilityScore < 0.7) {
    reliabilityBand = 'reliable';
  } else if (metrics.reliabilityScore < 0.85) {
    reliabilityBand = 'highly_reliable';
  } else {
    reliabilityBand = 'proven';
  }
  
  // Quality bands
  let qualityBand: string;
  if (!metrics.qualityScore || metrics.qualityScore < 0.5) {
    qualityBand = 'standard';
  } else if (metrics.qualityScore < 0.7) {
    qualityBand = 'good';
  } else if (metrics.qualityScore < 0.85) {
    qualityBand = 'high';
  } else {
    qualityBand = 'exceptional';
  }
  
  // Activity level
  let activityLevel: string;
  const totalActivity = (metrics.contributionCount || 0) + (metrics.hireCount || 0);
  if (totalActivity < 5) {
    activityLevel = 'emerging';
  } else if (totalActivity < 15) {
    activityLevel = 'active';
  } else if (totalActivity < 50) {
    activityLevel = 'established';
  } else {
    activityLevel = 'prominent';
  }
  
  return {
    experienceBand,
    hireBand,
    reliabilityBand,
    qualityBand,
    activityLevel
  };
}

/**
 * Detect and blur rare combinations that could identify users
 */
export function detectAndBlurRareCombinations(
  capabilities: {
    therapeuticAreas: Record<string, number>;
    trialPhases: Record<string, number>;
    issueExpertise: Record<string, number>;
  }
): {
  therapeuticAreas: Record<string, number>;
  trialPhases: Record<string, number>;
  issueExpertise: Record<string, number>;
  wasBlurred: boolean;
} {
  
  let wasBlurred = false;
  const result = { ...capabilities };
  
  // Check for rare therapeutic area combinations
  const rareAreaCombinations = [
    ['Rare Disease', 'Device'],
    ['Oncology', 'Cardiovascular', 'CNS'], // Unusual to have all three at high level
    ['Pediatrics', 'Geriatrics']
  ];
  
  // If user has a rare combination, blur the least common one
  const areaKeys = Object.keys(result.therapeuticAreas);
  for (const rareCombo of rareAreaCombinations) {
    const matchCount = rareCombo.filter(area => areaKeys.includes(area)).length;
    if (matchCount >= 2) {
      // Remove the lowest scoring one from the rare combo
      const toRemove = rareCombo
        .filter(area => areaKeys.includes(area))
        .sort((a, b) => (result.therapeuticAreas[a] || 0) - (result.therapeuticAreas[b] || 0))[0];
      
      if (toRemove && result.therapeuticAreas[toRemove] < 0.7) {
        delete result.therapeuticAreas[toRemove];
        wasBlurred = true;
      }
    }
  }
  
  // Blur low-confidence unique entries
  for (const [key, value] of Object.entries(result.therapeuticAreas)) {
    if (value < 0.3 && Object.keys(result.therapeuticAreas).length > 1) {
      delete result.therapeuticAreas[key];
      wasBlurred = true;
    }
  }
  
  return {
    ...result,
    wasBlurred
  };
}

// ==========================================
// 3. CROSS-REALM ISOLATION
// ==========================================

/**
 * Generate a completely isolated identifier for the Opportunity Realm
 * This CANNOT be linked back to Intelligence Realm contributions
 */
export function generateIsolatedOpportunityId(userId: string, salt?: string): string {
  // Use one-way hash with rotating salt
  const effectiveSalt = salt || randomBytes(16).toString('hex');
  const input = `${userId}:${effectiveSalt}:opportunity-realm`;
  const hash = createHash('sha256').update(input).digest('hex');
  return `CAP-${hash.substring(0, 8).toUpperCase()}`;
}

/**
 * Verify that a capability identity cannot be traced back to contributions
 * Returns true if properly isolated
 */
export function verifyCrossRealmIsolation(capabilityIdentity: {
  id: string;
  userId?: string;
  profileId: string;
  generatedSummary: string;
}): { isolated: boolean; violations: string[] } {
  
  const violations: string[] = [];
  
  // VIOLATION: userId should NOT be stored
  if (capabilityIdentity.userId) {
    violations.push('CRITICAL: userId is directly stored in CapabilityIdentity');
  }
  
  // VIOLATION: profileId should not be deterministic from userId
  if (capabilityIdentity.profileId && capabilityIdentity.userId) {
    const expectedPrefix = `CAP-${createHash('sha256').update(capabilityIdentity.userId).digest('hex').substring(0, 4).toUpperCase()}`;
    if (capabilityIdentity.profileId.startsWith(expectedPrefix.substring(0, 8))) {
      violations.push('CRITICAL: profileId appears deterministically generated from userId');
    }
  }
  
  // VIOLATION: summary should not contain identifying information
  const identifyingPatterns = [
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/, // Names
    /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Emails
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/ // Phone numbers
  ];
  
  for (const pattern of identifyingPatterns) {
    if (pattern.test(capabilityIdentity.generatedSummary)) {
      violations.push('CRITICAL: Summary contains potentially identifying information');
      break;
    }
  }
  
  return {
    isolated: violations.length === 0,
    violations
  };
}

// ==========================================
// 4. ANTI-CORRELATION ENGINE
// ==========================================

/**
 * Detect correlation attacks
 */
export async function detectCorrelationAttack(params: {
  organizationId: string;
  targetProfileId?: string;
  jobPostingIds: string[];
  recentMatchAttempts: Array<{
    profileId: string;
    timestamp: Date;
    jobId: string;
  }>;
}): Promise<CorrelationRisk> {
  
  const riskFactors: string[] = [];
  let riskLevel: CorrelationRisk['riskLevel'] = 'none';
  
  // 1. Check for repeated targeting of same operator
  if (params.targetProfileId) {
    const targetingCount = params.recentMatchAttempts.filter(
      m => m.profileId === params.targetProfileId
    ).length;
    
    if (targetingCount >= CONFIG.suspiciousMatchThreshold) {
      riskFactors.push(`Same operator targeted ${targetingCount} times recently`);
      riskLevel = 'high';
    }
  }
  
  // 2. Check for pattern triangulation via multiple job posts
  const similarJobs = params.jobPostingIds.length;
  if (similarJobs >= CONFIG.maxSimilarJobPostsPerOrg) {
    riskFactors.push(`Organization has ${similarJobs} similar job postings`);
    riskLevel = riskLevel === 'high' ? 'critical' : 'medium';
  }
  
  // 3. Check for timing correlation
  const now = new Date();
  const recentMatches = params.recentMatchAttempts.filter(
    m => now.getTime() - m.timestamp.getTime() < 60 * 60 * 1000 // 1 hour
  );
  
  if (recentMatches.length >= 5) {
    riskFactors.push(`${recentMatches.length} matches in last hour - potential timing attack`);
    riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
  }
  
  // 4. Check for probing behavior (many unique profiles matched)
  const uniqueProfiles = new Set(params.recentMatchAttempts.map(m => m.profileId));
  if (uniqueProfiles.size >= 20) {
    riskFactors.push(`Organization has matched with ${uniqueProfiles.size} unique profiles`);
    riskLevel = riskLevel === 'critical' ? 'critical' : 'medium';
  }
  
  // Determine recommended action
  let recommendedAction: CorrelationRisk['recommendedAction'] = 'allow';
  if (riskLevel === 'medium') {
    recommendedAction = 'delay';
  } else if (riskLevel === 'high') {
    recommendedAction = 'decoy';
  } else if (riskLevel === 'critical') {
    recommendedAction = 'block';
  }
  
  return {
    riskLevel,
    riskFactors,
    recommendedAction
  };
}

/**
 * Apply correlation defense measures
 */
export async function applyCorrelationDefense(
  organizationId: string,
  risk: CorrelationRisk
): Promise<{
  action: string;
  delayMs?: number;
  decoysInjected?: number;
}> {
  
  switch (risk.recommendedAction) {
    case 'allow':
      return { action: 'allowed' };
    
    case 'delay':
      return {
        action: 'delayed',
        delayMs: randomInt(4, 24) * 60 * 60 * 1000 // 4-24 hours
      };
    
    case 'decoy':
      return {
        action: 'decoys_injected',
        decoysInjected: CONFIG.decoyRatio
      };
    
    case 'block':
      return {
        action: 'blocked',
        delayMs: 48 * 60 * 60 * 1000 // 48 hour cooldown
      };
  }
}

// ==========================================
// 5. NOTIFICATION RANDOMIZATION
// ==========================================

/**
 * Generate randomized notification timing
 */
export function generateNotificationTiming(params: {
  operatorId: string;
  matchId: string;
  batchSize?: number;
}): TimingNoise {
  
  // Random delay between 2-48 hours
  const delayMs = randomInt(
    CONFIG.notificationDelayMinMs,
    CONFIG.notificationDelayMaxMs
  );
  
  // Batch key for grouping notifications
  const batchWindow = Math.floor(Date.now() / CONFIG.batchWindowSizeMs);
  const batchKey = `batch-${batchWindow}-${randomBytes(4).toString('hex')}`;
  
  // Determine if decoy should be injected
  const decoyInjected = Math.random() < (1 / (CONFIG.decoyRatio + 1));
  
  return {
    delayMs,
    batchKey,
    decoyInjected
  };
}

/**
 * Batch notifications for simultaneous delivery
 */
export function batchNotifications(
  notifications: Array<{
    operatorId: string;
    matchId: string;
    scheduledTime: Date;
  }>
): Array<{
  batchKey: string;
  deliveryTime: Date;
  operatorIds: string[];
}> {
  
  // Group by time windows
  const batches = new Map<string, Array<{ operatorId: string; matchId: string }>>();
  
  for (const notification of notifications) {
    const windowKey = Math.floor(notification.scheduledTime.getTime() / CONFIG.batchWindowSizeMs);
    const batchKey = `batch-${windowKey}`;
    
    if (!batches.has(batchKey)) {
      batches.set(batchKey, []);
    }
    batches.get(batchKey)!.push({
      operatorId: notification.operatorId,
      matchId: notification.matchId
    });
  }
  
  // Convert to output format
  return Array.from(batches.entries()).map(([batchKey, items]) => ({
    batchKey,
    deliveryTime: new Date(parseInt(batchKey.split('-')[1]) * CONFIG.batchWindowSizeMs),
    operatorIds: items.map(i => i.operatorId)
  }));
}

// ==========================================
// 6. DECOY INJECTION SYSTEM
// ==========================================

/**
 * Generate synthetic decoy matches
 */
export function generateDecoyMatches(params: {
  count: number;
  jobPostingId: string;
  existingProfileIds: string[];
}): DecoyMatch[] {
  
  const decoys: DecoyMatch[] = [];
  
  for (let i = 0; i < params.count; i++) {
    const decoyId = `DECOY-${randomBytes(8).toString('hex').toUpperCase()}`;
    const profileId = `CAP-${randomBytes(4).toString('hex').toUpperCase()}`;
    
    decoys.push({
      id: decoyId,
      profileId,
      isDecoy: true,
      matchedAt: new Date()
    });
  }
  
  return decoys;
}

/**
 * Mix decoys with real matches
 * Decoys are indistinguishable from real matches to outside observers
 */
export function injectDecoys(
  realMatches: Array<{ profileId: string; matchScore: number }>,
  decoyCount: number,
  jobPostingId: string
): Array<{ profileId: string; matchScore: number; isDecoy: boolean }> {
  
  const existingProfileIds = realMatches.map(m => m.profileId);
  const decoys = generateDecoyMatches({
    count: decoyCount,
    jobPostingId,
    existingProfileIds
  });
  
  // Generate realistic scores for decoys
  const mixed = [
    ...realMatches.map(m => ({ ...m, isDecoy: false })),
    ...decoys.map(d => ({
      profileId: d.profileId,
      matchScore: 0.4 + Math.random() * 0.3, // 40-70% score range
      isDecoy: true
    }))
  ];
  
  // Shuffle to randomize order
  for (let i = mixed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
  }
  
  return mixed;
}

// ==========================================
// 7. MULTI-ACCOUNT ATTACK DEFENSE
// ==========================================

/**
 * Detect organizations creating multiple accounts
 */
export async function detectMultiAccountAttack(params: {
  organizationId: string;
  allOrganizations: Array<{
    id: string;
    createdAt: Date;
    metadata?: {
      ipHash?: string;
      deviceFingerprint?: string;
      emailDomain?: string;
    };
  }>;
  jobPostings: Array<{
    organizationId: string;
    title: string;
    description: string;
    therapeuticArea: string;
    trialPhase: string;
  }>;
}): Promise<{
  detected: boolean;
  confidence: number;
  linkedAccounts: string[];
  indicators: string[];
}> {
  
  const indicators: string[] = [];
  const linkedAccounts: string[] = [];
  let confidence = 0;
  
  const targetOrg = params.allOrganizations.find(o => o.id === params.organizationId);
  if (!targetOrg) {
    return { detected: false, confidence: 0, linkedAccounts: [], indicators: [] };
  }
  
  // 1. Check for similar metadata (IP, device, domain)
  for (const org of params.allOrganizations) {
    if (org.id === params.organizationId) continue;
    
    const metaMatches: string[] = [];
    
    if (targetOrg.metadata?.ipHash && org.metadata?.ipHash === targetOrg.metadata.ipHash) {
      metaMatches.push('IP match');
    }
    
    if (targetOrg.metadata?.deviceFingerprint && org.metadata?.deviceFingerprint === targetOrg.metadata.deviceFingerprint) {
      metaMatches.push('Device match');
    }
    
    if (targetOrg.metadata?.emailDomain && org.metadata?.emailDomain === targetOrg.metadata.emailDomain) {
      metaMatches.push('Domain match');
    }
    
    if (metaMatches.length > 0) {
      linkedAccounts.push(org.id);
      indicators.push(`Account ${org.id}: ${metaMatches.join(', ')}`);
      confidence += 0.3;
    }
  }
  
  // 2. Check for similar job posting patterns
  const targetJobs = params.jobPostings.filter(j => j.organizationId === params.organizationId);
  
  for (const orgId of linkedAccounts.length > 0 ? linkedAccounts : params.allOrganizations.map(o => o.id)) {
    if (orgId === params.organizationId) continue;
    
    const orgJobs = params.jobPostings.filter(j => j.organizationId === orgId);
    
    for (const targetJob of targetJobs) {
      for (const orgJob of orgJobs) {
        const similarity = calculateJobSimilarity(targetJob, orgJob);
        if (similarity > 0.8) {
          if (!linkedAccounts.includes(orgId)) {
            linkedAccounts.push(orgId);
          }
          indicators.push(`Very similar job postings detected (${Math.round(similarity * 100)}% match)`);
          confidence += 0.2;
        }
      }
    }
  }
  
  const detected = linkedAccounts.length > 0;
  
  return {
    detected,
    confidence: Math.min(confidence, 1.0),
    linkedAccounts,
    indicators
  };
}

function calculateJobSimilarity(job1: any, job2: any): number {
  let score = 0;
  
  // Title similarity
  const titleWords1 = new Set(job1.title.toLowerCase().split(/\s+/));
  const titleWords2 = new Set(job2.title.toLowerCase().split(/\s+/));
  const titleOverlap = [...titleWords1].filter(w => titleWords2.has(w)).length / Math.max(titleWords1.size, titleWords2.size);
  score += titleOverlap * 0.4;
  
  // Therapeutic area match
  if (job1.therapeuticArea === job2.therapeuticArea) {
    score += 0.3;
  }
  
  // Trial phase match
  if (job1.trialPhase === job2.trialPhase) {
    score += 0.2;
  }
  
  // Description similarity (basic)
  const desc1 = job1.description?.toLowerCase() || '';
  const desc2 = job2.description?.toLowerCase() || '';
  const uniqueWords1 = new Set<string>(desc1.split(/\s+/).filter((w: string) => w.length > 4));
  const uniqueWords2 = new Set<string>(desc2.split(/\s+/).filter((w: string) => w.length > 4));
  if (uniqueWords1.size > 0 && uniqueWords2.size > 0) {
    const descOverlap = [...uniqueWords1].filter((w: string) => uniqueWords2.has(w)).length / Math.max(uniqueWords1.size, uniqueWords2.size);
    score += descOverlap * 0.1;
  }
  
  return score;
}

/**
 * Apply multi-account defense measures
 */
export function applyMultiAccountDefense(params: {
  organizationId: string;
  linkedAccounts: string[];
  confidence: number;
}): {
  throttled: boolean;
  noiseLevel: number;
  matchVisibility: number;
  blocked: boolean;
} {
  
  const { confidence, linkedAccounts } = params;
  
  if (confidence >= 0.9 && linkedAccounts.length >= 3) {
    // High confidence multi-account attack
    return {
      throttled: true,
      noiseLevel: 0.5, // 50% noise
      matchVisibility: 0.3, // Only 30% of matches visible
      blocked: false
    };
  }
  
  if (confidence >= 0.7) {
    // Medium confidence
    return {
      throttled: true,
      noiseLevel: 0.3,
      matchVisibility: 0.5,
      blocked: false
    };
  }
  
  if (confidence >= 0.4) {
    // Low confidence, monitoring
    return {
      throttled: false,
      noiseLevel: 0.15,
      matchVisibility: 0.8,
      blocked: false
    };
  }
  
  // No significant concern
  return {
    throttled: false,
    noiseLevel: 0,
    matchVisibility: 1.0,
    blocked: false
  };
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  // Contribution protection
  sanitizeContribution,
  
  // Capability identity protection
  convertToBands,
  detectAndBlurRareCombinations,
  
  // Cross-realm isolation
  generateIsolatedOpportunityId,
  verifyCrossRealmIsolation,
  
  // Anti-correlation
  detectCorrelationAttack,
  applyCorrelationDefense,
  
  // Notification randomization
  generateNotificationTiming,
  batchNotifications,
  
  // Decoy system
  generateDecoyMatches,
  injectDecoys,
  
  // Multi-account defense
  detectMultiAccountAttack,
  applyMultiAccountDefense,
  
  // Config
  CONFIG
};