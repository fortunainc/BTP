/**
 * Trust & Safety Investigation Panel API
 * 
 * RESTRICTED: This endpoint requires reason-logged access.
 * All access is comprehensively logged.
 * IdentityMap lookups are only allowed with valid investigation reasons.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInvestigationAccess, verifyAdminAccess, VALID_INVESTIGATION_REASONS } from '@/lib/admin-auth';
import { logAdminAccess } from '@/lib/analytics-tracker';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'overview';
  
  // For most actions, just verify admin access
  const adminAuth = await verifyAdminAccess(request);
  
  if (!adminAuth.success) {
    return NextResponse.json(
      { error: adminAuth.error },
      { status: adminAuth.statusCode || 403 }
    );
  }
  
  try {
    let data: Record<string, unknown> = {};
    
    switch (action) {
      case 'overview':
        data = await getSafetyOverview();
        break;
      case 'flagged':
        data = await getFlaggedContent();
        break;
      case 'investigations':
        data = await getRecentInvestigations();
        break;
      case 'audit_logs':
        data = await getAuditLogs(searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50);
        break;
      case 'high_risk':
        data = await getHighRiskItems();
        break;
      case 'identity_lookup':
        // This requires reason-logged access
        return handleIdentityLookup(request, searchParams.get('anonymousUserId'));
      default:
        data = await getSafetyOverview();
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Trust & Safety API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

/**
 * POST endpoint for investigations requiring reason
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { reason, targetAnonymousId, investigationType } = body;
  
  // Verify investigation access with reason
  const investigationAuth = await verifyInvestigationAccess(request, reason);
  
  if (!investigationAuth.success) {
    return NextResponse.json(
      { error: investigationAuth.error },
      { status: investigationAuth.statusCode || 403 }
    );
  }
  
  // Perform identity lookup if requested
  if (investigationType === 'identity_lookup' && targetAnonymousId) {
    const identityMap = await prisma.identityMap.findUnique({
      where: { anonymousUserId: targetAnonymousId },
    });
    
    if (identityMap) {
      // Update access tracking
      await prisma.identityMap.update({
        where: { anonymousUserId: targetAnonymousId },
        data: {
          lastAccessedAt: new Date(),
          accessCount: { increment: 1 },
        },
      });
      
      // Log the identity lookup
      await logAdminAccess({
        adminUserId: investigationAuth.userId!,
        action: 'identity_lookup',
        reason: reason,
        targetType: 'IdentityMap',
        targetId: targetAnonymousId,
        fieldsAccessed: ['realUserId'],
      });
      
      return NextResponse.json({
        success: true,
        data: {
          anonymousUserId: identityMap.anonymousUserId,
          realUserId: identityMap.realUserId,
          lookupReason: reason,
          accessedAt: new Date().toISOString(),
        },
        warning: 'This identity lookup is logged and audited.',
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'No identity mapping found for this anonymous ID.',
    }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Investigation access granted.',
    reason,
  });
}

/**
 * Handle identity lookup with reason requirement
 */
async function handleIdentityLookup(request: NextRequest, anonymousUserId: string | null) {
  if (!anonymousUserId) {
    return NextResponse.json({
      error: 'anonymousUserId parameter required for identity lookup.',
    }, { status: 400 });
  }
  
  // This should only be called via POST with reason
  return NextResponse.json({
    error: 'Identity lookup requires POST request with reason in body.',
    validReasons: VALID_INVESTIGATION_REASONS,
  }, { status: 405 });
}

/**
 * Get safety overview
 */
async function getSafetyOverview() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const recentMetrics = await prisma.dailyMetrics.findMany({
    where: {
      dateBucket: { gte: thirtyDaysAgo },
    },
    orderBy: { dateBucket: 'desc' },
    take: 30,
  });
  
  const safetyEvents = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    where: {
      eventCategory: 'safety',
      createdAtBucket: { gte: thirtyDaysAgo },
    },
    _count: true,
  });
  
  return {
    totals: {
      flagged: recentMetrics.reduce((sum, m) => sum + m.flaggedContent, 0),
      redactions: recentMetrics.reduce((sum, m) => sum + m.redactionsApplied, 0),
      highRisk: recentMetrics.reduce((sum, m) => sum + m.highRiskPosts, 0),
    },
    events: safetyEvents.map(e => ({ type: e.eventType, count: e._count })),
  };
}

/**
 * Get flagged content
 */
async function getFlaggedContent() {
  // Get flagged content from analytics events
  const flaggedEvents = await prisma.analyticsEvent.findMany({
    where: {
      eventType: 'content_flagged',
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  
  return {
    items: flaggedEvents.map(e => ({
      id: e.id,
      anonymousUserId: e.anonymousUserId,
      objectType: e.objectType,
      objectId: e.objectId,
      dateBucket: e.createdAtBucket,
    })),
    total: flaggedEvents.length,
  };
}

/**
 * Get recent investigations
 */
async function getRecentInvestigations() {
  const logs = await prisma.adminAccessLog.findMany({
    where: {
      action: { in: ['investigation_access', 'identity_lookup', 'trust_safety_investigation_opened'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  
  return {
    investigations: logs,
    total: logs.length,
  };
}

/**
 * Get audit logs
 */
async function getAuditLogs(limit: number = 50) {
  const logs = await prisma.adminAccessLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  
  return {
    logs: logs.map(log => ({
      id: log.id,
      adminUserId: log.adminUserId,
      action: log.action,
      reason: log.reason,
      targetType: log.targetType,
      targetId: log.targetId,
      fieldsAccessed: log.fieldsAccessed,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    })),
    total: logs.length,
  };
}

/**
 * Get high risk items
 */
async function getHighRiskItems() {
  const highRiskEvents = await prisma.analyticsEvent.findMany({
    where: {
      eventType: { in: ['high_risk_content_detected', 'suspicious_org_behavior', 'fake_job_probe_detected'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  
  return {
    items: highRiskEvents.map(e => ({
      id: e.id,
      type: e.eventType,
      anonymousUserId: e.anonymousUserId,
      objectType: e.objectType,
      objectId: e.objectId,
      dateBucket: e.createdAtBucket,
    })),
    total: highRiskEvents.length,
  };
}