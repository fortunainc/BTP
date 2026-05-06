/**
 * BTP Analytics Event Tracker
 * 
 * Privacy-first analytics tracking system.
 * All events use anonymized user IDs and date buckets.
 * 
 * CRITICAL: Never expose real user identities in analytics.
 * CRITICAL: All events must have a dataSource field (REAL, SEEDED, TEST, IMPORTED).
 */

import { prisma } from './prisma';

// Data source types - CRITICAL for separating real vs test data
export type DataSource = 'REAL' | 'SEEDED' | 'TEST' | 'IMPORTED';

// Event types for each category - COMPREHENSIVE LIST
export const EVENT_TYPES = {
  // User events
  USER: {
    SIGNUP_STARTED: 'signup_started',
    SIGNUP_COMPLETED: 'signup_completed',
    ONBOARDING_STARTED: 'onboarding_started',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    LOGIN: 'login',
    SESSION_STARTED: 'session_started',
    PROFILE_COMPLETED: 'profile_completed',
  },
  
  // Situation/Contribution events
  SITUATION: {
    SITUATION_STARTED: 'situation_started',
    SITUATION_SUBMITTED: 'situation_submitted',
    IMMEDIATE_FEEDBACK_VIEWED: 'immediate_feedback_viewed',
    SECOND_SITUATION_SUBMITTED: 'second_situation_submitted',
    SITUATION_REDACTED: 'situation_redacted',
    SITUATION_STRUCTURED: 'situation_structured',
    AI_EXTRACTION_COMPLETED: 'ai_extraction_completed',
    AI_EXTRACTION_LOW_CONFIDENCE: 'ai_extraction_low_confidence',
    SITUATION_FLAGGED_HIGH_RISK: 'situation_flagged_high_risk',
    REFLECTION_SCHEDULED: 'reflection_scheduled',
    REFLECTION_GENERATED: 'reflection_generated',
    REFLECTION_OPENED: 'reflection_opened',
  },
  
  // Engagement events
  ENGAGEMENT: {
    SITUATION_VIEWED: 'situation_viewed',
    INTERACTION_CLICKED: 'interaction_clicked',
    CONTEXT_ADDED: 'context_added',
    PATTERN_VIEWED: 'pattern_viewed',
    NOTIFICATION_SENT: 'notification_sent',
    NOTIFICATION_OPENED: 'notification_opened',
    NOTIFICATION_CLICKED: 'notification_clicked',
  },
  
  // Micro-opportunity events
  MICRO_OPPORTUNITY: {
    MICRO_OPPORTUNITY_CREATED: 'micro_opportunity_created',
    OPERATOR_INVITED: 'operator_invited',
    OPERATOR_VIEWED_MICRO_OPPORTUNITY: 'operator_viewed_micro_opportunity',
    OPERATOR_INTERESTED: 'operator_interested',
    BUYER_INVITED: 'buyer_invited',
    BUYER_INTERESTED: 'buyer_interested',
    CONSULT_SCHEDULED: 'consult_scheduled',
    CONSULT_COMPLETED: 'consult_completed',
    PAYOUT_RECORDED: 'payout_recorded',
    PLATFORM_FEE_RECORDED: 'platform_fee_recorded',
  },
  
  // Marketplace events
  MARKETPLACE: {
    ORGANIZATION_ONBOARDED: 'organization_onboarded',
    OPPORTUNITY_POSTED: 'opportunity_posted',
    MATCH_CREATED: 'match_created',
    MATCH_VIEWED: 'match_viewed',
    OPERATOR_INTEREST_EXPRESSED: 'operator_interest_expressed',
    ORGANIZATION_INTEREST_EXPRESSED: 'organization_interest_expressed',
    MUTUAL_INTEREST_CREATED: 'mutual_interest_created',
    CONNECTION_UNLOCKED: 'connection_unlocked',
    HIRE_CONFIRMED: 'hire_confirmed',
    CONTRACT_VALUE_ENTERED: 'contract_value_entered',
    FEE_RECORD_CREATED: 'fee_record_created',
    INVOICE_STATUS_UPDATED: 'invoice_status_updated',
    OUTCOME_SUBMITTED: 'outcome_submitted',
  },
  
  // Safety events
  SAFETY: {
    REDACTION_APPLIED: 'redaction_applied',
    HIGH_RISK_CONTENT_DETECTED: 'high_risk_content_detected',
    CONTENT_FLAGGED: 'content_flagged',
    SUSPICIOUS_ORG_BEHAVIOR: 'suspicious_org_behavior',
    FAKE_JOB_PROBE_DETECTED: 'fake_job_probe_detected',
    TRUST_SAFETY_INVESTIGATION_OPENED: 'trust_safety_investigation_opened',
    IDENTITY_LOOKUP_PERFORMED: 'identity_lookup_performed',
  },
  
  // Translation Engine events (Section 13)
  TRANSLATION_ENGINE: {
    SIGNAL_EXTRACTED: 'signal_extracted',
    SUPPRESSED_SIGNAL_DETECTED: 'suppressed_signal_detected',
    EMOTIONAL_SIGNAL_DETECTED: 'emotional_signal_detected',
    WORKAROUND_DETECTED: 'workaround_detected',
    SYSTEM_MISMATCH_DETECTED: 'system_mismatch_detected',
    INVISIBLE_WORK_DETECTED: 'invisible_work_detected',
    SQS_HIGH: 'sqs_high',
    SQS_MEDIUM: 'sqs_medium',
    SQS_LOW: 'sqs_low',
    FAILURE_TRAJECTORY_PREDICTED: 'failure_trajectory_predicted',
    EXTRACTION_CORRELATION_RISK: 'extraction_correlation_risk',
    FIELDS_GENERALIZED: 'fields_generalized',
    MICRO_OPPORTUNITY_GATED_IN: 'micro_opportunity_gated_in',
    MICRO_OPPORTUNITY_GATED_OUT: 'micro_opportunity_gated_out',
  },
  
  // Truth Loop events (Section 13)
  TRUTH_LOOP: {
    FOLLOW_UP_SCHEDULED: 'follow_up_scheduled',
    FOLLOW_UP_SENT: 'follow_up_sent',
    FOLLOW_UP_RESPONDED: 'follow_up_responded',
    FOLLOW_UP_STAYED_MANAGEABLE: 'follow_up_stayed_manageable',
    FOLLOW_UP_GOT_WORSE: 'follow_up_got_worse',
    FOLLOW_UP_CAUSED_IMPACT: 'follow_up_caused_impact',
    FOLLOW_UP_RESOLVED: 'follow_up_resolved',
    PREDICTION_CONFIRMED: 'prediction_confirmed',
    PREDICTION_NOT_CONFIRMED: 'prediction_not_confirmed',
  },
  
  // Failure Pathway events (Section 13)
  FAILURE_PATHWAY: {
    PATHWAY_DETECTED: 'pathway_detected',
    PATHWAY_PROGRESSSED: 'pathway_progressed',
    PATHWAY_RESOLVED: 'pathway_resolved',
  },
  
  // Contributor Health events (Section 13)
  CONTRIBUTOR_HEALTH: {
    HIGH_SIGNAL_CONTRIBUTOR_IDENTIFIED: 'high_signal_contributor_identified',
    DROP_OFF_DETECTED: 'contributor_drop_off_detected',
    CHURN_RISK_HIGH: 'contributor_churn_risk_high',
  },
} as const;

// Event categories
export type EventCategory = 'user' | 'situation' | 'engagement' | 'micro_opportunity' | 'marketplace' | 'safety' | 'translation_engine' | 'truth_loop' | 'failure_pathway' | 'contributor_health';
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES][keyof typeof EVENT_TYPES[keyof typeof EVENT_TYPES]];

/**
 * Generate an anonymized user ID
 * Format: USR-XXXX (users), OPR-XXXX (operators), ORG-XXXX (organizations)
 */
export function generateAnonymousUserId(roleType: 'user' | 'operator' | 'organization' = 'user'): string {
  const prefix = roleType === 'operator' ? 'OPR' : roleType === 'organization' ? 'ORG' : 'USR';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${suffix}`;
}

/**
 * Convert a date to a date bucket string
 * Uses YYYY-MM-DD format
 */
export function toDateBucket(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Convert a date to a week bucket (YYYY-WXX)
 */
export function toWeekBucket(date: Date = new Date()): string {
  const year = date.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - oneJan.getTime()) / 86400000);
  const weekNumber = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Convert a date to a month bucket (YYYY-MM)
 */
export function toMonthBucket(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

/**
 * Track an analytics event
 */
export async function trackEvent(params: {
  anonymousUserId: string;
  eventType: string;
  eventCategory: EventCategory;
  objectType?: string;
  objectId?: string;
  metadata?: Record<string, unknown>;
  dataSource?: DataSource; // Defaults to REAL if not specified
}): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        anonymousUserId: params.anonymousUserId,
        eventType: params.eventType,
        eventCategory: params.eventCategory,
        objectType: params.objectType,
        objectId: params.objectId,
        metadataJson: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : {},
        dataSource: params.dataSource || 'REAL', // Default to REAL
        createdAtBucket: toDateBucket(),
      },
    });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
    // Don't throw - analytics failures shouldn't break user flows
  }
}

/**
 * Get or create user metrics
 * 
 * CRITICAL: This function now uses IdentityMap for the real-to-anonymous mapping.
 * The realUserId is NEVER stored in UserMetrics - only in the restricted IdentityMap.
 */
export async function getOrCreateUserMetrics(
  realUserId: string,
  roleType: 'user' | 'operator' | 'organization' = 'user',
  dataSource: DataSource = 'REAL'
): Promise<{ anonymousUserId: string }> {
  // First, check if an IdentityMap entry exists for this user
  const existingMapping = await prisma.identityMap.findUnique({
    where: { realUserId },
  });
  
  if (existingMapping) {
    // Verify UserMetrics exists for this anonymous ID
    const existingMetrics = await prisma.userMetrics.findUnique({
      where: { anonymousUserId: existingMapping.anonymousUserId },
    });
    
    if (existingMetrics) {
      return { anonymousUserId: existingMapping.anonymousUserId };
    }
    
    // Create metrics if missing
    await prisma.userMetrics.create({
      data: {
        anonymousUserId: existingMapping.anonymousUserId,
        roleType,
        dataSource,
        signupDateBucket: toDateBucket(),
      },
    });
    
    return { anonymousUserId: existingMapping.anonymousUserId };
  }
  
  // Create new anonymous ID and mapping
  const anonymousUserId = generateAnonymousUserId(roleType);
  
  // Create IdentityMap entry (restricted, only for Trust & Safety)
  await prisma.identityMap.create({
    data: {
      realUserId,
      anonymousUserId,
    },
  });
  
  // Create UserMetrics (no real identity stored here)
  await prisma.userMetrics.create({
    data: {
      anonymousUserId,
      roleType,
      dataSource,
      signupDateBucket: toDateBucket(),
    },
  });
  
  return { anonymousUserId };
}

/**
 * Get anonymous user ID from real user ID
 * This is used internally for event tracking
 */
export async function getAnonymousUserId(realUserId: string): Promise<string | null> {
  const mapping = await prisma.identityMap.findUnique({
    where: { realUserId },
  });
  
  return mapping?.anonymousUserId || null;
}

/**
 * Update user metrics
 */
export async function updateUserMetrics(
  anonymousUserId: string,
  updates: {
    postCount?: number;
    interactionCount?: number;
    reflectionOpenCount?: number;
    opportunityInviteCount?: number;
    microConsultCount?: number;
    revenueGeneratedCents?: number;
    lastActiveBucket?: string;
    retentionStatus?: string;
  }
): Promise<void> {
  try {
    const current = await prisma.userMetrics.findUnique({
      where: { anonymousUserId },
    });
    
    if (!current) return;
    
    await prisma.userMetrics.update({
      where: { anonymousUserId },
      data: {
        postCount: updates.postCount ?? current.postCount,
        interactionCount: updates.interactionCount ?? current.interactionCount,
        reflectionOpenCount: updates.reflectionOpenCount ?? current.reflectionOpenCount,
        opportunityInviteCount: updates.opportunityInviteCount ?? current.opportunityInviteCount,
        microConsultCount: updates.microConsultCount ?? current.microConsultCount,
        revenueGeneratedCents: updates.revenueGeneratedCents ?? current.revenueGeneratedCents,
        lastActiveBucket: updates.lastActiveBucket ?? current.lastActiveBucket,
        retentionStatus: updates.retentionStatus ?? current.retentionStatus,
      },
    });
  } catch (error) {
    console.error('Failed to update user metrics:', error);
  }
}

/**
 * Increment a metric counter
 */
export async function incrementUserMetric(
  anonymousUserId: string,
  field: 'postCount' | 'interactionCount' | 'reflectionOpenCount' | 'opportunityInviteCount' | 'microConsultCount',
  amount: number = 1
): Promise<void> {
  try {
    const current = await prisma.userMetrics.findUnique({
      where: { anonymousUserId },
    });
    
    if (!current) return;
    
    await prisma.userMetrics.update({
      where: { anonymousUserId },
      data: {
        [field]: current[field] + amount,
        lastActiveBucket: toDateBucket(),
      },
    });
  } catch (error) {
    console.error('Failed to increment user metric:', error);
  }
}

/**
 * Add revenue to user metrics
 */
export async function addUserRevenue(
  anonymousUserId: string,
  revenueCents: number
): Promise<void> {
  try {
    const current = await prisma.userMetrics.findUnique({
      where: { anonymousUserId },
    });
    
    if (!current) return;
    
    await prisma.userMetrics.update({
      where: { anonymousUserId },
      data: {
        revenueGeneratedCents: current.revenueGeneratedCents + revenueCents,
        lastActiveBucket: toDateBucket(),
      },
    });
  } catch (error) {
    console.error('Failed to add user revenue:', error);
  }
}

/**
 * Log admin access for audit
 */
export async function logAdminAccess(params: {
  adminUserId: string;
  action: string;
  reason?: string;
  targetType?: string;
  targetId?: string;
  fieldsAccessed?: string[];
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.adminAccessLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        reason: params.reason,
        targetType: params.targetType,
        targetId: params.targetId,
        fieldsAccessed: params.fieldsAccessed || [],
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to log admin access:', error);
  }
}

/**
 * Update daily metrics
 */
export async function updateDailyMetrics(
  dateBucket: string,
  updates: Partial<{
    totalUsers: number;
    newUsers: number;
    verifiedOperators: number;
    verifiedOrgs: number;
    onboardingCompleted: number;
    dau: number;
    sessions: number;
    notificationsSent: number;
    notificationsOpened: number;
    postsCreated: number;
    interactions: number;
    reflectionsSent: number;
    reflectionsOpened: number;
    microOppsCreated: number;
    operatorInvites: number;
    operatorInterests: number;
    consultsCompleted: number;
    gmvCents: number;
    platformRevenueCents: number;
    operatorPayoutsCents: number;
    flaggedContent: number;
    redactionsApplied: number;
    highRiskPosts: number;
  }>
): Promise<void> {
  try {
    const existing = await prisma.dailyMetrics.findUnique({
      where: { dateBucket },
    });
    
    if (existing) {
      // Increment existing values
      const incrementData: Record<string, number> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'number') {
            const existingValue = existing[key as keyof typeof existing];
            incrementData[key] = (typeof existingValue === 'number' ? existingValue : 0) + value;
        }
      }
      
      await prisma.dailyMetrics.update({
        where: { dateBucket },
        data: incrementData,
      });
    } else {
      // Create new daily metrics
      await prisma.dailyMetrics.create({
        data: {
          dateBucket,
          ...updates,
        },
      });
    }
  } catch (error) {
    console.error('Failed to update daily metrics:', error);
  }
}

/**
 * Increment a daily metric
 */
export async function incrementDailyMetric(
  field: 'totalUsers' | 'newUsers' | 'verifiedOperators' | 'verifiedOrgs' | 'onboardingCompleted' | 'dau' | 'sessions' | 'notificationsSent' | 'notificationsOpened' | 'postsCreated' | 'interactions' | 'reflectionsSent' | 'reflectionsOpened' | 'microOppsCreated' | 'operatorInvites' | 'operatorInterests' | 'consultsCompleted' | 'gmvCents' | 'platformRevenueCents' | 'operatorPayoutsCents' | 'flaggedContent' | 'redactionsApplied' | 'highRiskPosts',
  amount: number = 1
): Promise<void> {
  const dateBucket = toDateBucket();
  
  try {
    const existing = await prisma.dailyMetrics.findUnique({
      where: { dateBucket },
    });
    
    if (existing) {
      const currentValue = existing[field] as number;
      await prisma.dailyMetrics.update({
        where: { dateBucket },
        data: {
          [field]: currentValue + amount,
        },
      });
    } else {
      await prisma.dailyMetrics.create({
        data: {
          dateBucket,
          [field]: amount,
        },
      });
    }
  } catch (error) {
    console.error('Failed to increment daily metric:', error);
  }
}

// ==========================================
// TRANSLATION ENGINE ANALYTICS (Section 13)
// ==========================================

/**
 * Track translation engine extraction results
 * Called after each submission to track signal distribution
 */
export async function trackTranslationExtraction(params: {
  contributionId: string;
  anonymousUserId?: string;
  suppressedSignalType: string;
  emotionalSignalType: string;
  workaroundPresent: boolean;
  systemMismatch: boolean;
  invisibleWorkDetected: boolean;
  signalQualityScore: string;
  failureTrajectoryPrediction: string;
  microOpportunityEligible: boolean;
  extractionCorrelationRisk: string;
  submissionTimeMs?: number;
}): Promise<void> {
  try {
    const { contributionId, signalQualityScore, suppressedSignalType, 
            emotionalSignalType, workaroundPresent, systemMismatch,
            invisibleWorkDetected, failureTrajectoryPrediction,
            microOpportunityEligible, extractionCorrelationRisk,
            submissionTimeMs } = params;

    // Generate system-level anonymous ID for translation engine events
    const anonId = params.anonymousUserId || generateAnonymousUserId('operator');
    if (signalQualityScore === 'HIGH') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.SQS_HIGH,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    } else if (signalQualityScore === 'MEDIUM') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.SQS_MEDIUM,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    } else {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.SQS_LOW,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    }

    // Track suppressed signal detection
    if (suppressedSignalType && suppressedSignalType !== 'UNKNOWN') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.SUPPRESSED_SIGNAL_DETECTED,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId, suppressedSignalType }
      });
    }

    // Track emotional signal detection
    if (emotionalSignalType && emotionalSignalType !== 'UNKNOWN') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.EMOTIONAL_SIGNAL_DETECTED,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId, emotionalSignalType }
      });
    }

    // Track workaround detection
    if (workaroundPresent) {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.WORKAROUND_DETECTED,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    }

    // Track system mismatch detection
    if (systemMismatch) {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.SYSTEM_MISMATCH_DETECTED,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    }

    // Track invisible work detection
    if (invisibleWorkDetected) {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.INVISIBLE_WORK_DETECTED,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    }

    // Track failure trajectory predictions
    if (failureTrajectoryPrediction && failureTrajectoryPrediction !== 'NONE') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.FAILURE_TRAJECTORY_PREDICTED,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId, failureTrajectoryPrediction }
      });
    }

    // Track extraction correlation risk
    if (extractionCorrelationRisk === 'high' || extractionCorrelationRisk === 'critical') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.EXTRACTION_CORRELATION_RISK,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId, extractionCorrelationRisk }
      });
    }

    // Track micro-opportunity gating
    if (microOpportunityEligible) {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.MICRO_OPPORTUNITY_GATED_IN,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    } else if (signalQualityScore === 'HIGH') {
      // HIGH SQS but gated out — track why
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRANSLATION_ENGINE.MICRO_OPPORTUNITY_GATED_OUT,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId, reason: 'insufficient_value_signal' }
      });
    }

    // Track submission time (for friction monitoring)
    if (submissionTimeMs) {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: 'submission_time_tracked' as any,
        eventCategory: 'translation_engine',
        dataSource: 'REAL',
        metadata: { contributionId, submissionTimeMs }
      });
    }

  } catch (error) {
    console.error('Error tracking translation extraction:', error);
  }
}

/**
 * Track truth loop follow-up response
 */
export async function trackTruthLoopResponse(params: {
  contributionId: string;
  anonymousUserId?: string;
  statusChange: string;
  daysSinceSubmission: number;
  predictionValidated: string;
}): Promise<void> {
  try {
    const { contributionId, statusChange, daysSinceSubmission, predictionValidated } = params;
    const anonId = params.anonymousUserId || generateAnonymousUserId('operator');

    await trackEvent({
        anonymousUserId: anonId,
      eventType: EVENT_TYPES.TRUTH_LOOP.FOLLOW_UP_RESPONDED,
      eventCategory: 'truth_loop',
      dataSource: 'REAL',
      metadata: { contributionId, statusChange, daysSinceSubmission }
    });

    // Track specific status changes
    if (statusChange === 'stayed_manageable') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRUTH_LOOP.FOLLOW_UP_STAYED_MANAGEABLE,
        eventCategory: 'truth_loop',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    } else if (statusChange === 'got_worse') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRUTH_LOOP.FOLLOW_UP_GOT_WORSE,
        eventCategory: 'truth_loop',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    } else if (statusChange === 'caused_delay_deviation_dropout') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRUTH_LOOP.FOLLOW_UP_CAUSED_IMPACT,
        eventCategory: 'truth_loop',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    } else if (statusChange === 'resolved') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRUTH_LOOP.FOLLOW_UP_RESOLVED,
        eventCategory: 'truth_loop',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    }

    // Track prediction validation
    if (predictionValidated === 'PREDICTION_CONFIRMED') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRUTH_LOOP.PREDICTION_CONFIRMED,
        eventCategory: 'truth_loop',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    } else if (predictionValidated === 'PREDICTION_NOT_CONFIRMED') {
      await trackEvent({
        anonymousUserId: anonId,
        eventType: EVENT_TYPES.TRUTH_LOOP.PREDICTION_NOT_CONFIRMED,
        eventCategory: 'truth_loop',
        dataSource: 'REAL',
        metadata: { contributionId }
      });
    }

  } catch (error) {
    console.error('Error tracking truth loop response:', error);
  }
}