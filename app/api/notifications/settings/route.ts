/**
 * Notification Settings API - Return Engine
 * 
 * GET /api/notifications/settings - Get user's notification preferences
 * PUT /api/notifications/settings - Update user's notification preferences
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';

// ==========================================
// GET /api/notifications/settings
// ==========================================

/**
 * Get notification settings for authenticated user
 */

export const GET = withAuth(async (req, user) => {
    try {
      let settings = await prisma.userNotificationSettings.findUnique({
        where: { userId: user.id },
      });

      // Create default settings if not exists
      if (!settings) {
        settings = await prisma.userNotificationSettings.create({
          data: { userId: user.id },
        });
      }

      return createApiResponse(settings);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return createErrorResponse('Failed to fetch settings', 500);
    }
  });

// ==========================================
// PUT /api/notifications/settings
// ==========================================

/**
 * Update notification settings for authenticated user
 * 
 * Body:
 * - validationEnabled: boolean
 * - expansionEnabled: boolean
 * - momentumEnabled: boolean
 * - pressureEnabled: boolean
 * - opportunityEnabled: boolean
 * - inAppEnabled: boolean
 * - emailEnabled: boolean
 * - pushEnabled: boolean
 * - quietHoursStart: number (0-23)
 * - quietHoursEnd: number (0-23)
 * - timezone: string
 * - digestFrequency: 'real_time' | 'daily' | 'weekly'
 * - digestTime: number (0-23)
 */

export const PUT = withAuth(async (req, user) => {
    try {
      const body = await req.json();

      // Validate input
      const validKeys = [
        'validationEnabled',
        'expansionEnabled',
        'momentumEnabled',
        'pressureEnabled',
        'opportunityEnabled',
        'inAppEnabled',
        'emailEnabled',
        'pushEnabled',
        'quietHoursStart',
        'quietHoursEnd',
        'timezone',
        'digestFrequency',
        'digestTime',
      ];

      const updateData: Record<string, any> = {};
      for (const key of validKeys) {
        if (body[key] !== undefined) {
          updateData[key] = body[key];
        }
      }

      // Validate quiet hours
      if (
        updateData.quietHoursStart !== undefined &&
        (updateData.quietHoursStart < 0 || updateData.quietHoursStart > 23)
      ) {
        return createErrorResponse('quietHoursStart must be between 0 and 23', 400);
      }
      if (
        updateData.quietHoursEnd !== undefined &&
        (updateData.quietHoursEnd < 0 || updateData.quietHoursEnd > 23)
      ) {
        return createErrorResponse('quietHoursEnd must be between 0 and 23', 400);
      }

      // Validate digest frequency
      if (
        updateData.digestFrequency !== undefined &&
        !['real_time', 'daily', 'weekly'].includes(updateData.digestFrequency)
      ) {
        return createErrorResponse('digestFrequency must be real_time, daily, or weekly', 400);
      }

      // Upsert settings
      const settings = await prisma.userNotificationSettings.upsert({
        where: { userId: user.id },
        update: updateData,
        create: {
          userId: user.id,
          ...updateData,
        },
      });

      return createApiResponse(settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return createErrorResponse('Failed to update settings', 500);
    }
  });
