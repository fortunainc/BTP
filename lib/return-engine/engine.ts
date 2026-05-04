/**
 * BTP Return Engine - Core Engine
 * 
 * Handles notification generation, batching, timing, and delivery
 * 
 * ARCHITECTURE:
 * - Event-driven notification generation
 * - Priority-based batching
 * - Anonymity-preserving timing
 * - State-change detection
 */

import { randomUUID } from 'crypto';
import {
  Notification,
  NotificationVariant,
  NotificationPriority,
  DeliverySurface,
  TriggerEvent,
  TriggerContext,
  PostState,
  PostStateRecord,
  UserEngagementState,
  NOTIFICATION_VARIANTS,
  TIMING_CONFIG,
  TIME_BUCKETS,
  getVariantById,
} from './types';

// ==========================================
// NOTIFICATION GENERATION ENGINE
// ==========================================

/**
 * Return Engine - Core notification generation system
 */
export class ReturnEngine {
  private pendingNotifications: Map<string, Notification[]> = new Map();
  private postStates: Map<string, PostStateRecord> = new Map();
  private userStates: Map<string, UserEngagementState> = new Map();

  /**
   * Process a trigger event and generate notifications
   */
  async processTrigger(context: TriggerContext): Promise<Notification[]> {
    const notifications: Notification[] = [];
    const variant = this.selectVariant(context);
    
    if (!variant) {
      return notifications;
    }

    // Check if this should be batched
    if (variant.requiresBatching) {
      const batched = this.addToBatch(context, variant);
      if (!batched) {
        return notifications; // Waiting for more events
      }
    }

    // Generate the notification
    const notification = await this.generateNotification(context, variant);
    
    if (notification) {
      notifications.push(notification);
      await this.scheduleDelivery(notification);
    }

    // Update states
    this.updatePostState(context);
    this.updateUserEngagement(context);

    return notifications;
  }

  /**
   * Select the appropriate notification variant for a trigger
   */
  private selectVariant(context: TriggerContext): NotificationVariant | null {
    const { event, eventData } = context;

    switch (event) {
      // === VALIDATION EVENTS ===
      case 'SEEN_THIS_BEFORE':
        if (eventData?.isHighWeight) {
          return getVariantById('VAL-05') || null;
        }
        if (eventData?.confirmationCount === 1) {
          return getVariantById('VAL-01') || null;
        }
        if (eventData?.confirmationCount === 2 && eventData?.isUniqueConfirmer) {
          return getVariantById('VAL-02') || null;
        }
        if (eventData?.confirmationCount && eventData.confirmationCount >= 3) {
          return getVariantById('VAL-03') || null;
        }
        return getVariantById('VAL-01') || null;

      case 'THIS_IS_ACCURATE':
        return getVariantById('VAL-05') || null;

      // === EXPANSION EVENTS ===
      case 'ADD_CONTEXT':
        return getVariantById('EXP-01') || null;

      case 'DIFFERENT_CAUSE':
        return getVariantById('EXP-02') || null;

      case 'THIS_WORKED':
        return getVariantById('EXP-03') || null;

      case 'DIDNT_WORK':
        return getVariantById('EXP-03') || null;

      // === PATTERN EVENTS ===
      case 'PATTERN_FORMING':
        return getVariantById('VAL-04') || null;

      case 'PATTERN_CONNECTED':
        return getVariantById('EXP-10') || null;

      // === MOMENTUM EVENTS ===
      case 'TRUST_INCREASED':
        return getVariantById('MOM-01') || null;

      case 'TIER_IMPROVED':
        return getVariantById('MOM-02') || null;

      case 'ACCESS_PRIORITY_UP':
        return getVariantById('MOM-04') || null;

      case 'DOMAIN_STRENGTHENED':
        return getVariantById('MOM-05') || null;

      // === PRESSURE EVENTS ===
      case 'OPPORTUNITY_MISSED_CLOSE':
        return getVariantById('PRE-01') || null;

      case 'OPPORTUNITY_MISSED_ACCESS':
        return getVariantById('PRE-03') || null;

      case 'INACTIVITY_WARNING':
        return getVariantById('PRE-04') || null;

      case 'TIER_PROXIMITY_BELOW':
        return getVariantById('PRE-05') || null;

      // === OPPORTUNITY EVENTS ===
      case 'OPPORTUNITY_RELEASED':
        return getVariantById('OPP-01') || null;

      case 'OPPORTUNITY_HIGH_FIT':
        return getVariantById('OPP-04') || null;

      case 'OPPORTUNITY_MOVING_FAST':
        return getVariantById('OPP-05') || null;

      case 'OPPORTUNITY_EARLY_WINDOW':
        return getVariantById('OPP-06') || null;

      case 'OPPORTUNITY_DOMAIN_MATCH':
        return getVariantById('OPP-08') || null;

      default:
        return null;
    }
  }

  /**
   * Add event to batch and check if ready to send
   */
  private addToBatch(context: TriggerContext, variant: NotificationVariant): boolean {
    const batchKey = `${context.targetUserId}-${variant.class}`;
    const pending = this.pendingNotifications.get(batchKey) || [];
    
    // Create pending notification
    const pendingNotif: Notification = {
      id: randomUUID(),
      variantId: variant.id,
      userId: context.targetUserId,
      copy: variant.copy,
      relatedPostId: context.postId,
      relatedThreadId: context.contributionId,
      relatedOpportunityId: context.opportunityId,
      read: false,
      dismissed: false,
      priority: variant.priority,
      surfaces: variant.surfaces,
      deliveredTo: [],
      createdAt: new Date(),
      displayTime: 'just_now',
    };

    pending.push(pendingNotif);
    this.pendingNotifications.set(batchKey, pending);

    // Check if batch is ready
    return pending.length >= variant.minBatchSize;
  }

  /**
   * Generate a notification instance
   */
  private async generateNotification(
    context: TriggerContext,
    variant: NotificationVariant
  ): Promise<Notification | null> {
    // Calculate timing with anonymity-preserving randomization
    const timing = this.calculateTiming(variant);
    
    // Get context snippet (truncated for anonymity)
    const contextSnippet = await this.getContextSnippet(context);

    const notification: Notification = {
      id: randomUUID(),
      variantId: variant.id,
      userId: context.targetUserId,
      copy: variant.copy,
      contextSnippet,
      relatedPostId: context.postId,
      relatedThreadId: context.contributionId,
      relatedOpportunityId: context.opportunityId,
      relatedPatternId: context.patternId,
      read: false,
      dismissed: false,
      priority: variant.priority,
      surfaces: variant.surfaces,
      deliveredTo: [],
      createdAt: new Date(),
      scheduledFor: timing.scheduledFor,
      displayTime: 'just_now',
    };

    return notification;
  }

  /**
   * Calculate delivery timing with randomization for anonymity
   */
  private calculateTiming(variant: NotificationVariant): {
    scheduledFor: Date;
  } {
    const config = TIMING_CONFIG[variant.priority];
    const now = Date.now();

    // Add random jitter for anonymity preservation
    const baseDelay = variant.timingMinMs;
    const maxDelay = variant.timingMaxMs;
    const jitter = 'randomJitterMs' in config ? config.randomJitterMs : 0;

    // Random delay within range
    const range = maxDelay - baseDelay;
    const randomOffset = Math.random() * range;
    const jitterOffset = (Math.random() - 0.5) * 2 * jitter;

    const totalDelay = Math.max(0, baseDelay + randomOffset + jitterOffset);
    const scheduledFor = new Date(now + totalDelay);

    return { scheduledFor };
  }

  /**
   * Get truncated context snippet for anonymity
   */
  private async getContextSnippet(context: TriggerContext): Promise<string | undefined> {
    // In production, this would fetch the post content
    // For now, return undefined to avoid exposing any content
    return undefined;
  }

  /**
   * Schedule notification delivery
   */
  private async scheduleDelivery(notification: Notification): Promise<void> {
    // In production, this would:
    // 1. Store notification in database
    // 2. Queue for delivery at scheduled time
    // 3. Trigger push/email at appropriate time
    
    console.log(`[ReturnEngine] Scheduling notification ${notification.id} for ${notification.scheduledFor}`);
  }

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  /**
   * Update post state after trigger
   */
  private updatePostState(context: TriggerContext): void {
    if (!context.postId) return;

    const currentState = this.postStates.get(context.postId);
    
    if (!currentState) {
      // Initialize new post state
      this.postStates.set(context.postId, {
        postId: context.postId,
        currentState: 'ISOLATED',
        confirmationCount: 0,
        uniqueConfirmers: 0,
        contextAdditions: 0,
        patternLinks: [],
        stateHistory: [],
        pendingNotifications: [],
      });
      return;
    }

    // Update based on event
    switch (context.event) {
      case 'SEEN_THIS_BEFORE':
      case 'THIS_IS_ACCURATE':
        currentState.confirmationCount++;
        if (context.eventData?.isUniqueConfirmer) {
          currentState.uniqueConfirmers++;
        }
        // State transition
        if (currentState.confirmationCount >= 2 && currentState.currentState === 'ISOLATED') {
          this.transitionPostState(currentState, 'CONFIRMED', context.event);
        }
        break;

      case 'ADD_CONTEXT':
        currentState.contextAdditions++;
        break;

      case 'PATTERN_FORMING':
      case 'PATTERN_CONNECTED':
        if (context.patternId) {
          currentState.patternLinks.push(context.patternId);
        }
        if (currentState.currentState === 'CONFIRMED') {
          this.transitionPostState(currentState, 'PATTERN_LINKED', context.event);
        }
        break;
    }
  }

  /**
   * Transition post to new state
   */
  private transitionPostState(
    record: PostStateRecord,
    newState: PostState,
    trigger: string
  ): void {
    const previousState = record.currentState;
    record.currentState = newState;
    record.stateHistory.push({
      fromState: previousState,
      toState: newState,
      timestamp: new Date(),
      trigger,
    });
    record.lastStateNotificationAt = new Date();
  }

  /**
   * Update user engagement state
   */
  private updateUserEngagement(context: TriggerContext): void {
    const userId = context.targetUserId;
    const state = this.userStates.get(userId);

    if (!state) {
      // Initialize new user state
      this.userStates.set(userId, {
        userId,
        state: 'NEW',
        lastActiveAt: new Date(),
        consecutiveActiveDays: 1,
        primaryDomains: [],
        recentFocusAreas: [],
        notificationResponseRate: {
          VALIDATION: 0.5,
          EXPANSION: 0.5,
          MOMENTUM: 0.5,
          PRESSURE: 0.5,
          OPPORTUNITY: 0.5,
        },
        optimalNotificationHour: 9, // Default 9 AM
        averageSessionLengthMinutes: 5,
        averageWeeklyVisits: 1,
      });
      return;
    }

    // Update last active
    state.lastActiveAt = new Date();

    // Update state based on activity
    if (state.consecutiveActiveDays >= 7) {
      state.state = 'ACTIVE';
    }
    if (state.consecutiveActiveDays >= 30) {
      state.state = 'ESTABLISHED';
    }
  }

  // ==========================================
  // BATCHING ENGINE
  // ==========================================

  /**
   * Process pending batches for a user
   */
  async processUserBatches(userId: string): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const [batchKey, pending] of this.pendingNotifications) {
      if (batchKey.startsWith(userId)) {
        // Time to send the batch
        notifications.push(...pending);
        this.pendingNotifications.delete(batchKey);
      }
    }

    return notifications;
  }

  /**
   * Get pending batch count for a user
   */
  getPendingBatchCount(userId: string): number {
    let count = 0;
    for (const [batchKey, pending] of this.pendingNotifications) {
      if (batchKey.startsWith(userId)) {
        count += pending.length;
      }
    }
    return count;
  }

  // ==========================================
  // TIME BUCKETING FOR ANONYMITY
  // ==========================================

  /**
   * Calculate display time for anonymity
   */
  calculateDisplayTime(createdAt: Date): Notification['displayTime'] {
    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

    for (const bucket of TIME_BUCKETS) {
      if (ageHours < bucket.maxHours) {
        return bucket.label;
      }
    }

    return 'a_while_back';
  }

  // ==========================================
  // PERSONALIZATION
  // ==========================================

  /**
   * Get user engagement state
   */
  getUserState(userId: string): UserEngagementState | undefined {
    return this.userStates.get(userId);
  }

  /**
   * Calculate relevance score for a notification
   */
  calculateRelevanceScore(
    userId: string,
    notificationClass: NotificationVariant['class'],
    domain?: string
  ): number {
    const state = this.userStates.get(userId);
    if (!state) return 0.5;

    let score = 0;

    // Domain match
    if (domain && state.primaryDomains.includes(domain)) {
      score += 0.3;
    }

    // Historical response rate
    score += state.notificationResponseRate[notificationClass] * 0.3;

    // Recent activity alignment
    if (domain && state.recentFocusAreas.includes(domain)) {
      score += 0.2;
    }

    // Optimal timing
    const currentHour = new Date().getHours();
    if (Math.abs(currentHour - state.optimalNotificationHour) <= 2) {
      score += 0.2;
    }

    return score;
  }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

export const returnEngine = new ReturnEngine();

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate a notification ID
 */
export function generateNotificationId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Check if event should generate immediate notification
 */
export function isImmediateEvent(event: TriggerEvent): boolean {
  const immediateEvents: TriggerEvent[] = [
    'OPPORTUNITY_RELEASED',
    'OPPORTUNITY_HIGH_FIT',
    'OPPORTUNITY_MOVING_FAST',
    'OPPORTUNITY_EARLY_WINDOW',
    'OPPORTUNITY_DOMAIN_MATCH',
    'TIER_IMPROVED',
    'HIRED',
  ];
  return immediateEvents.includes(event);
}

/**
 * Check if event should be batched
 */
export function isBatchedEvent(event: TriggerEvent): boolean {
  const batchedEvents: TriggerEvent[] = [
    'SEEN_THIS_BEFORE',
    'THIS_IS_ACCURATE',
    'ADD_CONTEXT',
    'TRUST_INCREASED',
    'DOMAIN_STRENGTHENED',
  ];
  return batchedEvents.includes(event);
}

/**
 * Get notification class for event
 */
export function getNotificationClassForEvent(event: TriggerEvent): NotificationVariant['class'] {
  const classMap: Partial<Record<TriggerEvent, NotificationVariant['class']>> = {
    SEEN_THIS_BEFORE: 'VALIDATION',
    THIS_IS_ACCURATE: 'VALIDATION',
    THIS_WORKED: 'EXPANSION',
    DIDNT_WORK: 'EXPANSION',
    DIFFERENT_CAUSE: 'EXPANSION',
    ADD_CONTEXT: 'EXPANSION',
    PATTERN_FORMING: 'VALIDATION',
    PATTERN_CONNECTED: 'EXPANSION',
    TRUST_INCREASED: 'MOMENTUM',
    TIER_IMPROVED: 'MOMENTUM',
    ACCESS_PRIORITY_UP: 'MOMENTUM',
    DOMAIN_STRENGTHENED: 'MOMENTUM',
    OPPORTUNITY_MISSED_CLOSE: 'PRESSURE',
    OPPORTUNITY_MISSED_ACCESS: 'PRESSURE',
    INACTIVITY_WARNING: 'PRESSURE',
    OPPORTUNITY_RELEASED: 'OPPORTUNITY',
    OPPORTUNITY_HIGH_FIT: 'OPPORTUNITY',
    OPPORTUNITY_MOVING_FAST: 'OPPORTUNITY',
    OPPORTUNITY_EARLY_WINDOW: 'OPPORTUNITY',
    OPPORTUNITY_DOMAIN_MATCH: 'OPPORTUNITY',
  };

  return classMap[event] || 'VALIDATION';
}