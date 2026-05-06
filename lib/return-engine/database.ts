/**
 * BTP Return Engine - Database Layer
 * 
 * Handles persistence for notifications, batches, and user settings
 * 
 * ARCHITECTURE:
 * - Prisma-based persistence
 * - Optimized queries for notification center
 * - Batch aggregation support
 */

import { prisma } from '@/lib/prisma';

// Application-level types
export type NotificationClass = 'VALIDATION' | 'EXPANSION' | 'MOMENTUM' | 'PRESSURE' | 'OPPORTUNITY';
export type NotificationPriority = 'P1' | 'P2' | 'P3';
export type DeliverySurface = 'in_app' | 'push' | 'email' | 'badge';
export type DisplayTime = 'just_now' | 'earlier' | 'today' | 'yesterday' | 'this_week' | 'a_while_back';

// Application-level notification type with display time
export interface Notification {
  id: string;
  variantId: string;
  userId: string;
  notificationClass: string;
  priority: string;
  copy: string;
  contextSnippet: string | null;
  relatedPostId: string | null;
  relatedThreadId: string | null;
  relatedOpportunityId: string | null;
  relatedPatternId: string | null;
  relatedMatchId: string | null;
  read: boolean;
  dismissed: boolean;
  surfaces: string[];
  deliveredTo: string[];
  sentAt: Date | null;
  createdAt: Date;
  scheduledFor: Date | null;
  batchId: string | null;
  batchCount: number;
  displayTime: DisplayTime;
}

// User notification settings - matches Prisma schema
export interface UserNotificationSettings {
  id: string;
  userId: string;
  validationEnabled: boolean;
  expansionEnabled: boolean;
  momentumEnabled: boolean;
  pressureEnabled: boolean;
  opportunityEnabled: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  timezone: string | null;
  digestFrequency: string;
  digestTime: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// TIME BUCKETING
// ==========================================

export const TIME_BUCKETS: Record<string, { min: number; max: number }> = {
  just_now: { min: 0, max: 15 * 60 * 1000 },        // 0-15 minutes
  earlier: { min: 15 * 60 * 1000, max: 2 * 60 * 60 * 1000 }, // 15 min - 2 hours
  today: { min: 2 * 60 * 60 * 1000, max: 24 * 60 * 60 * 1000 }, // 2-24 hours
  yesterday: { min: 24 * 60 * 60 * 1000, max: 48 * 60 * 60 * 1000 }, // 24-48 hours
  this_week: { min: 48 * 60 * 60 * 1000, max: 7 * 24 * 60 * 60 * 1000 }, // 2-7 days
  a_while_back: { min: 7 * 24 * 60 * 60 * 1000, max: Infinity }, // 7+ days
};

/**
 * Calculate display time bucket for a notification
 */
function calculateDisplayTime(createdAt: Date): DisplayTime {
  const ageMs = Date.now() - createdAt.getTime();
  
  for (const [bucket, range] of Object.entries(TIME_BUCKETS)) {
    if (ageMs >= range.min && ageMs < range.max) {
      return bucket as DisplayTime;
    }
  }
  
  return 'a_while_back';
}

/**
 * Map Prisma notification to application notification
 */
function mapNotification(n: any): Notification {
  return {
    ...n,
    displayTime: calculateDisplayTime(n.createdAt),
  };
}

// ==========================================
// NOTIFICATION QUERIES
// ==========================================

/**
 * Create a new notification
 */
export async function createNotification(notification: {
  userId: string;
  variantId: string;
  notificationClass: NotificationClass;
  priority: NotificationPriority;
  copy: string;
  contextSnippet?: string;
  relatedPostId?: string;
  relatedThreadId?: string;
  relatedOpportunityId?: string;
  relatedPatternId?: string;
  relatedMatchId?: string;
  surfaces: DeliverySurface[];
  scheduledFor?: Date;
  batchId?: string;
}): Promise<Notification> {
  const created = await prisma.notification.create({
    data: {
      userId: notification.userId,
      variantId: notification.variantId,
      notificationClass: notification.notificationClass,
      priority: notification.priority,
      copy: notification.copy,
      contextSnippet: notification.contextSnippet,
      relatedPostId: notification.relatedPostId,
      relatedThreadId: notification.relatedThreadId,
      relatedOpportunityId: notification.relatedOpportunityId,
      relatedPatternId: notification.relatedPatternId,
      relatedMatchId: notification.relatedMatchId,
      surfaces: notification.surfaces,
      scheduledFor: notification.scheduledFor,
      batchId: notification.batchId,
    },
  });
  
  return mapNotification(created);
}

/**
 * Get notifications for a user (notification center)
 */
export async function getUserNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
    classes?: NotificationClass[];
  } = {}
): Promise<Notification[]> {
  const { unreadOnly = false, limit = 50, offset = 0, classes } = options;

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { read: false }),
      ...(classes && classes.length > 0 && {
        notificationClass: { in: classes },
      }),
      dismissed: false,
    },
    orderBy: [
      { priority: 'asc' }, // P1 first, then P2, then P3
      { createdAt: 'desc' },
    ],
    take: limit,
    skip: offset,
  });
  
  return notifications.map(mapNotification);
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
      dismissed: false,
    },
  });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<Notification | null> {
  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  
  return mapNotification(updated);
}

/**
 * Mark notification as dismissed
 */
export async function markAsDismissed(notificationId: string): Promise<Notification | null> {
  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { dismissed: true },
  });
  
  return mapNotification(updated);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
      dismissed: false,
    },
    data: { read: true },
  });
  
  return result.count;
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await prisma.notification.delete({
    where: { id: notificationId },
  });
}

// ==========================================
// BATCH QUERIES
// ==========================================

/**
 * Create a notification batch
 */
export async function createBatch(batch: {
  userId: string;
  variantId: string;
  notificationClass: NotificationClass;
  count: number;
  relatedIds: string[];
  scheduledFor: Date;
}): Promise<any> {
  return prisma.notificationBatch.create({
    data: {
      userId: batch.userId,
      variantId: batch.variantId,
      notificationClass: batch.notificationClass,
      count: batch.count,
      relatedIds: batch.relatedIds,
      scheduledFor: batch.scheduledFor,
    },
  });
}

/**
 * Get pending batches ready to send
 */
export async function getPendingBatches(): Promise<any[]> {
  return prisma.notificationBatch.findMany({
    where: {
      status: 'pending',
      scheduledFor: { lte: new Date() },
    },
    include: {
      notifications: true,
    },
  });
}

/**
 * Update batch status
 */
export async function updateBatchStatus(
  batchId: string,
  status: string
): Promise<void> {
  await prisma.notificationBatch.update({
    where: { id: batchId },
    data: { status },
  });
}

// ==========================================
// USER SETTINGS QUERIES
// ==========================================

/**
 * Get user notification settings
 */
export async function getUserSettings(userId: string): Promise<UserNotificationSettings | null> {
  const settings = await prisma.userNotificationSettings.findUnique({
    where: { userId },
  });
  
  if (!settings) {
    // Create default settings
    return createDefaultSettings(userId);
  }
  
  return settings as unknown as UserNotificationSettings;
}

/**
 * Create default settings for a user
 */
export async function createDefaultSettings(userId: string): Promise<UserNotificationSettings> {
  const settings = await prisma.userNotificationSettings.create({
    data: {
      userId,
      validationEnabled: true,
      expansionEnabled: true,
      momentumEnabled: true,
      pressureEnabled: true,
      opportunityEnabled: true,
      inAppEnabled: true,
      emailEnabled: true,
      pushEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: null,
      digestFrequency: 'daily',
      digestTime: null,
    },
  });
  
  return settings as unknown as UserNotificationSettings;
}

/**
 * Update user notification settings
 */
export async function updateUserSettings(
  userId: string,
  updates: Partial<UserNotificationSettings>
): Promise<UserNotificationSettings> {
  const settings = await prisma.userNotificationSettings.upsert({
    where: { userId },
    update: {
      validationEnabled: updates.validationEnabled,
      expansionEnabled: updates.expansionEnabled,
      momentumEnabled: updates.momentumEnabled,
      pressureEnabled: updates.pressureEnabled,
      opportunityEnabled: updates.opportunityEnabled,
      inAppEnabled: updates.inAppEnabled,
      emailEnabled: updates.emailEnabled,
      pushEnabled: updates.pushEnabled,
      quietHoursStart: updates.quietHoursStart,
      quietHoursEnd: updates.quietHoursEnd,
      timezone: updates.timezone,
      digestFrequency: updates.digestFrequency,
      digestTime: updates.digestTime,
    },
    create: {
      userId,
      validationEnabled: updates.validationEnabled ?? true,
      expansionEnabled: updates.expansionEnabled ?? true,
      momentumEnabled: updates.momentumEnabled ?? true,
      pressureEnabled: updates.pressureEnabled ?? true,
      opportunityEnabled: updates.opportunityEnabled ?? true,
      inAppEnabled: updates.inAppEnabled ?? true,
      emailEnabled: updates.emailEnabled ?? true,
      pushEnabled: updates.pushEnabled ?? false,
      quietHoursStart: updates.quietHoursStart ?? null,
      quietHoursEnd: updates.quietHoursEnd ?? null,
      timezone: updates.timezone ?? null,
      digestFrequency: updates.digestFrequency ?? 'daily',
      digestTime: updates.digestTime ?? null,
    },
  });
  
  return settings as unknown as UserNotificationSettings;
}

// ==========================================
// CLEANUP
// ==========================================

/**
 * Delete old notifications (older than 30 days)
 */
export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      read: true,
      dismissed: true,
    },
  });
  
  return result.count;
}