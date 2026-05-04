/**
 * SECTION 3: Full Hiring Loop
 * 
 * Complete lifecycle: Match → Interest → Interview → Hire → Outcome → Fee
 * Mandatory fee tracking and outcome feedback
 */

import { createHash, randomUUID } from 'crypto';
import { generateSecureLookupKey } from './capability-identity-secure';
import { 
  onMatchCreated, 
  onInterestExpressed, 
  onInterviewRequested, 
  onHired, 
  onHireCompleted 
} from './return-engine/integration';

// ==========================================
// TYPES
// ==========================================

/**
 * Hiring lifecycle stages
 */
export type HiringStage = 
  | 'MATCHED'
  | 'INTEREST_EXPRESSED'
  | 'INTERVIEW_REQUESTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_COMPLETED'
  | 'HIRED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Match record with full lifecycle
 */
export interface MatchRecord {
  id: string;
  operatorId: string;          // Hashed
  organizationId: string;
  jobPostingId: string;
  matchScore: number;
  matchReasoning: string;
  stage: HiringStage;
  createdAt: Date;
  
  // Lifecycle timestamps
  interestExpressedAt?: Date;
  interviewRequestedAt?: Date;
  interviewScheduledAt?: Date;
  interviewCompletedAt?: Date;
  hiredAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Financial data
  contractValue?: number;
  feeAmount?: number;
  feeStatus: FeeStatus;
  
  // Outcome
  outcome?: HireOutcome;
}

/**
 * Interest expression from operator
 */
export interface InterestExpression {
  id: string;
  matchId: string;
  operatorId: string;          // Hashed
  organizationId: string;
  expressedAt: Date;
  message?: string;            // Optional message (sanitized)
  status: 'PENDING' | 'VIEWED' | 'INTERVIEW_REQUESTED' | 'DECLINED';
}

/**
 * Interview request from organization
 */
export interface InterviewRequest {
  id: string;
  matchId: string;
  interestId: string;
  organizationId: string;
  operatorProxyId: string;     // Proxy ID for anonymity
  requestedAt: Date;
  proposedTimes: Date[];
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  scheduledTime?: Date;
  interviewType: 'VIDEO' | 'PHONE' | 'IN_PERSON';
}

/**
 * Hire confirmation
 */
export interface HireConfirmation {
  id: string;
  matchId: string;
  organizationId: string;
  operatorId: string;          // Hashed
  confirmedAt: Date;
  contractValue: number;
  feeAmount: number;           // 25% of contract value
  feeStatus: FeeStatus;
  startDate: Date;
  estimatedDuration: number;   // weeks
}

/**
 * Fee status tracking
 */
export type FeeStatus = 'PENDING' | 'CONFIRMED' | 'INVOICED' | 'PAID' | 'WAIVED';

/**
 * Fee record
 */
export interface FeeRecord {
  id: string;
  hireId: string;
  organizationId: string;
  operatorId: string;          // Hashed
  amount: number;
  percentage: number;          // Always 25%
  contractValue: number;
  status: FeeStatus;
  createdAt: Date;
  confirmedAt?: Date;
  paidAt?: Date;
  invoiceNumber?: string;
}

/**
 * Hire outcome
 */
export interface HireOutcome {
  id: string;
  hireId: string;
  operatorId: string;          // Hashed
  organizationId: string;
  
  // Outcome data
  completedAt: Date;
  successful: boolean;
  durationWeeks: number;
  
  // Ratings (private, feeds TrustVector)
  operatorRating?: number;     // 1-5
  organizationRating?: number; // 1-5
  
  // Outcome details
  outcomeType: 'SUCCESS' | 'PARTIAL' | 'EARLY_TERMINATION' | 'FAILURE';
  wouldRehire?: boolean;
  wouldWorkAgain?: boolean;
  
  // Feedback
  operatorFeedback?: string;
  organizationFeedback?: string;
  
  // Impact on TrustVector
  trustImpact: {
    reliability: number;       // -0.1 to +0.1
    quality: number;
    outcome: number;
  };
}

/**
 * Platform fee configuration
 */
const PLATFORM_FEE_PERCENTAGE = 0.25;  // 25%

// ==========================================
// INTEREST API
// ==========================================

/**
 * Express interest in a match
 */
export function expressInterest(params: {
  matchId: string;
  operatorId: string;
  organizationId: string;
  message?: string;
}): InterestExpression {
  return {
    id: randomUUID(),
    matchId: params.matchId,
    operatorId: generateSecureLookupKey(params.operatorId),
    organizationId: params.organizationId,
    expressedAt: new Date(),
    message: params.message ? sanitizeMessage(params.message) : undefined,
    status: 'PENDING'
  };
}

/**
 * Sanitize operator message
 */
function sanitizeMessage(message: string): string {
  // Remove any identifying information
  let sanitized = message;
  
  // Remove email patterns
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[CONTACT]');
  
  // Remove phone patterns
  sanitized = sanitized.replace(/[\d-+\s()]{10,}/g, '[CONTACT]');
  
  // Limit length
  return sanitized.substring(0, 500);
}

// ==========================================
// INTERVIEW REQUEST API
// ==========================================

/**
 * Request an interview
 */
export function requestInterview(params: {
  matchId: string;
  interestId: string;
  organizationId: string;
  proposedTimes: Date[];
  interviewType: 'VIDEO' | 'PHONE' | 'IN_PERSON';
}): InterviewRequest {
  // Generate proxy ID for anonymity
  const operatorProxyId = generateOperatorProxyId(params.matchId);
  
  return {
    id: randomUUID(),
    matchId: params.matchId,
    interestId: params.interestId,
    organizationId: params.organizationId,
    operatorProxyId,
    requestedAt: new Date(),
    proposedTimes: params.proposedTimes,
    status: 'PENDING',
    interviewType: params.interviewType
  };
}

/**
 * Generate anonymous proxy ID for operator in interview context
 */
function generateOperatorProxyId(matchId: string): string {
  const salt = process.env.PROXY_SALT || 'btp-proxy-salt-2024';
  return createHash('sha256')
    .update(`${matchId}:${salt}:proxy`)
    .digest('hex')
    .substring(0, 16);
}

// ==========================================
// HIRE CONFIRMATION API
// ==========================================

/**
 * Confirm a hire and calculate fees
 */
export function confirmHire(params: {
  matchId: string;
  organizationId: string;
  operatorId: string;
  contractValue: number;
  startDate: Date;
  estimatedDurationWeeks: number;
}): { confirmation: HireConfirmation; feeRecord: FeeRecord } {
  const feeAmount = Math.round(params.contractValue * PLATFORM_FEE_PERCENTAGE);
  
  const confirmation: HireConfirmation = {
    id: randomUUID(),
    matchId: params.matchId,
    organizationId: params.organizationId,
    operatorId: generateSecureLookupKey(params.operatorId),
    confirmedAt: new Date(),
    contractValue: params.contractValue,
    feeAmount,
    feeStatus: 'PENDING',
    startDate: params.startDate,
    estimatedDuration: params.estimatedDurationWeeks
  };
  
  const feeRecord: FeeRecord = {
    id: randomUUID(),
    hireId: confirmation.id,
    organizationId: params.organizationId,
    operatorId: confirmation.operatorId,
    amount: feeAmount,
    percentage: PLATFORM_FEE_PERCENTAGE * 100,
    contractValue: params.contractValue,
    status: 'PENDING',
    createdAt: new Date()
  };
  
  return { confirmation, feeRecord };
}

// ==========================================
// FEE ENGINE
// ==========================================

/**
 * Update fee status
 */
export function updateFeeStatus(params: {
  feeRecord: FeeRecord;
  newStatus: FeeStatus;
  invoiceNumber?: string;
}): FeeRecord {
  const updated = { ...params.feeRecord };
  updated.status = params.newStatus;
  
  if (params.newStatus === 'CONFIRMED') {
    updated.confirmedAt = new Date();
  }
  
  if (params.newStatus === 'PAID') {
    updated.paidAt = new Date();
  }
  
  if (params.invoiceNumber) {
    updated.invoiceNumber = params.invoiceNumber;
  }
  
  return updated;
}

/**
 * Calculate platform fee
 */
export function calculatePlatformFee(contractValue: number): number {
  return Math.round(contractValue * PLATFORM_FEE_PERCENTAGE);
}

/**
 * Generate fee summary for organization
 */
export interface FeeSummary {
  totalPending: number;
  totalConfirmed: number;
  totalPaid: number;
  pendingCount: number;
  confirmedCount: number;
  paidCount: number;
  upcomingInvoiceTotal: number;
}

export function generateFeeSummary(feeRecords: FeeRecord[]): FeeSummary {
  const pending = feeRecords.filter(f => f.status === 'PENDING');
  const confirmed = feeRecords.filter(f => f.status === 'CONFIRMED');
  const paid = feeRecords.filter(f => f.status === 'PAID');
  
  return {
    totalPending: pending.reduce((sum, f) => sum + f.amount, 0),
    totalConfirmed: confirmed.reduce((sum, f) => sum + f.amount, 0),
    totalPaid: paid.reduce((sum, f) => sum + f.amount, 0),
    pendingCount: pending.length,
    confirmedCount: confirmed.length,
    paidCount: paid.length,
    upcomingInvoiceTotal: pending.reduce((sum, f) => sum + f.amount, 0) + 
                          confirmed.reduce((sum, f) => sum + f.amount, 0)
  };
}

// ==========================================
// OUTCOME FEEDBACK
// ==========================================

/**
 * Submit hire outcome
 * REQUIRED after hire completion
 */
export function submitOutcome(params: {
  hireId: string;
  operatorId: string;
  organizationId: string;
  successful: boolean;
  durationWeeks: number;
  outcomeType: HireOutcome['outcomeType'];
  operatorRating?: number;
  organizationRating?: number;
  wouldRehire?: boolean;
  wouldWorkAgain?: boolean;
  operatorFeedback?: string;
  organizationFeedback?: string;
}): HireOutcome {
  // Calculate trust impact
  const trustImpact = calculateTrustImpact(
    params.successful,
    params.outcomeType,
    params.operatorRating,
    params.organizationRating
  );
  
  return {
    id: randomUUID(),
    hireId: params.hireId,
    operatorId: generateSecureLookupKey(params.operatorId),
    organizationId: params.organizationId,
    completedAt: new Date(),
    successful: params.successful,
    durationWeeks: params.durationWeeks,
    operatorRating: params.operatorRating,
    organizationRating: params.organizationRating,
    outcomeType: params.outcomeType,
    wouldRehire: params.wouldRehire,
    wouldWorkAgain: params.wouldWorkAgain,
    operatorFeedback: params.operatorFeedback,
    organizationFeedback: params.organizationFeedback,
    trustImpact
  };
}

/**
 * Calculate impact on TrustVector
 */
function calculateTrustImpact(
  successful: boolean,
  outcomeType: HireOutcome['outcomeType'],
  operatorRating?: number,
  organizationRating?: number
): HireOutcome['trustImpact'] {
  let reliabilityImpact = 0;
  let qualityImpact = 0;
  let outcomeImpact = 0;
  
  // Base impact from outcome type
  if (outcomeType === 'SUCCESS') {
    reliabilityImpact = 0.05;
    qualityImpact = 0.05;
    outcomeImpact = 0.08;
  } else if (outcomeType === 'PARTIAL') {
    reliabilityImpact = 0.02;
    qualityImpact = 0.02;
    outcomeImpact = 0.03;
  } else if (outcomeType === 'EARLY_TERMINATION') {
    reliabilityImpact = -0.05;
    qualityImpact = -0.02;
    outcomeImpact = -0.05;
  } else if (outcomeType === 'FAILURE') {
    reliabilityImpact = -0.08;
    qualityImpact = -0.05;
    outcomeImpact = -0.10;
  }
  
  // Adjust based on ratings
  if (operatorRating) {
    const ratingAdjustment = (operatorRating - 3) / 20;  // -0.1 to +0.1
    qualityImpact += ratingAdjustment;
  }
  
  // Clamp to valid range
  return {
    reliability: Math.max(-0.1, Math.min(0.1, reliabilityImpact)),
    quality: Math.max(-0.1, Math.min(0.1, qualityImpact)),
    outcome: Math.max(-0.1, Math.min(0.1, outcomeImpact))
  };
}

// ==========================================
// HIRING LIFECYCLE MANAGEMENT
// ==========================================

/**
 * Advance match to next stage
 */
export function advanceMatchStage(params: {
  match: MatchRecord;
  newStage: HiringStage;
  metadata?: Partial<MatchRecord>;
}): MatchRecord {
  const updated = { ...params.match };
  const previousStage = updated.stage;
  updated.stage = params.newStage;
  
  // Set timestamps based on stage
  switch (params.newStage) {
    case 'INTEREST_EXPRESSED':
      updated.interestExpressedAt = new Date();
      break;
    case 'INTERVIEW_REQUESTED':
      updated.interviewRequestedAt = new Date();
      break;
    case 'INTERVIEW_SCHEDULED':
      updated.interviewScheduledAt = new Date();
      break;
    case 'INTERVIEW_COMPLETED':
      updated.interviewCompletedAt = new Date();
      break;
    case 'HIRED':
      updated.hiredAt = new Date();
      break;
    case 'COMPLETED':
      updated.completedAt = new Date();
      break;
    case 'CANCELLED':
      updated.cancelledAt = new Date();
      break;
  }
  
  // Apply any additional metadata
  if (params.metadata) {
    Object.assign(updated, params.metadata);
  }
  
  // Fire Return Engine triggers for stage transitions
  fireHiringTrigger(updated, previousStage);
  
  return updated;
}

/**
 * Fire Return Engine triggers based on hiring stage transition
 */
function fireHiringTrigger(match: MatchRecord, previousStage: HiringStage): void {
  // Don't fire for initial MATCHED stage
  if (previousStage === match.stage) return;
  
  switch (match.stage) {
    case 'INTEREST_EXPRESSED':
      onInterestExpressed({
        matchId: match.id,
        operatorId: match.operatorId
      }).catch(err => console.error('Return Engine trigger error:', err));
      break;
      
    case 'INTERVIEW_REQUESTED':
      onInterviewRequested({
        matchId: match.id,
        operatorId: match.operatorId
      }).catch(err => console.error('Return Engine trigger error:', err));
      break;
      
    case 'HIRED':
      onHired({
        matchId: match.id,
        operatorId: match.operatorId,
        organizationId: match.organizationId
      }).catch(err => console.error('Return Engine trigger error:', err));
      break;
  }
}

/**
 * Create a new match and fire trigger
 */
export function createMatch(params: {
  operatorId: string;
  organizationId: string;
  jobPostingId: string;
  matchScore: number;
  matchReasoning: string;
}): MatchRecord {
  const match: MatchRecord = {
    id: randomUUID(),
    operatorId: generateSecureLookupKey(params.operatorId),
    organizationId: params.organizationId,
    jobPostingId: params.jobPostingId,
    matchScore: params.matchScore,
    matchReasoning: params.matchReasoning,
    stage: 'MATCHED',
    createdAt: new Date(),
    feeStatus: 'PENDING'
  };
  
  // Fire match created trigger
  onMatchCreated({
    matchId: match.id,
    operatorId: params.operatorId,
    organizationId: params.organizationId,
    matchScore: params.matchScore
  }).catch(err => console.error('Return Engine trigger error:', err));
  
  return match;
}

/**
 * Submit hire outcome and fire trigger
 */
export function submitOutcomeWithTrigger(params: {
  hireId: string;
  operatorId: string;
  organizationId: string;
  successful: boolean;
  durationWeeks: number;
  outcomeType: HireOutcome['outcomeType'];
  operatorRating?: number;
  organizationRating?: number;
  wouldRehire?: boolean;
  wouldWorkAgain?: boolean;
  operatorFeedback?: string;
  organizationFeedback?: string;
}): HireOutcome {
  const outcome = submitOutcome(params);
  
  // Fire hire completed trigger
  onHireCompleted({
    matchId: params.hireId,
    operatorId: params.operatorId,
    organizationId: params.organizationId,
    wasSuccessful: params.successful,
    wouldRehire: params.wouldRehire
  }).catch(err => console.error('Return Engine trigger error:', err));
  
  return outcome;
}

/**
 * Get matches by stage for an organization
 */
export function getMatchesByStage(
  matches: MatchRecord[],
  stage: HiringStage
): MatchRecord[] {
  return matches.filter(m => m.stage === stage);
}

/**
 * Calculate time metrics for hiring
 */
export function calculateHiringMetrics(matches: MatchRecord[]): {
  avgTimeToInterest: number;
  avgTimeToInterview: number;
  avgTimeToHire: number;
  conversionRate: number;
  completionRate: number;
} {
  const completed = matches.filter(m => m.hiredAt && m.interestExpressedAt);
  const hired = matches.filter(m => m.stage === 'HIRED' || m.stage === 'ACTIVE' || m.stage === 'COMPLETED');
  
  let totalTimeToInterest = 0;
  let totalTimeToInterview = 0;
  let totalTimeToHire = 0;
  
  completed.forEach(m => {
    if (m.interestExpressedAt) {
      totalTimeToInterest += m.interestExpressedAt.getTime() - m.createdAt.getTime();
    }
    if (m.interviewRequestedAt && m.interestExpressedAt) {
      totalTimeToInterview += m.interviewRequestedAt.getTime() - m.interestExpressedAt.getTime();
    }
    if (m.hiredAt && m.interviewRequestedAt) {
      totalTimeToHire += m.hiredAt.getTime() - m.interviewRequestedAt.getTime();
    }
  });
  
  const count = completed.length || 1;
  
  return {
    avgTimeToInterest: totalTimeToInterest / count / (1000 * 60 * 60),  // hours
    avgTimeToInterview: totalTimeToInterview / count / (1000 * 60 * 60),
    avgTimeToHire: totalTimeToHire / count / (1000 * 60 * 60),
    conversionRate: matches.length > 0 ? hired.length / matches.length : 0,
    completionRate: matches.length > 0 
      ? matches.filter(m => m.stage === 'COMPLETED').length / matches.length 
      : 0
  };
}

// ==========================================
// EXPORTS
// ==========================================

export const HiringLoopEngine = {
  expressInterest,
  requestInterview,
  confirmHire,
  updateFeeStatus,
  calculatePlatformFee,
  generateFeeSummary,
  submitOutcome,
  submitOutcomeWithTrigger,
  advanceMatchStage,
  createMatch,
  getMatchesByStage,
  calculateHiringMetrics
};