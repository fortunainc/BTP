/**
 * Founder Analytics Dashboard API
 * 
 * CRITICAL: This endpoint is role-gated via Clerk and audit logged.
 * All data is anonymized - no real user identities exposed.
 * No hardcoded admin keys - only Clerk authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { toDateBucket, toWeekBucket, toMonthBucket, type DataSource } from '@/lib/analytics-tracker';
   import type { AnalyticsEvent, DailyMetrics, UserMetrics } from '@prisma/client';
   
   // Types for reduce callbacks
   type MetricTotals = { posts: number; reflections: number; consults: number; revenue: number };
   type EventTotals = { count: number; uniqueUsers: Set<string> };

// Valid data sources for filtering
const VALID_DATA_SOURCES: DataSource[] = ['REAL', 'SEEDED', 'TEST', 'IMPORTED'];

export async function GET(request: NextRequest) {
  // Verify admin access via Clerk
  const adminAuth = await verifyAdminAccess(request);
  
  if (!adminAuth.success) {
    return NextResponse.json(
      { error: adminAuth.error },
      { status: adminAuth.statusCode || 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section') || 'overview';
  const startDate = searchParams.get('start') || toDateBucket(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const endDate = searchParams.get('end') || toDateBucket();
  
  // Data source filter - defaults to REAL only
  const dataSourceParam = searchParams.get('dataSource');
  const dataSources: DataSource[] = dataSourceParam 
    ? dataSourceParam.split(',').filter((ds): ds is DataSource => VALID_DATA_SOURCES.includes(ds as DataSource))
    : ['REAL']; // Default to REAL only

  try {
    let data: Record<string, unknown> = {};
    
    switch (section) {
      case 'overview':
        data = await getOverviewData(dataSources);
        break;
      case 'growth':
        data = await getGrowthData(startDate, endDate, dataSources);
        break;
      case 'engagement':
        data = await getEngagementData(startDate, endDate, dataSources);
        break;
      case 'contributions':
        data = await getContributionData(startDate, endDate, dataSources);
        break;
      case 'reflections':
        data = await getReflectionData(startDate, endDate, dataSources);
        break;
      case 'micro-opportunities':
        data = await getMicroOpportunityData(startDate, endDate, dataSources);
        break;
      case 'return-loop':
        data = await getReturnLoopData(startDate, endDate, dataSources);
        break;
      case 'marketplace':
        data = await getMarketplaceData(startDate, endDate, dataSources);
        break;
      case 'safety':
        data = await getSafetyData(startDate, endDate, dataSources);
        break;
      case 'users':
        data = await getUserAnalytics(startDate, endDate, dataSources);
        break;
      case 'kpis':
        data = await getKPIScoreboard(dataSources);
        break;
      case 'retention':
        data = await getRetentionMetrics(dataSources);
        break;
      case 'funnels':
        data = await getFunnelData(dataSources);
        break;
      case 'readiness':
        data = await getReadinessData(dataSources);
        break;
      default:
        data = await getOverviewData(dataSources);
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      meta: {
        dataSource: dataSources,
        generatedAt: new Date().toISOString(),
        adminUser: adminAuth.handle,
      }
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

/**
 * Build where clause for data source filtering
 */
function buildDataSourceFilter(dataSources: DataSource[]) {
  return {
    dataSource: { in: dataSources }
  };
}

/**
 * Executive Overview - High-level metrics
 */
async function getOverviewData(dataSources: DataSource[]) {
  const today = toDateBucket();
  const thirtyDaysAgo = toDateBucket(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  
  // Get latest daily metrics for REAL data only
  const latestMetrics = await prisma.dailyMetrics.findFirst({
    where: buildDataSourceFilter(dataSources),
    orderBy: { dateBucket: 'desc' },
  });
  
  // Get totals from user metrics
  const userMetrics = await prisma.userMetrics.aggregate({
    where: buildDataSourceFilter(dataSources),
    _count: true,
    _sum: {
      postCount: true,
      interactionCount: true,
      reflectionOpenCount: true,
      opportunityInviteCount: true,
      microConsultCount: true,
      revenueGeneratedCents: true,
    },
  });
  
  // Get recent daily metrics for trends
  const recentMetrics = await prisma.dailyMetrics.findMany({
    where: {
      ...buildDataSourceFilter(dataSources),
      dateBucket: { gte: thirtyDaysAgo },
    },
    orderBy: { dateBucket: 'asc' },
  });
  
  // Calculate totals from recent metrics
  const totals = recentMetrics.reduce((acc, m) => ({
    posts: acc.posts + m.postsCreated,
    reflections: acc.reflections + m.reflectionsSent,
    consults: acc.consults + m.consultsCompleted,
    revenue: acc.revenue + m.platformRevenueCents,
  }), { posts: 0, reflections: 0, consults: 0, revenue: 0 });
  
  return {
    users: {
      total: latestMetrics?.totalUsers || 0,
      verifiedOperators: latestMetrics?.verifiedOperators || 0,
      verifiedOrgs: latestMetrics?.verifiedOrgs || 0,
    },
    posts: {
      total: userMetrics._sum.postCount || 0,
      last30Days: totals.posts,
    },
    reflections: {
      total: userMetrics._sum.reflectionOpenCount || 0,
      last30Days: totals.reflections,
    },
    microConsults: {
      total: userMetrics._sum.microConsultCount || 0,
      last30Days: totals.consults,
    },
    revenue: {
      totalCents: userMetrics._sum.revenueGeneratedCents || 0,
      last30DaysCents: totals.revenue,
      formatted: formatCurrency(userMetrics._sum.revenueGeneratedCents || 0),
    },
    retention: {
      sevenDay: calculatePercentage(latestMetrics?.dau || 0, latestMetrics?.totalUsers || 1),
      thirtyDay: calculatePercentage(recentMetrics.length > 0 ? recentMetrics[recentMetrics.length - 1].dau : 0, latestMetrics?.totalUsers || 1),
    },
  };
}

/**
 * Growth metrics
 */
async function getGrowthData(startDate: string, endDate: string, dataSources: DataSource[]) {
  const dailyMetrics = await prisma.dailyMetrics.findMany({
    where: {
      ...buildDataSourceFilter(dataSources),
      dateBucket: { gte: startDate, lte: endDate },
    },
    orderBy: { dateBucket: 'asc' },
  });
  
  const userMetrics = await prisma.userMetrics.groupBy({
    by: ['roleType', 'verificationStatus'],
    where: buildDataSourceFilter(dataSources),
    _count: true,
  });
  
  return {
    daily: dailyMetrics.map(m => ({
      date: m.dateBucket,
      newUsers: m.newUsers,
      totalUsers: m.totalUsers,
      verifiedOperators: m.verifiedOperators,
      verifiedOrgs: m.verifiedOrgs,
    })),
    byRole: userMetrics,
    totals: {
      totalUsers: dailyMetrics.length > 0 ? dailyMetrics[dailyMetrics.length - 1].totalUsers : 0,
      newUsersPeriod: dailyMetrics.reduce((sum, m) => sum + m.newUsers, 0),
    },
  };
}

/**
 * Engagement metrics
 */
async function getEngagementData(startDate: string, endDate: string, dataSources: DataSource[]) {
  const events = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    where: {
      ...buildDataSourceFilter(dataSources),
      eventCategory: 'engagement',
      createdAtBucket: { gte: startDate, lte: endDate },
    },
    _count: true,
  });
  
  const dailyMetrics = await prisma.dailyMetrics.findMany({
    where: {
      ...buildDataSourceFilter(dataSources),
      dateBucket: { gte: startDate, lte: endDate },
    },
    orderBy: { dateBucket: 'asc' },
  });
  
  return {
    events: events.map(e => ({ type: e.eventType, count: e._count })),
    daily: dailyMetrics.map(m => ({
      date: m.dateBucket,
      dau: m.dau,
      sessions: m.sessions,
      notificationsSent: m.notificationsSent,
      notificationsOpened: m.notificationsOpened,
    })),
    notificationOpenRate: calculatePercentage(
      dailyMetrics.reduce((sum, m) => sum + m.notificationsOpened, 0),
      dailyMetrics.reduce((sum, m) => sum + m.notificationsSent, 0) || 1
    ),
  };
}

/**
 * Contribution quality metrics
 */
async function getContributionData(startDate: string, endDate: string, dataSources: DataSource[]) {
  const events = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    where: {
      ...buildDataSourceFilter(dataSources),
      eventCategory: 'situation',
      createdAtBucket: { gte: startDate, lte: endDate },
    },
    _count: true,
  });
  
  return {
    events: events.map(e => ({ type: e.eventType, count: e._count })),
    total: events.reduce((sum, e) => sum + e._count, 0),
  };
}

/**
 * Reflection loop metrics
 */
async function getReflectionData(startDate: string, endDate: string, dataSources: DataSource[]) {
  const events = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    where: {
      ...buildDataSourceFilter(dataSources),
      eventCategory: 'situation',
      eventType: { in: ['reflection_generated', 'reflection_opened', 'reflection_scheduled'] },
      createdAtBucket: { gte: startDate, lte: endDate },
    },
    _count: true,
  });
  
  const dailyMetrics = await prisma.dailyMetrics.findMany({
    where: {
      ...buildDataSourceFilter(dataSources),
      dateBucket: { gte: startDate, lte: endDate },
    },
  });
  
  const reflectionsSent = dailyMetrics.reduce((sum, m) => sum + m.reflectionsSent, 0);
  const reflectionsOpened = dailyMetrics.reduce((sum, m) => sum + m.reflectionsOpened, 0);
  
  return {
    events: events.map(e => ({ type: e.eventType, count: e._count })),
    openRate: calculatePercentage(reflectionsOpened, reflectionsSent || 1),
    total: { sent: reflectionsSent, opened: reflectionsOpened },
  };
}

/**
 * Micro-opportunity funnel metrics
 */
async function getMicroOpportunityData(startDate: string, endDate: string, dataSources: DataSource[]) {
  const events = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    where: {
      ...buildDataSourceFilter(dataSources),
      eventCategory: 'micro_opportunity',
      createdAtBucket: { gte: startDate, lte: endDate },
    },
    _count: true,
  });
  
  const dailyMetrics = await prisma.dailyMetrics.findMany({
    where: {
      ...buildDataSourceFilter(dataSources),
      dateBucket: { gte: startDate, lte: endDate },
    },
  });
  
  return {
    events: events.map(e => ({ type: e.eventType, count: e._count })),
    totals: {
      created: dailyMetrics.reduce((sum, m) => sum + m.microOppsCreated, 0),
      invites: dailyMetrics.reduce((sum, m) => sum + m.operatorInvites, 0),
      interests: dailyMetrics.reduce((sum, m) => sum + m.operatorInterests, 0),
      completed: dailyMetrics.reduce((sum, m) => sum + m.consultsCompleted, 0),
    },
    revenue: {
      gmv: dailyMetrics.reduce((sum, m) => sum + m.gmvCents, 0),
      platformRevenue: dailyMetrics.reduce((sum, m) => sum + m.platformRevenueCents, 0),
      operatorPayouts: dailyMetrics.reduce((sum, m) => sum + m.operatorPayoutsCents, 0),
    },
  };
}


/**
 * Structured return-loop metrics
 *
 * Founder-facing only. This intentionally reports aggregate operational
 * health without usernames, profiles, exact timestamps, or public ranking.
 */
async function getReturnLoopData(startDate: string, endDate: string, dataSources: DataSource[]) {
  const includeSeeded = dataSources.includes('SEEDED') || dataSources.includes('TEST');
  const includeReal = dataSources.includes('REAL') || dataSources.includes('IMPORTED');

  const interactionSourceFilter =
    includeSeeded && !includeReal ? { isSeeded: true } :
    includeReal && !includeSeeded ? { isSeeded: false } :
    {};

  const interactionWhere = {
    ...interactionSourceFilter,
    createdAt: {
      gte: new Date(`${startDate}T00:00:00.000Z`),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    },
  };

  const [
    totalInteractions,
    withContext,
    highRiskContexts,
    highValueInteractions,
    interactionsByType,
    interactionsByStatus,
    interactedContributionIds,
    returnLoopEvents,
    notificationEvents,
    returnLoopNotifications,
  ] = await Promise.all([
    prisma.interaction.count({ where: interactionWhere }),
    prisma.interaction.count({ where: { ...interactionWhere, context: { not: null } } }),
    prisma.interaction.count({ where: { ...interactionWhere, correlationRisk: { gte: 0.7 } } }),
    prisma.interaction.count({ where: { ...interactionWhere, isHighValue: true } }),
    prisma.interaction.groupBy({
      by: ['interactionType'],
      where: interactionWhere,
      _count: true,
    }),
    prisma.interaction.groupBy({
      by: ['displayStatus'],
      where: interactionWhere,
      _count: true,
    }),
    prisma.interaction.findMany({
      where: interactionWhere,
      select: { contributionId: true },
      distinct: ['contributionId'],
    }),
    prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        ...buildDataSourceFilter(dataSources),
        eventType: {
          in: [
            'situation_submitted',
            'immediate_feedback_viewed',
            'second_situation_submitted',
            'interaction_clicked',
            'context_added',
            'reflection_opened',
            'return_to_interacted_situation',
            'return_loop_notification_sent',
            'return_loop_notification_clickthrough',
          ],
        },
        createdAtBucket: { gte: startDate, lte: endDate },
      },
      _count: true,
    }),
    prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        ...buildDataSourceFilter(dataSources),
        eventCategory: 'engagement',
        eventType: {
          in: ['notification_sent', 'notification_opened', 'notification_clicked'],
        },
        createdAtBucket: { gte: startDate, lte: endDate },
      },
      _count: true,
    }),
    prisma.notification.groupBy({
      by: ['notificationClass'],
      where: {
        variantId: {
          in: [
            'VAL-FIRST-SEEN',
            'EXP-TRIED-SIMILAR',
            'EXP-WORKED',
            'EXP-DIDNT-HOLD',
            'EXP-OTHER-ISSUES',
            'PRE-WORSE-LATER',
            'VAL-MANAGEABLE',
            'VAL-RETURN',
            'EXP-RETURN',
            'MOM-RETURN',
            'PRE-RETURN',
            'OPP-RETURN',
          ],
        },
        createdAt: {
          gte: new Date(`${startDate}T00:00:00.000Z`),
          lte: new Date(`${endDate}T23:59:59.999Z`),
        },
      },
      _count: true,
    }),
  ]);

  const contributionIds = interactedContributionIds.map(item => item.contributionId);
  const linkedMicroOpportunities = contributionIds.length > 0
    ? await prisma.microOpportunity.count({
        where: {
          contributionId: { in: contributionIds },
          createdAt: {
            gte: new Date(`${startDate}T00:00:00.000Z`),
            lte: new Date(`${endDate}T23:59:59.999Z`),
          },
        },
      })
    : 0;

  const eventsByType = Object.fromEntries(returnLoopEvents.map(event => [event.eventType, event._count]));
  const notificationEventsByType = Object.fromEntries(notificationEvents.map(event => [event.eventType, event._count]));
  const sent = notificationEventsByType.notification_sent || eventsByType.return_loop_notification_sent || 0;
  const opened = notificationEventsByType.notification_opened || 0;
  const clicked = notificationEventsByType.notification_clicked || 0;
  const clickthrough = eventsByType.return_loop_notification_clickthrough || 0;

  return {
    summary: {
      totalInteractions,
      interactedSituations: contributionIds.length,
      contextShareRate: calculatePercentage(withContext, totalInteractions || 1),
      highRiskReviewRate: calculatePercentage(highRiskContexts, totalInteractions || 1),
      highValueShareRate: calculatePercentage(highValueInteractions, totalInteractions || 1),
    },
    quality: {
      withContext,
      highRiskContexts,
      highValueInteractions,
      byStatus: interactionsByStatus.map(item => ({
        status: item.displayStatus,
        count: item._count,
      })),
      byType: interactionsByType.map(item => ({
        type: item.interactionType,
        count: item._count,
      })),
    },
    notifications: {
      sent,
      opened,
      clicked,
      clickthrough,
      openRate: calculatePercentage(opened, sent || 1),
      clickRate: calculatePercentage(clicked, sent || 1),
      clickthroughRate: calculatePercentage(clickthrough, sent || 1),
      byClass: returnLoopNotifications.map(item => ({
        class: item.notificationClass,
        count: item._count,
      })),
    },
    alphaKpis: {
      situationsSubmitted: eventsByType.situation_submitted || 0,
      immediateFeedbackViewed: eventsByType.immediate_feedback_viewed || 0,
      secondSubmissions: eventsByType.second_situation_submitted || 0,
      returnsToInteractedSituation: eventsByType.return_to_interacted_situation || 0,
      returnRate72h: 'tracked via submitter return events; calculate on REAL-only cohorts during alpha review',
      primaryKpi: '% submitters who return within 72 hours',
    },
    reflectionReturn: {
      reflectionsOpened: eventsByType.reflection_opened || 0,
      interactionClicks: eventsByType.interaction_clicked || 0,
      contextsAdded: eventsByType.context_added || withContext,
      reflectionToInteractionRate: calculatePercentage(
        eventsByType.interaction_clicked || totalInteractions,
        eventsByType.reflection_opened || totalInteractions || 1
      ),
    },
    microOpportunityLinkage: {
      linkedMicroOpportunities,
      linkageRate: calculatePercentage(linkedMicroOpportunities, contributionIds.length || 1),
      description: 'Micro-opportunities created from situations that received structured return-loop interaction.',
    },
    privacy: {
      note: 'Founder-only aggregate metrics. No usernames, profile codes, open-response chains, public reactions, popularity sorting, or exact small-cohort public display are exposed.',
      dataSourceInterpretation: 'Non-seeded interactions are treated as REAL/IMPORTED; founder-seeded interactions are treated as SEEDED/TEST for operational filtering.',
    },
  };
}


/**
 * Marketplace metrics
 */
async function getMarketplaceData(startDate: string, endDate: string, dataSources: DataSource[]) {
  const events = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    where: {
      ...buildDataSourceFilter(dataSources),
      eventCategory: 'marketplace',
      createdAtBucket: { gte: startDate, lte: endDate },
    },
    _count: true,
  });
  
  return {
    events: events.map(e => ({ type: e.eventType, count: e._count })),
    total: events.reduce((sum, e) => sum + e._count, 0),
  };
}

/**
 * Safety metrics
 */
async function getSafetyData(startDate: string, endDate: string, dataSources: DataSource[]) {
  const events = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    where: {
      ...buildDataSourceFilter(dataSources),
      eventCategory: 'safety',
      createdAtBucket: { gte: startDate, lte: endDate },
    },
    _count: true,
  });
  
  const dailyMetrics = await prisma.dailyMetrics.findMany({
    where: {
      ...buildDataSourceFilter(dataSources),
      dateBucket: { gte: startDate, lte: endDate },
    },
  });
  
  return {
    events: events.map(e => ({ type: e.eventType, count: e._count })),
    totals: {
      flagged: dailyMetrics.reduce((sum, m) => sum + m.flaggedContent, 0),
      redactions: dailyMetrics.reduce((sum, m) => sum + m.redactionsApplied, 0),
      highRisk: dailyMetrics.reduce((sum, m) => sum + m.highRiskPosts, 0),
    },
  };
}

/**
 * User analytics (anonymized)
 */
async function getUserAnalytics(startDate: string, endDate: string, dataSources: DataSource[]) {
  const users = await prisma.userMetrics.findMany({
    where: buildDataSourceFilter(dataSources),
    select: {
      anonymousUserId: true,
      roleType: true,
      verificationStatus: true,
      signupDateBucket: true,
      lastActiveBucket: true,
      postCount: true,
      interactionCount: true,
      reflectionOpenCount: true,
      microConsultCount: true,
      opportunityInviteCount: true,
      revenueGeneratedCents: true,
      retentionStatus: true,
    },
  });
  
  return {
    users,
    total: users.length,
    byRole: await prisma.userMetrics.groupBy({
      by: ['roleType'],
      where: buildDataSourceFilter(dataSources),
      _count: true,
    }),
  };
}

/**
 * KPI Scoreboard with thresholds
 */
async function getKPIScoreboard(dataSources: DataSource[]) {
  const userMetrics = await prisma.userMetrics.aggregate({
    where: buildDataSourceFilter(dataSources),
    _count: true,
    _sum: {
      postCount: true,
      reflectionOpenCount: true,
      microConsultCount: true,
      revenueGeneratedCents: true,
    },
  });
  
  const verifiedOperators = await prisma.userMetrics.count({
    where: {
      ...buildDataSourceFilter(dataSources),
      roleType: 'operator',
      verificationStatus: 'Verified',
    },
  });
  
  const verifiedOrgs = await prisma.userMetrics.count({
    where: {
      ...buildDataSourceFilter(dataSources),
      roleType: 'organization',
      verificationStatus: 'Verified',
    },
  });
  
  // Calculate repeat contributors (users with 2+ posts)
  const repeatContributors = await prisma.userMetrics.count({
    where: {
      ...buildDataSourceFilter(dataSources),
      postCount: { gte: 2 },
    },
  });
  
  // Calculate repeat earners (users with 2+ revenue events)
  const repeatEarners = await prisma.userMetrics.count({
    where: {
      ...buildDataSourceFilter(dataSources),
      microConsultCount: { gte: 2 },
    },
  });
  
  const totalUsers = userMetrics._count;
  const repeatContributorRate = calculatePercentage(repeatContributors, totalUsers || 1);
  
  // KPI thresholds
  const kpis = [
    {
      name: 'Verified Operators',
      value: verifiedOperators,
      thresholds: { red: 50, yellow: 100 },
      status: getThresholdStatus(verifiedOperators, 50, 100, 'higher'),
    },
    {
      name: 'High-Quality Situations',
      value: userMetrics._sum.postCount || 0,
      thresholds: { red: 50, yellow: 100 },
      status: getThresholdStatus(userMetrics._sum.postCount || 0, 50, 100, 'higher'),
    },
    {
      name: 'Repeat Contributor Rate',
      value: repeatContributorRate,
      unit: '%',
      thresholds: { red: 15, yellow: 30 },
      status: getThresholdStatus(repeatContributorRate, 15, 30, 'higher'),
    },
    {
      name: 'Reflection Open Rate',
      value: 0, // Would need actual calculation
      unit: '%',
      thresholds: { red: 40, yellow: 60 },
      status: 'red',
    },
    {
      name: 'Micro-Consults Completed',
      value: userMetrics._sum.microConsultCount || 0,
      thresholds: { red: 3, yellow: 10 },
      status: getThresholdStatus(userMetrics._sum.microConsultCount || 0, 3, 10, 'higher'),
    },
    {
      name: 'GMV',
      value: formatCurrency(userMetrics._sum.revenueGeneratedCents || 0),
      rawCents: userMetrics._sum.revenueGeneratedCents || 0,
      thresholds: { red: 100000, yellow: 300000 }, // $1K, $3K in cents
      status: getThresholdStatus(userMetrics._sum.revenueGeneratedCents || 0, 100000, 300000, 'higher'),
    },
    {
      name: 'Repeat Earners',
      value: repeatEarners,
      thresholds: { red: 1, yellow: 2 },
      status: getThresholdStatus(repeatEarners, 1, 2, 'higher'),
    },
    {
      name: 'Active Organizations',
      value: verifiedOrgs,
      thresholds: { red: 1, yellow: 2 },
      status: getThresholdStatus(verifiedOrgs, 1, 2, 'higher'),
    },
  ];
  
  return {
    kpis,
    summary: {
      totalKPIs: kpis.length,
      green: kpis.filter(k => k.status === 'green').length,
      yellow: kpis.filter(k => k.status === 'yellow').length,
      red: kpis.filter(k => k.status === 'red').length,
    },
  };
}

/**
 * Retention metrics with precise definitions
 */
async function getRetentionMetrics(dataSources: DataSource[]) {
  // This would require actual session tracking data
  // For now, return structure with placeholders
  return {
    d1Return: { value: 0, description: 'User has any session 1 day after signup' },
    d7Return: { value: 0, description: 'User has any session within days 2-7 after signup' },
    d30Return: { value: 0, description: 'User has any session within days 8-30 after signup' },
    d7Meaningful: { value: 0, description: 'User performs meaningful action within days 2-7' },
    d30Meaningful: { value: 0, description: 'User performs meaningful action within days 8-30' },
    meaningfulActions: [
      'situation_submitted',
      'immediate_feedback_viewed',
      'second_situation_submitted',
      'interaction_clicked',
      'context_added',
      'reflection_opened',
      'operator_interested',
      'consult_completed',
      'opportunity_posted',
      'hire_confirmed',
      'outcome_submitted',
    ],
  };
}

/**
 * Funnel data for all funnels
 */
async function getFunnelData(dataSources: DataSource[]) {
  const events = await prisma.analyticsEvent.findMany({
    where: buildDataSourceFilter(dataSources),
    select: {
      eventType: true,
      eventCategory: true,
      createdAtBucket: true,
    },
  });
  
  // Operator Activation Funnel
  const operatorFunnel = buildFunnel(events, [
    'signup_started',
    'signup_completed',
    'onboarding_completed',
    'situation_submitted',
    'immediate_feedback_viewed',
    'second_situation_submitted',
    'reflection_opened',
    'micro_opportunity_created',
    'operator_interested',
    'consult_completed',
  ]);
  
  // Situation Quality Funnel
  const situationFunnel = buildFunnel(events, [
    'situation_started',
    'situation_submitted',
    'situation_structured',
    'reflection_generated',
    'reflection_opened',
  ]);
  
  // Micro-Opportunity Funnel
  const microOppFunnel = buildFunnel(events, [
    'micro_opportunity_created',
    'operator_invited',
    'operator_viewed_micro_opportunity',
    'operator_interested',
    'buyer_interested',
    'consult_scheduled',
    'consult_completed',
    'payout_recorded',
  ]);
  
  // Organization Funnel
  const orgFunnel = buildFunnel(events, [
    'organization_onboarded',
    'opportunity_posted',
    'match_created',
    'match_viewed',
    'organization_interest_expressed',
    'mutual_interest_created',
    'hire_confirmed',
    'fee_record_created',
    'outcome_submitted',
  ]);
  
  return {
    operatorActivation: operatorFunnel,
    situationQuality: situationFunnel,
    microOpportunity: microOppFunnel,
    organization: orgFunnel,
  };
}

/**
 * Launch/Quit readiness data
 */
async function getReadinessData(dataSources: DataSource[]) {
  const kpis = await getKPIScoreboard(dataSources);
  
  // Calculate readiness status
  const verifiedOperators = (kpis.kpis.find(k => k.name === 'Verified Operators')?.value as number) || 0;
  const microConsults = (kpis.kpis.find(k => k.name === 'Micro-Consults Completed')?.value as number) || 0;
  const gmv = (kpis.kpis.find(k => k.name === 'GMV')?.rawCents as number) || 0;
  const repeatEarners = (kpis.kpis.find(k => k.name === 'Repeat Earners')?.value as number) || 0;
  const activeOrgs = (kpis.kpis.find(k => k.name === 'Active Organizations')?.value as number) || 0;
  
  // Determine status based on thresholds
  let status = 'NOT_READY';
  let signals = [];
  
  // Check thresholds
  if (verifiedOperators >= 150 && microConsults >= 25 && gmv >= 500000 && repeatEarners >= 2 && activeOrgs >= 2) {
    status = 'EXIT_CONSIDERATION_SIGNAL';
    signals.push('150+ verified operators');
    signals.push('25+ micro-consults');
    signals.push('$5K+ GMV');
  } else if (verifiedOperators >= 100 && microConsults >= 10 && gmv >= 300000) {
    status = 'STRONG_SIGNAL';
    signals.push('100+ verified operators');
    signals.push('10+ micro-consults');
    signals.push('$3K+ GMV');
  } else if (verifiedOperators >= 50 && microConsults >= 3) {
    status = 'EARLY_SIGNAL';
    signals.push('50+ verified operators');
    signals.push('3+ micro-consults');
  } else {
    signals.push('Need 50+ verified operators');
    signals.push('Need 3+ micro-consults');
  }
  
  return {
    status,
    signals,
    checks: {
      productLoopWorking: verifiedOperators > 0 && microConsults > 0,
      reflectionLoopWorking: kpis.kpis.find(k => k.name === 'Reflection Open Rate')?.value !== 0,
      microConsultLoopWorking: microConsults > 0,
      anonymityRiskAcceptable: true, // Would need actual safety check
      realDataPresent: dataSources.includes('REAL'),
    },
    metrics: {
      verifiedOperators,
      microConsults,
      gmv: formatCurrency(gmv),
      repeatEarners,
      activeOrgs,
    },
  };
}

/**
 * Helper functions
 */
function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calculatePercentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}

function getThresholdStatus(value: number, redThreshold: number, yellowThreshold: number, direction: 'higher' | 'lower' = 'higher'): 'red' | 'yellow' | 'green' {
  if (direction === 'higher') {
    if (value >= yellowThreshold) return 'green';
    if (value >= redThreshold) return 'yellow';
    return 'red';
  } else {
    if (value <= redThreshold) return 'green';
    if (value <= yellowThreshold) return 'yellow';
    return 'red';
  }
}

function buildFunnel(events: any[], steps: string[]) {
  const stepCounts: Record<string, number> = {};
  
  for (const step of steps) {
    stepCounts[step] = events.filter(e => e.eventType === step).length;
  }
  
  const funnel = steps.map((step, index) => {
    const count = stepCounts[step] || 0;
    const previousCount = index > 0 ? stepCounts[steps[index - 1]] || 0 : count;
    const conversionRate = previousCount > 0 ? calculatePercentage(count, previousCount) : 100;
    const dropOffRate = previousCount > 0 ? 100 - conversionRate : 0;
    
    return {
      step,
      count,
      conversionRate,
      dropOffRate,
    };
  });
  
  return funnel;
}