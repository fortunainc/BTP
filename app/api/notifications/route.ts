/**
 * Notifications API - Return Engine
 * 
 * GET /api/notifications - Get user's notifications
 * POST /api/notifications - Create a notification (internal use)
 * 
 * Architecture:
 * - Notification center data for authenticated users
 * - State-change notifications, NOT activity alerts
 * - No social mechanics exposed
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { ReturnEngine } from '@/lib/return-engine/engine';
import { TriggerContext, TriggerEvent } from '@/lib/return-engine/types';

// ==========================================
// GET /api/notifications
// ==========================================

/**
 * Get notifications for authenticated user
 * 
 * Query params:
 * - unreadOnly: boolean - Only return unread notifications
 * - limit: number - Max notifications to return (default 50)
 * - offset: number - Pagination offset
 * - class: string - Filter by notification class (VALIDATION, EXPANSION, etc.)
 */

export const GET = withAuth(async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const unreadOnly = searchParams.get('unreadOnly') === 'true';
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');
      const classFilter = searchParams.get('class');

      // Build where clause.
      // Private alpha: scheduled check-ins should not appear until their scheduled window.
      const deliverableWindow = {
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: new Date() } },
        ],
      };

      const where: any = {
        userId: user.id,
        dismissed: false,
        ...deliverableWindow,
      };

      if (unreadOnly) {
        where.read = false;
      }

      if (classFilter) {
        where.notificationClass = classFilter;
      }

      // Get notifications and counts
      const [notifications, totalCount, unreadCount, unreadByClass] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: [
            { priority: 'asc' },
            { createdAt: 'desc' },
          ],
          take: limit,
          skip: offset,
        }),
        prisma.notification.count({ where: { userId: user.id, dismissed: false, ...deliverableWindow } }),
        prisma.notification.count({ where: { userId: user.id, read: false, dismissed: false, ...deliverableWindow } }),
        prisma.notification.groupBy({
          by: ['notificationClass'],
          where: { userId: user.id, read: false, dismissed: false, ...deliverableWindow },
          _count: { id: true },
        }),
      ]);

      // Format unread by class
      const classCounts: Record<string, number> = {
        VALIDATION: 0,
        EXPANSION: 0,
        MOMENTUM: 0,
        PRESSURE: 0,
        OPPORTUNITY: 0,
      };
      unreadByClass.forEach((item) => {
        classCounts[item.notificationClass] = item._count.id;
      });

      // Add display time bucket to each notification
      const formattedNotifications = notifications.map((n) => ({
        ...n,
        displayTime: getTimeBucket(n.createdAt),
      }));

      return createApiResponse({
        notifications: formattedNotifications,
        totalCount,
        unreadCount,
        unreadByClass: classCounts,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return createErrorResponse('Failed to fetch notifications', 500);
    }
  });

// ==========================================
// POST /api/notifications
// ==========================================

/**
 * Create a notification (internal API)
 * 
 * Body:
 * - event: TriggerEvent
 * - targetUserId: string
 * - actorId: string
 * - postId, contributionId, matchId, etc. (optional)
 * - eventData: object (optional)
 */

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const { event, targetUserId, actorId, ...eventData } = body;

    if (!event || !targetUserId) {
      return createErrorResponse('Missing required fields: event, targetUserId', 400);
    }

    // Build trigger context
    const context: TriggerContext = {
      event: event as TriggerEvent,
      timestamp: new Date(),
      actorId: actorId || 'system',
      actorTrustWeight: 1.0,
      targetUserId,
      ...eventData,
    };

    // Process through Return Engine
    const engine = new ReturnEngine();
    const notifications = await engine.processTrigger(context);

    return createApiResponse({
      success: true,
      created: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return createErrorResponse('Failed to create notification', 500);
  }
});

// ==========================================
// Helper Functions
// ==========================================

/**
 * Convert timestamp to display bucket (anonymity-preserving)
 */
function getTimeBucket(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(createdAt).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 30) {
    return 'just_now';
  } else if (diffHours < 2) {
    return 'earlier';
  } else if (diffHours < 24 && now.getDate() === new Date(createdAt).getDate()) {
    return 'today';
  } else if (diffDays === 1 || (diffDays === 0 && now.getDate() !== new Date(createdAt).getDate())) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return 'this_week';
  } else {
    return 'a_while_back';
  }
}
