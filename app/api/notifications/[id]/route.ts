/**
 * Notification Detail API - Return Engine
 *
 * PATCH /api/notifications/[id] - Mark as read/dismissed/opened/clicked
 * DELETE /api/notifications/[id] - Dismiss notification
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { getOrCreateUserMetrics, trackEvent, EVENT_TYPES } from '@/lib/analytics-tracker';

export const PATCH = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop() || '';
    const body = await request.json();
    const { read, dismissed, opened, clicked } = body;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    if (notification.userId !== user.id) {
      return createErrorResponse('Unauthorized', 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        ...(read !== undefined && { read }),
        ...(dismissed !== undefined && { dismissed }),
        ...((opened || clicked) && { read: true }),
      },
    });

    if (opened || clicked) {
      const metrics = await getOrCreateUserMetrics(user.id, 'operator');
      await trackEvent({
        anonymousUserId: metrics.anonymousUserId,
        eventType: opened ? EVENT_TYPES.ENGAGEMENT.NOTIFICATION_OPENED : EVENT_TYPES.ENGAGEMENT.NOTIFICATION_CLICKED,
        eventCategory: 'engagement',
        objectType: 'Notification',
        objectId: id,
        metadata: {
          variantId: notification.variantId,
          notificationClass: notification.notificationClass,
          relatedPostId: notification.relatedPostId,
          returnLoop: true,
          privacySafe: true,
        },
      });

      if (clicked && notification.relatedPostId) {
        await trackEvent({
          anonymousUserId: metrics.anonymousUserId,
          eventType: 'return_loop_notification_clickthrough',
          eventCategory: 'engagement',
          objectType: 'Contribution',
          objectId: notification.relatedPostId,
          metadata: {
            notificationId: id,
            variantId: notification.variantId,
            returnLoop: true,
          },
        });
      }
    }

    return createApiResponse(updated);
  } catch (error) {
    console.error('Error updating notification:', error);
    return createErrorResponse('Failed to update notification', 500);
  }
}, { requireAuth: true });

export const DELETE = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop() || '';

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    if (notification.userId !== user.id) {
      return createErrorResponse('Unauthorized', 403);
    }

    await prisma.notification.update({
      where: { id },
      data: { dismissed: true },
    });

    return createApiResponse({ success: true });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return createErrorResponse('Failed to dismiss notification', 500);
  }
}, { requireAuth: true });
