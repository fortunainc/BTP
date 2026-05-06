from pathlib import Path

route = Path("app/api/admin/analytics/route.ts")
page = Path("app/admin/analytics/page.tsx")

route_text = route.read_text()
page_text = page.read_text()

# Add switch case.
route_text = route_text.replace(
"""      case 'micro-opportunities':
        data = await getMicroOpportunityData(startDate, endDate, dataSources);
        break;""",
"""      case 'micro-opportunities':
        data = await getMicroOpportunityData(startDate, endDate, dataSources);
        break;
      case 'return-loop':
        data = await getReturnLoopData(startDate, endDate, dataSources);
        break;"""
)

# Insert helper before Marketplace metrics.
return_loop_fn = r'''
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
            'interaction_clicked',
            'context_added',
            'reflection_opened',
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
      note: 'Founder-only aggregate metrics. No usernames, profile codes, reply chains, likes, votes, popularity sorting, or exact small-cohort public display are exposed.',
      dataSourceInterpretation: 'Non-seeded interactions are treated as REAL/IMPORTED; founder-seeded interactions are treated as SEEDED/TEST for operational filtering.',
    },
  };
}

'''
route_text = route_text.replace(
"/**\n * Marketplace metrics\n */",
return_loop_fn + "\n/**\n * Marketplace metrics\n */"
)

route.write_text(route_text)

# Update dashboard types/fetch/tabs/render.
page_text = page_text.replace(
"  readiness: {\n    status: string;\n    signals: string[];\n    checks: Record<string, boolean>;\n    metrics: Record<string, any>;\n  };",
"  readiness: {\n    status: string;\n    signals: string[];\n    checks: Record<string, boolean>;\n    metrics: Record<string, any>;\n  };\n  returnLoop: any;"
)

page_text = page_text.replace(
"type TabType = 'overview' | 'kpis' | 'funnels' | 'readiness' | 'users' | 'revenue' | 'safety';",
"type TabType = 'overview' | 'kpis' | 'funnels' | 'readiness' | 'return-loop' | 'users' | 'revenue' | 'safety';"
)

page_text = page_text.replace(
"""      const [kpisRes, funnelsRes, readinessRes] = await Promise.all([
        fetch(`/api/admin/analytics?section=kpis&dataSource=${dataSources.join(',')}`),
        fetch(`/api/admin/analytics?section=funnels&dataSource=${dataSources.join(',')}`),
        fetch(`/api/admin/analytics?section=readiness&dataSource=${dataSources.join(',')}`),
      ]);""",
"""      const [kpisRes, funnelsRes, readinessRes, returnLoopRes] = await Promise.all([
        fetch(`/api/admin/analytics?section=kpis&dataSource=${dataSources.join(',')}`),
        fetch(`/api/admin/analytics?section=funnels&dataSource=${dataSources.join(',')}`),
        fetch(`/api/admin/analytics?section=readiness&dataSource=${dataSources.join(',')}`),
        fetch(`/api/admin/analytics?section=return-loop&dataSource=${dataSources.join(',')}`),
      ]);"""
)

page_text = page_text.replace(
"""      const readiness = readinessRes.ok ? await readinessRes.json() : {};""",
"""      const readiness = readinessRes.ok ? await readinessRes.json() : {};
      const returnLoop = returnLoopRes.ok ? await returnLoopRes.json() : {};"""
)

page_text = page_text.replace(
"""        readiness: readiness.data || {},
      });""",
"""        readiness: readiness.data || {},
        returnLoop: returnLoop.data || {},
      });"""
)

page_text = page_text.replace(
"              { id: 'readiness', label: 'Launch Readiness' },\n              { id: 'users', label: 'User Activity' },",
"              { id: 'readiness', label: 'Launch Readiness' },\n              { id: 'return-loop', label: 'Return Loop' },\n              { id: 'users', label: 'User Activity' },"
)

page_text = page_text.replace(
"            {activeTab === 'readiness' && <ReadinessSection readiness={data?.readiness} />}\n            {activeTab === 'users' && <UsersSection dataSources={dataSources} />}",
"            {activeTab === 'readiness' && <ReadinessSection readiness={data?.readiness} />}\n            {activeTab === 'return-loop' && <ReturnLoopSection data={data?.returnLoop} />}\n            {activeTab === 'users' && <UsersSection dataSources={dataSources} />}"
)

return_loop_component = r'''
// Return Loop Section Component
function ReturnLoopSection({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Structured Return Loop</h2>
          <p className="mt-1 text-sm text-gray-500">
            Aggregate founder metrics for interaction quality, notification performance, reflection returns, and micro-opportunity linkage.
          </p>
        </div>
        <Link
          href="/admin/interactions"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
        >
          Founder Controls →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Structured Interactions" value={data.summary?.totalInteractions || 0} />
        <MetricCard label="Situations Touched" value={data.summary?.interactedSituations || 0} />
        <MetricCard label="Context Share" value={`${data.summary?.contextShareRate || 0}%`} />
        <MetricCard label="High-Risk Review" value={`${data.summary?.highRiskReviewRate || 0}%`} />
        <MetricCard label="High-Value Share" value={`${data.summary?.highValueShareRate || 0}%`} highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Interaction Types</h3>
          <div className="space-y-2">
            {(data.quality?.byType || []).map((item: any) => (
              <div key={item.type} className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">{item.type.replace(/_/g, ' ')}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Review State</h3>
          <div className="space-y-2">
            {(data.quality?.byStatus || []).map((item: any) => (
              <div key={item.status} className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">{item.status.replace(/_/g, ' ')}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Context requiring review remains founder-controlled and is not publicly displayed.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Performance</h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricMini label="Sent" value={data.notifications?.sent || 0} />
            <MetricMini label="Opened" value={data.notifications?.opened || 0} />
            <MetricMini label="Open Rate" value={`${data.notifications?.openRate || 0}%`} />
            <MetricMini label="Clickthrough" value={`${data.notifications?.clickthroughRate || 0}%`} />
          </div>
          <div className="mt-4 space-y-2">
            {(data.notifications?.byClass || []).map((item: any) => (
              <div key={item.class} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{item.class}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reflection Return Behavior</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricMini label="Reflections Opened" value={data.reflectionReturn?.reflectionsOpened || 0} />
            <MetricMini label="Interaction Clicks" value={data.reflectionReturn?.interactionClicks || 0} />
            <MetricMini label="Contexts Added" value={data.reflectionReturn?.contextsAdded || 0} />
            <MetricMini label="Return Rate" value={`${data.reflectionReturn?.reflectionToInteractionRate || 0}%`} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Micro-Opportunity Linkage</h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricMini label="Linked Opportunities" value={data.microOpportunityLinkage?.linkedMicroOpportunities || 0} />
            <MetricMini label="Linkage Rate" value={`${data.microOpportunityLinkage?.linkageRate || 0}%`} />
          </div>
          <p className="mt-4 text-sm text-gray-600">{data.microOpportunityLinkage?.description}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Privacy guardrail:</strong> {data.privacy?.note}
        </p>
      </div>
    </div>
  );
}

function MetricMini({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

'''
page_text = page_text.replace(
"// Users Section Component\nfunction UsersSection",
return_loop_component + "\n// Users Section Component\nfunction UsersSection"
)

page.write_text(page_text)