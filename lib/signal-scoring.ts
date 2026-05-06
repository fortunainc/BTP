/**
 * Signal Scoring System
 * 
 * Core algorithm for calculating signal quality scores.
 * SS = (C × 0.25) + (S × 0.25) + (I × 0.20) + (R × 0.20) + (Conf × 0.10)
 */

export interface SignalData {
  title: string;
  description: string;
  issueCategory: string;
  urgencyLevel: string;
  trialPhase: string;
  therapeuticArea: string;
  siteCountRange: string;
  geographicScope: string;
  resolutionStatus: string;
  outcomeData?: string | null;
}

export interface SignalScore {
  total: number;
  completeness: number;
  specificity: number;
  impact: number;
  repeatability: number;
  confidence: number;
}

/**
 * Calculate completeness score (0-100)
 * Based on how many required fields are filled
 */
export function calculateCompleteness(signal: Partial<SignalData>): number {
  const requiredFields: (keyof SignalData)[] = [
    'title',
    'description',
    'issueCategory',
    'urgencyLevel',
    'trialPhase',
    'therapeuticArea',
    'siteCountRange',
    'geographicScope',
    'resolutionStatus',
  ];

  let filledCount = 0;
  requiredFields.forEach((field) => {
    if (signal[field] && signal[field]!.trim() !== '') {
      filledCount++;
    }
  });

  let score = (filledCount / requiredFields.length) * 100;

  // Bonus for providing outcome data
  if (signal.outcomeData && signal.outcomeData.trim() !== '') {
    score = Math.min(100, score + 10);
  }

  return Math.round(score);
}

/**
 * Calculate specificity score (0-100)
 * Based on use of specific terminology, quantifiable metrics, clear timeline
 */
export function calculateSpecificity(signal: SignalData): number {
  let score = 0;

  // Check for specific terminology (industry-specific terms)
  const specificTerms = [
    'protocol', 'enrollment', 'randomization', 'adverse event', 'SAE',
    'query', 'monitoring', 'CRC', 'CRA', 'PI', 'IRB', 'EC',
    'IND', 'NDA', 'GCP', 'ICF', 'eCRF', 'EDC', 'CTMS',
    'start-up', 'close-out', 'activation', 'screen failure',
    'retention', 'compliance', 'deviation', 'amendment'
  ];

  const textToAnalyze = `${signal.title} ${signal.description}`.toLowerCase();
  const termsFound = specificTerms.filter(term => 
    textToAnalyze.includes(term.toLowerCase())
  );
  score += Math.min(30, termsFound.length * 5);

  // Check for quantifiable metrics (numbers, percentages, timeframes)
  const numberPatterns = [
    /\d+%\s*(enrollment|retention|completion|increase|decrease)/i,
    /\d+\s*(patients|subjects|sites|months|weeks|days)/i,
    /\$[\d,]+/i,
    /\d+\s*(mg|ml|units)/i
  ];

  const hasNumbers = numberPatterns.some(pattern => 
    pattern.test(signal.description)
  );
  if (hasNumbers) {
    score += 40;
  }

  // Check for timeline references
  const timelinePatterns = [
    /within\s+\d+/i,
    /after\s+\d+/i,
    /before\s+\d+/i,
    /by\s+(q[1-4]|end of|month|week)/i,
    /timeline|deadline|milestone/i
  ];

  const hasTimeline = timelinePatterns.some(pattern => 
    pattern.test(signal.description)
  );
  if (hasTimeline) {
    score += 30;
  }

  return Math.min(100, score);
}

/**
 * Calculate impact score (0-100)
 * Based on urgency level
 */
export function calculateImpact(signal: SignalData): number {
  const urgencyScores: Record<string, number> = {
    'Critical': 100,
    'Urgent': 75,
    'Needs Advice': 50,
    'Normal': 25,
  };

  return urgencyScores[signal.urgencyLevel] || 25;
}

/**
 * Calculate repeatability score (0-100)
 * Higher score if similar signals exist (pattern detected)
 */
export function calculateRepeatability(
  signal: SignalData, 
  similarSignalsCount: number = 0
): number {
  if (similarSignalsCount >= 3) {
    return 80; // Pattern confirmed
  } else if (similarSignalsCount >= 1) {
    return 60; // Similar context match
  }
  return 40; // Unique situation (still valuable, but less repeatable)
}

/**
 * Calculate confidence score (0-100)
 * Based on user verification status, endorsements, resolution matching
 */
export function calculateConfidence(
  isUserVerified: boolean,
  endorsementCount: number = 0,
  hasResolution: boolean = false
): number {
  let score = 0;

  // User is verified
  if (isUserVerified) {
    score += 30;
  }

  // Multiple endorsements
  if (endorsementCount >= 3) {
    score += 40;
  } else if (endorsementCount >= 1) {
    score += 20;
  }

  // Has resolution
  if (hasResolution) {
    score += 30;
  }

  return Math.min(100, score);
}

/**
 * Calculate total signal score
 */
export function calculateSignalScore(
  signal: SignalData,
  options: {
    similarSignalsCount?: number;
    isUserVerified?: boolean;
    endorsementCount?: number;
  } = {}
): SignalScore {
  const completeness = calculateCompleteness(signal);
  const specificity = calculateSpecificity(signal);
  const impact = calculateImpact(signal);
  const repeatability = calculateRepeatability(
    signal, 
    options.similarSignalsCount || 0
  );
  const confidence = calculateConfidence(
    options.isUserVerified || false,
    options.endorsementCount || 0,
    signal.resolutionStatus === 'Resolved' || signal.resolutionStatus === 'Avoided'
  );

  // Weighted total
  const total = 
    (completeness * 0.25) +
    (specificity * 0.25) +
    (impact * 0.20) +
    (repeatability * 0.20) +
    (confidence * 0.10);

  return {
    total: Math.round(total * 10) / 10,
    completeness,
    specificity,
    impact,
    repeatability,
    confidence,
  };
}

/**
 * Determine access tier from signal score
 */
export function determineTier(signalScore: number): number {
  if (signalScore >= 90) return 4;
  if (signalScore >= 75) return 3;
  if (signalScore >= 50) return 2;
  if (signalScore >= 25) return 1;
  return 0;
}

/**
 * Get tier name
 */
export function getTierName(tier: number): string {
  const names: Record<number, string> = {
    0: 'Observer',
    1: 'Contributor',
    2: 'Trusted',
    3: 'Expert',
    4: 'Authority',
  };
  return names[tier] || 'Observer';
}

/**
 * Get tier benefits description
 */
export function getTierBenefits(tier: number): string[] {
  const benefits: Record<number, string[]> = {
    0: ['Submit signals', 'View own data'],
    1: ['View Tier 1 jobs', 'Basic opportunity matching'],
    2: ['View Tier 1-2 jobs', 'Advanced matching', 'Pattern insights'],
    3: ['View Tier 1-3 jobs', 'Priority matching', 'Early access opportunities'],
    4: ['Full marketplace access', 'Exclusive opportunities', 'Direct introductions'],
  };
  return benefits[tier] || benefits[0];
}

/**
 * Calculate progress to next tier
 */
export function getTierProgress(signalScore: number): {
  currentTier: number;
  nextTier: number | null;
  progress: number;
  pointsNeeded: number;
} {
  const currentTier = determineTier(signalScore);
  
  if (currentTier === 4) {
    return {
      currentTier,
      nextTier: null,
      progress: 100,
      pointsNeeded: 0,
    };
  }

  const tierThresholds = [0, 25, 50, 75, 90];
  const nextTierThreshold = tierThresholds[currentTier + 1];
  const currentThreshold = tierThresholds[currentTier];
  
  const progress = ((signalScore - currentThreshold) / (nextTierThreshold - currentThreshold)) * 100;
  const pointsNeeded = nextTierThreshold - signalScore;

  return {
    currentTier,
    nextTier: currentTier + 1,
    progress: Math.min(100, Math.max(0, progress)),
    pointsNeeded: Math.max(0, pointsNeeded),
  };
}