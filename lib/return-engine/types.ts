/**
 * BTP Return Engine - Type Definitions
 * 
 * Core types for the notification/return system
 * 
 * ARCHITECTURE RULES:
 * - NO social mechanics (no likes, followers, counts exposed publicly)
 * - Preserve anonymity at all times
 * - State-based notifications, not activity alerts
 * - Human language only - no system terms
 */

// ==========================================
// NOTIFICATION CLASSES
// ==========================================

/**
 * Notification classes as defined in Return Engine spec
 */
export type NotificationClass = 
  | 'VALIDATION'    // User feels seen/confirmed
  | 'EXPANSION'     // Curiosity - come see what changed
  | 'MOMENTUM'      // Progress and private status movement
  | 'PRESSURE'      // Urgency / consequence / FOMO
  | 'OPPORTUNITY';  // Economic pull

/**
 * Priority levels for delivery
 */
export type NotificationPriority = 
  | 'P1'  // Immediate (0-15 min)
  | 'P2'  // Batched (2-4 hours)
  | 'P3'; // Digest only

/**
 * Delivery surfaces
 */
export type DeliverySurface = 
  | 'in_app'
  | 'push'
  | 'email'
  | 'badge';

// ==========================================
// CORE NOTIFICATION TYPES
// ==========================================

/**
 * Notification ID type - structured for easy parsing
 */
export interface NotificationId {
  class: NotificationClass;
  index: number;  // e.g., VAL-01, EXP-02
}

/**
 * Notification variant with all metadata
 */
export interface NotificationVariant {
  id: string;                    // e.g., "VAL-01"
  class: NotificationClass;
  copy: string;                  // Human-facing text
  trigger: string;               // What triggers this
  surfaces: DeliverySurface[];
  priority: NotificationPriority;
  timingMinMs: number;           // Minimum delay before sending
  timingMaxMs: number;           // Maximum delay (for randomization)
  requiresBatching: boolean;     // Should be batched with similar
  minBatchSize: number;          // Minimum events to trigger
}

/**
 * A concrete notification instance
 */
export interface Notification {
  id: string;
  variantId: string;
  userId: string;
  
  // Content
  copy: string;
  contextSnippet?: string;       // Truncated post content
  
  // Targeting
  relatedPostId?: string;
  relatedThreadId?: string;
  relatedOpportunityId?: string;
  relatedPatternId?: string;
  
  // State
  read: boolean;
  dismissed: boolean;
  
  // Delivery
  priority: NotificationPriority;
  surfaces: DeliverySurface[];
  deliveredTo: DeliverySurface[];
  
  // Timing
  createdAt: Date;
  scheduledFor?: Date;           // For batched notifications
  sentAt?: Date;
  
  // Anonymity preservation
  displayTime: 'just_now' | 'earlier' | 'today' | 'yesterday' | 'this_week' | 'a_while_back';
}

// ==========================================
// TRIGGER EVENTS
// ==========================================

/**
 * Events that can trigger notifications
 */
export type TriggerEvent = 
  // Posting
  | 'POST_CREATED'
  
  // Interactions
  | 'SEEN_THIS_BEFORE'
  | 'THIS_WORKED'
  | 'DIDNT_WORK'
  | 'DIFFERENT_CAUSE'
  | 'ADD_CONTEXT'
  | 'THIS_IS_ACCURATE'
  
  // Pattern state changes
  | 'PATTERN_FORMING'
  | 'PATTERN_CONFIRMED'
  | 'PATTERN_ESCALATING'
  | 'PATTERN_CONNECTED'
  
  // Momentum/Access changes
  | 'TRUST_INCREASED'
  | 'TIER_IMPROVED'
  | 'ACCESS_PRIORITY_UP'
  | 'DOMAIN_STRENGTHENED'
  
  // Pressure triggers
  | 'OPPORTUNITY_MISSED_CLOSE'
  | 'OPPORTUNITY_MISSED_ACCESS'
  | 'INACTIVITY_WARNING'
  | 'TIER_PROXIMITY_BELOW'
  
  // Opportunity triggers
  | 'OPPORTUNITY_RELEASED'
  | 'OPPORTUNITY_HIGH_FIT'
  | 'OPPORTUNITY_MOVING_FAST'
  | 'OPPORTUNITY_EARLY_WINDOW'
  | 'OPPORTUNITY_DOMAIN_MATCH'
  
  // Hiring triggers
  | 'MATCH_CREATED'
  | 'INTEREST_EXPRESSED'
  | 'INTERVIEW_REQUESTED'
  | 'HIRED'
  | 'HIRE_COMPLETED'
  | 'OUTCOME_RECORDED';

/**
 * Trigger context for generating notifications
 */
export interface TriggerContext {
  event: TriggerEvent;
  timestamp: Date;
  
  // Actor (who triggered the event)
  actorId: string;
  actorTrustWeight: number;
  
  // Target (who should receive notification)
  targetUserId: string;
  
  // Related entities
  postId?: string;
  contributionId?: string;
  matchId?: string;
  opportunityId?: string;
  patternId?: string;
  
  // Event-specific data
  eventData?: {
    previousTier?: string;
    newTier?: string;
    previousScore?: number;
    newScore?: number;
    domain?: string;
    fitScore?: number;
    confirmationCount?: number;
    contextAdded?: boolean;
    isUniqueConfirmer?: boolean;
    isFirstConfirmation?: boolean;
    isHighWeight?: boolean;
    timeToFill?: number;
    wasSuccessful?: boolean;
    wouldRehire?: boolean;
  };
}

// ==========================================
// USER STATE TRACKING
// ==========================================

/**
 * User engagement state for personalization
 */
export interface UserEngagementState {
  userId: string;
  
  // Current state
  state: 'NEW' | 'ACTIVE' | 'ESTABLISHED' | 'HIGH_VISIBILITY' | 'AT_RISK';
  
  // Activity tracking
  lastActiveAt: Date;
  consecutiveActiveDays: number;
  
  // Primary domains (from trust vector)
  primaryDomains: string[];
  
  // Recent focus
  recentFocusAreas: string[];
  
  // Notification response history
  notificationResponseRate: Record<NotificationClass, number>;
  optimalNotificationHour: number;
  
  // Engagement patterns
  averageSessionLengthMinutes: number;
  averageWeeklyVisits: number;
}

/**
 * Post state for state-change notifications
 */
export type PostState = 
  | 'ISOLATED'
  | 'CONFIRMED'
  | 'PATTERN_LINKED'
  | 'ESCALATING'
  | 'RESOLVED'
  | 'COMPLICATED';

/**
 * Post state record
 */
export interface PostStateRecord {
  postId: string;
  currentState: PostState;
  previousState?: PostState;
  
  // Metrics (internal only)
  confirmationCount: number;
  uniqueConfirmers: number;
  contextAdditions: number;
  patternLinks: string[];
  
  // State history
  stateHistory: Array<{
    fromState: PostState;
    toState: PostState;
    timestamp: Date;
    trigger: string;
  }>;
  
  // Notification state
  lastStateNotificationAt?: Date;
  pendingNotifications: string[];
}

// ==========================================
// NOTIFICATION CENTER UI TYPES
// ==========================================

/**
 * Notification group for UI display
 */
export type NotificationGroup = 'NEW' | 'EARLIER' | 'THIS_WEEK' | 'ARCHIVE';

/**
 * Notification center item for UI
 */
export interface NotificationCenterItem {
  id: string;
  copy: string;
  contextSnippet?: string;
  displayTime: string;
  group: NotificationGroup;
  read: boolean;
  actionable: boolean;
  
  // Deep link
  targetUrl?: string;
  targetType?: 'post' | 'opportunity' | 'pattern' | 'profile';
  targetId?: string;
}

/**
 * Badge state for UI
 */
export interface BadgeState {
  home: boolean;
  opportunities: boolean;
  notifications: number;  // Count for notification center only
  profile: boolean;
}

// ==========================================
// TIMING CONFIGURATION
// ==========================================

/**
 * Timing rules for notification delivery
 */
export const TIMING_CONFIG = {
  P1: {
    minDelayMs: 0,
    maxDelayMs: 15 * 60 * 1000,  // 15 minutes
    randomJitterMs: 3 * 60 * 1000,  // ±3 minutes
  },
  P2: {
    minDelayMs: 2 * 60 * 60 * 1000,  // 2 hours
    maxDelayMs: 4 * 60 * 60 * 1000,  // 4 hours
    randomJitterMs: 30 * 60 * 1000,  // ±30 minutes
  },
  P3: {
    // Digest timing - randomized between 6-9 AM user local time
    digestWindowStart: 6,
    digestWindowEnd: 9,
  },
};

/**
 * Time bucketing for anonymity preservation
 */
export const TIME_BUCKETS = [
  { maxHours: 1, label: 'just_now' as const },
  { maxHours: 4, label: 'earlier' as const },
  { maxHours: 12, label: 'today' as const },
  { maxHours: 24, label: 'today' as const },
  { maxHours: 48, label: 'yesterday' as const },
  { maxHours: 168, label: 'this_week' as const },
  { maxHours: Infinity, label: 'a_while_back' as const },
];

// ==========================================
// NOTIFICATION VARIANT CATALOG
// ==========================================

/**
 * All notification variants - the full copy inventory
 */
export const NOTIFICATION_VARIANTS: NotificationVariant[] = [
  // === VALIDATION ALERTS ===
  {
    id: 'VAL-01',
    class: 'VALIDATION',
    copy: "You're not the only one — this is getting confirmed",
    trigger: 'First unique confirmation on post',
    surfaces: ['push', 'in_app', 'email'],
    priority: 'P1',
    timingMinMs: 15 * 60 * 1000,  // 15 min minimum for anonymity
    timingMaxMs: 45 * 60 * 1000,  // 45 min max
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'VAL-02',
    class: 'VALIDATION',
    copy: "What you posted is lining up with what others are seeing",
    trigger: 'Second unique confirmation from distinct user',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 15 * 60 * 1000,
    timingMaxMs: 45 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'VAL-03',
    class: 'VALIDATION',
    copy: "This is picking up",
    trigger: 'Multiple confirmations within short window',
    surfaces: ['in_app', 'email'],
    priority: 'P2',
    timingMinMs: 2 * 60 * 60 * 1000,
    timingMaxMs: 4 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 3,
  },
  {
    id: 'VAL-04',
    class: 'VALIDATION',
    copy: "This keeps showing up",
    trigger: 'Post becomes part of emerging pattern',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 15 * 60 * 1000,
    timingMaxMs: 45 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'VAL-05',
    class: 'VALIDATION',
    copy: "Yeah — this is real",
    trigger: 'High-weight engagement reinforces post',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 15 * 60 * 1000,
    timingMaxMs: 45 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'VAL-06',
    class: 'VALIDATION',
    copy: "This is getting heavier",
    trigger: 'Cumulative weight exceeds threshold',
    surfaces: ['in_app'],
    priority: 'P2',
    timingMinMs: 2 * 60 * 60 * 1000,
    timingMaxMs: 4 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 2,
  },
  {
    id: 'VAL-07',
    class: 'VALIDATION',
    copy: "More people are circling this",
    trigger: 'Visibility increase without specifics',
    surfaces: ['in_app'],
    priority: 'P3',
    timingMinMs: 24 * 60 * 60 * 1000,
    timingMaxMs: 48 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 3,
  },
  {
    id: 'VAL-08',
    class: 'VALIDATION',
    copy: "This is holding up",
    trigger: 'Post maintains relevance over time',
    surfaces: ['email'],
    priority: 'P3',
    timingMinMs: 7 * 24 * 60 * 60 * 1000,  // 7 days
    timingMaxMs: 8 * 24 * 60 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  
  // === EXPANSION ALERTS ===
  {
    id: 'EXP-01',
    class: 'EXPANSION',
    copy: "Someone added a new angle to this",
    trigger: 'Add-context action on user\'s post',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 5 * 60 * 1000,
    timingMaxMs: 30 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'EXP-02',
    class: 'EXPANSION',
    copy: "A different cause just got surfaced",
    trigger: 'Different-cause action on user\'s post',
    surfaces: ['push', 'in_app', 'email'],
    priority: 'P1',
    timingMinMs: 5 * 60 * 1000,
    timingMaxMs: 30 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'EXP-03',
    class: 'EXPANSION',
    copy: "This got sharper",
    trigger: 'Substantial reply that refines the issue',
    surfaces: ['in_app'],
    priority: 'P1',
    timingMinMs: 5 * 60 * 1000,
    timingMaxMs: 30 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'EXP-04',
    class: 'EXPANSION',
    copy: "There's more here now",
    trigger: 'Multiple context additions',
    surfaces: ['in_app'],
    priority: 'P2',
    timingMinMs: 2 * 60 * 60 * 1000,
    timingMaxMs: 4 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 3,
  },
  {
    id: 'EXP-05',
    class: 'EXPANSION',
    copy: "Someone added context you may want to see",
    trigger: 'Context added to thread user engaged with',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 15 * 60 * 1000,
    timingMaxMs: 45 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'EXP-06',
    class: 'EXPANSION',
    copy: "This took a turn",
    trigger: 'Different-cause changes interpretation significantly',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 5 * 60 * 1000,
    timingMaxMs: 30 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'EXP-07',
    class: 'EXPANSION',
    copy: "A missing piece just got filled in",
    trigger: 'Context that completes partial picture',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 5 * 60 * 1000,
    timingMaxMs: 30 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'EXP-08',
    class: 'EXPANSION',
    copy: "The picture is changing",
    trigger: 'Multiple additions that shift understanding',
    surfaces: ['in_app'],
    priority: 'P2',
    timingMinMs: 2 * 60 * 60 * 1000,
    timingMaxMs: 4 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 2,
  },
  {
    id: 'EXP-09',
    class: 'EXPANSION',
    copy: "Someone added something that complicates this",
    trigger: 'Context that introduces contradictory information',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 5 * 60 * 1000,
    timingMaxMs: 30 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'EXP-10',
    class: 'EXPANSION',
    copy: "This is connecting to something else now",
    trigger: 'Post linked to another post or pattern',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 5 * 60 * 1000,
    timingMaxMs: 30 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  
  // === MOMENTUM ALERTS ===
  {
    id: 'MOM-01',
    class: 'MOMENTUM',
    copy: "Your recent activity is carrying more weight",
    trigger: 'Trust vector increase from recent contributions',
    surfaces: ['in_app', 'email'],
    priority: 'P2',
    timingMinMs: 2 * 60 * 60 * 1000,
    timingMaxMs: 4 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 1,
  },
  {
    id: 'MOM-02',
    class: 'MOMENTUM',
    copy: "You're showing up earlier in relevant opportunities",
    trigger: 'Access tier improvement',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 15 * 60 * 1000,
    timingMaxMs: 45 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'MOM-03',
    class: 'MOMENTUM',
    copy: "What you've been posting is helping in stronger matches",
    trigger: 'Match quality improvement',
    surfaces: ['in_app'],
    priority: 'P2',
    timingMinMs: 2 * 60 * 60 * 1000,
    timingMaxMs: 4 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 1,
  },
  {
    id: 'MOM-04',
    class: 'MOMENTUM',
    copy: "You're moving closer to earlier access",
    trigger: 'Proximity to tier threshold',
    surfaces: ['in_app'],
    priority: 'P2',
    timingMinMs: 2 * 60 * 60 * 1000,
    timingMaxMs: 4 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 1,
  },
  {
    id: 'MOM-05',
    class: 'MOMENTUM',
    copy: "Your input in this area is building up",
    trigger: 'Domain-specific trust increase',
    surfaces: ['in_app'],
    priority: 'P3',
    timingMinMs: 24 * 60 * 60 * 1000,
    timingMaxMs: 48 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 2,
  },
  {
    id: 'MOM-06',
    class: 'MOMENTUM',
    copy: "You're getting pulled into more relevant conversations",
    trigger: 'Feed relevance improvement',
    surfaces: ['in_app'],
    priority: 'P3',
    timingMinMs: 24 * 60 * 60 * 1000,
    timingMaxMs: 48 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 2,
  },
  {
    id: 'MOM-07',
    class: 'MOMENTUM',
    copy: "Keep going — this is adding up",
    trigger: 'Consistency streak (3+ days active)',
    surfaces: ['in_app'],
    priority: 'P2',
    timingMinMs: 2 * 60 * 60 * 1000,
    timingMaxMs: 4 * 60 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'MOM-08',
    class: 'MOMENTUM',
    copy: "Something's building around your recent posts",
    trigger: 'Multiple posts gaining traction',
    surfaces: ['in_app', 'email'],
    priority: 'P2',
    timingMinMs: 2 * 60 * 60 * 1000,
    timingMaxMs: 4 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 2,
  },
  
  // === PRESSURE ALERTS ===
  {
    id: 'PRE-01',
    class: 'PRESSURE',
    copy: "You were close on a few recent opportunities",
    trigger: 'Missed high-fit opportunity',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 5 * 60 * 1000,
    timingMaxMs: 30 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'PRE-02',
    class: 'PRESSURE',
    copy: "Others with more recent activity got in earlier",
    trigger: 'Access delay due to inactivity',
    surfaces: ['in_app'],
    priority: 'P2',
    timingMinMs: 2 * 60 * 60 * 1000,
    timingMaxMs: 4 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 1,
  },
  {
    id: 'PRE-03',
    class: 'PRESSURE',
    copy: "A few strong-fit opportunities moved before you",
    trigger: 'Opportunity passed to earlier tier',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 5 * 60 * 1000,
    timingMaxMs: 30 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'PRE-04',
    class: 'PRESSURE',
    copy: "Recent participation can affect how early things open up",
    trigger: 'Extended inactivity warning',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 5 * 60 * 1000,
    timingMaxMs: 30 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'PRE-05',
    class: 'PRESSURE',
    copy: "You're just under the cutoff for some roles right now",
    trigger: 'Tier proximity (below threshold)',
    surfaces: ['email'],
    priority: 'P3',
    timingMinMs: 7 * 24 * 60 * 60 * 1000,
    timingMaxMs: 8 * 24 * 60 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'PRE-06',
    class: 'PRESSURE',
    copy: "Something you would've fit moved fast",
    trigger: 'High-match opportunity filled quickly',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 5 * 60 * 1000,
    timingMaxMs: 30 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'PRE-07',
    class: 'PRESSURE',
    copy: "Your recent quiet is showing",
    trigger: 'Extended inactivity (7+ days)',
    surfaces: ['email'],
    priority: 'P2',
    timingMinMs: 7 * 24 * 60 * 60 * 1000,
    timingMaxMs: 8 * 24 * 60 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'PRE-08',
    class: 'PRESSURE',
    copy: "A few things passed through that you might've caught",
    trigger: 'Multiple missed opportunities',
    surfaces: ['email'],
    priority: 'P3',
    timingMinMs: 7 * 24 * 60 * 60 * 1000,
    timingMaxMs: 8 * 24 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 3,
  },
  
  // === OPPORTUNITY ALERTS ===
  {
    id: 'OPP-01',
    class: 'OPPORTUNITY',
    copy: "Something relevant just opened up",
    trigger: 'High-fit opportunity release',
    surfaces: ['push', 'in_app', 'email'],
    priority: 'P1',
    timingMinMs: 0,
    timingMaxMs: 5 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'OPP-02',
    class: 'OPPORTUNITY',
    copy: "This looks closer to the kind of work you've been circling",
    trigger: 'Strong match on domain expertise',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 0,
    timingMaxMs: 5 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'OPP-03',
    class: 'OPPORTUNITY',
    copy: "You may want to check this now",
    trigger: 'Time-sensitive opportunity',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 0,
    timingMaxMs: 5 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'OPP-04',
    class: 'OPPORTUNITY',
    copy: "Something higher-fit just moved into view",
    trigger: 'Match quality exceeds user\'s average',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 0,
    timingMaxMs: 5 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'OPP-05',
    class: 'OPPORTUNITY',
    copy: "This one's moving fast",
    trigger: 'Opportunity receiving rapid interest',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 0,
    timingMaxMs: 5 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'OPP-06',
    class: 'OPPORTUNITY',
    copy: "Early window on something in your space",
    trigger: 'Tier 1/2 access opportunity',
    surfaces: ['push', 'in_app'],
    priority: 'P1',
    timingMinMs: 0,
    timingMaxMs: 5 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
  {
    id: 'OPP-07',
    class: 'OPPORTUNITY',
    copy: "A few things opened up that fit what you know",
    trigger: 'Multiple relevant opportunities',
    surfaces: ['in_app', 'email'],
    priority: 'P2',
    timingMinMs: 2 * 60 * 60 * 1000,
    timingMaxMs: 4 * 60 * 60 * 1000,
    requiresBatching: true,
    minBatchSize: 3,
  },
  {
    id: 'OPP-08',
    class: 'OPPORTUNITY',
    copy: "Someone's looking for exactly what you've been posting about",
    trigger: 'Direct domain match',
    surfaces: ['push', 'in_app', 'email'],
    priority: 'P1',
    timingMinMs: 0,
    timingMaxMs: 5 * 60 * 1000,
    requiresBatching: false,
    minBatchSize: 1,
  },
];

/**
 * Get variant by ID
 */
export function getVariantById(id: string): NotificationVariant | undefined {
  return NOTIFICATION_VARIANTS.find(v => v.id === id);
}

/**
 * Get variants by class
 */
export function getVariantsByClass(notificationClass: NotificationClass): NotificationVariant[] {
  return NOTIFICATION_VARIANTS.filter(v => v.class === notificationClass);
}

/**
 * Total notification count
 */
export const TOTAL_NOTIFICATION_VARIANTS = NOTIFICATION_VARIANTS.length; // 42