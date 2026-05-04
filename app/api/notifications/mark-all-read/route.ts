/**
 * Mark All Read API - Return Engine
 * 
 * POST /api/notifications/mark-all-read - Mark all notifications as read
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';

/**
 * POST /api/notifications/mark-all-read
 * 
 * Mark all unread notifications as read for authenticated user
 * 
 * Optional body:
 * - class: string - Only mark notifications of this class
 */
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { class: notificationClass } = body;

    // Build where clause
    const where: any = {
      userId: user.id,
      read: false,
    };

    if (notificationClass) {
      where.notificationClass = notificationClass;
    }

    // Mark all as read
    const result = await prisma.notification.updateMany({
      where,
      data: { read: true },
    });

    return createApiResponse({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error('Error marking all read:', error);
    return createErrorResponse('Failed to mark all as read', 500);
  }
});