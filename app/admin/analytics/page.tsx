'use client';

/**
 * BTP Founder Analytics Dashboard
 * 
 * CRITICAL: This page must NOT expose real user identities.
 * All data is anonymized using USR-XXXX, OPR-XXXX, ORG-XXXX format.
 * 
 * Access Requirements:
 * - Founder/admin only (enforced via Clerk)
 * - Role-gated
 * - Audit logged
 * 
 * Data Source Separation:
 * - REAL data shown by default
 * - SEEDED/TEST data can be toggled but is visually labeled
 */

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Types
interface KPI {
  name: string;
  value: number | string;
  unit?: string;
  status: 'red' | 'yellow' | 'green';
  thresholds: { red: number; yellow: number };
}

interface FunnelStep {
  step: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
}

interface DashboardData {
  overview: any;
  kpis: { kpis: KPI[]; summary: { green: number; yellow: number; red: number } };
  funnels: {
    operatorActivation: FunnelStep[];
    situationQuality: FunnelStep[];
    microOpportunity: FunnelStep[];
    organization: FunnelStep[];
  };
  readiness: {
    status: string;
    signals: string[];
    checks: Record<string, boolean>;
    metrics: Record<string, any>;
  };
  returnLoop: any;
}

type DataSource = 'REAL' | 'SEEDED' | 'TEST' | 'IMPORTED';
type TabType = 'overview' | 'kpis' | 'funnels' | 'readiness' | 'return-loop' | 'users' | 'revenue' | 'safety';

export default function FounderAnalyticsDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dataSources, setDataSources] = useState<DataSource[]>(['REAL']);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin role
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // In production, this would check the user's role from the database
      // For now, we'll check if the user has admin metadata
      const role = user.publicMetadata?.role as string;
      setIsAdmin(role === 'admin' || role === 'founder');
    }
  }, [isLoaded, isSignedIn, user]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/admin/analytics');
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch data
  useEffect(() => {
    if (isSignedIn && isAdmin) {
      fetchDashboardData();
    }
  }, [isSignedIn, isAdmin, dataSources]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/analytics?section=overview&dataSource=${dataSources.join(',')}`);
      
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setIsAdmin(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const result = await response.json();
      
      // Fetch additional sections
      const [kpisRes, funnelsRes, readinessRes, returnLoopRes] = await Promise.all([
        fetch(`/api/admin/analytics?section=kpis&dataSource=${dataSources.join(',')}`),
        fetch(`/api/admin/analytics?section=funnels&dataSource=${dataSources.join(',')}`),
        fetch(`/api/admin/analytics?section=readiness&dataSource=${dataSources.join(',')}`),
        fetch(`/api/admin/analytics?section=return-loop&dataSource=${dataSources.join(',')}`),
      ]);
      
      const kpis = kpisRes.ok ? await kpisRes.json() : { kpis: [], summary: {} };
      const funnels = funnelsRes.ok ? await funnelsRes.json() : {};
      const readiness = readinessRes.ok ? await readinessRes.json() : {};
      const returnLoop = returnLoopRes.ok ? await returnLoopRes.json() : {};
      
      setData({
        overview: result.data,
        kpis: kpis.data || { kpis: [], summary: {} },
        funnels: funnels.data || {},
        readiness: readiness.data || {},
        returnLoop: returnLoop.data || {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleDataSource = (ds: DataSource) => {
    setDataSources(prev => 
      prev.includes(ds) 
        ? prev.filter(d => d !== ds)
        : [...prev, ds]
    );
  };

  // Loading state
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this dashboard.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-indigo-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Founder Analytics</h1>
              <p className="text-sm text-gray-500">
                All data is anonymized - no real identities exposed
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/trust-safety"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Trust & Safety →
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Data Source Filter */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Data Source:</span>
            {(['REAL', 'SEEDED', 'TEST'] as DataSource[]).map(ds => (
              <button
                key={ds}
                onClick={() => toggleDataSource(ds)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  dataSources.includes(ds)
                    ? ds === 'REAL' 
                      ? 'bg-green-100 text-green-800'
                      : ds === 'SEEDED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {ds}
                {ds !== 'REAL' && dataSources.includes(ds) && ' ⚠️'}
              </button>
            ))}
          </div>
          {dataSources.some(ds => ds !== 'REAL') && (
            <p className="mt-2 text-sm text-yellow-600">
              ⚠️ Warning: Non-REAL data sources are included. KPIs may not reflect actual performance.
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 overflow-x-auto py-2">
            {[
              { id: 'overview', label: 'Executive Overview' },
              { id: 'kpis', label: 'KPI Scoreboard' },
              { id: 'funnels', label: 'Funnels' },
              { id: 'readiness', label: 'Launch Readiness' },
              { id: 'return-loop', label: 'Return Loop' },
              { id: 'users', label: 'User Activity' },
              { id: 'revenue', label: 'Revenue' },
              { id: 'safety', label: 'Safety' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewSection data={data?.overview} />}
            {activeTab === 'kpis' && <KPIScoreboard kpis={data?.kpis} />}
            {activeTab === 'funnels' && <FunnelsSection funnels={data?.funnels} />}
            {activeTab === 'readiness' && <ReadinessSection readiness={data?.readiness} />}
            {activeTab === 'return-loop' && <ReturnLoopSection data={data?.returnLoop} />}
            {activeTab === 'users' && <UsersSection dataSources={dataSources} />}
            {activeTab === 'revenue' && <RevenueSection data={data?.overview} />}
            {activeTab === 'safety' && <SafetySection dataSources={dataSources} />}
          </>
        )}
      </main>

      {/* Privacy Notice */}
      <footer className="bg-blue-50 border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-blue-700">
            <strong>Privacy Notice:</strong> All metrics use anonymized user IDs (USR-XXXX, OPR-XXXX format). 
            No real names, emails, or employer information is exposed in this dashboard.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Overview Section Component
function OverviewSection({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Executive Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Users" value={data.users?.total || 0} />
        <MetricCard label="Verified Operators" value={data.users?.verifiedOperators || 0} />
        <MetricCard label="Verified Orgs" value={data.users?.verifiedOrgs || 0} />
        <MetricCard label="7-Day Retention" value={`${data.retention?.sevenDay || 0}%`} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Posts" value={data.posts?.total || 0} subLabel={`Last 30 days: ${data.posts?.last30Days || 0}`} />
        <MetricCard label="Reflections Opened" value={data.reflections?.total || 0} subLabel={`Last 30 days: ${data.reflections?.last30Days || 0}`} />
        <MetricCard label="Micro-Consults" value={data.microConsults?.total || 0} subLabel={`Last 30 days: ${data.microConsults?.last30Days || 0}`} />
        <MetricCard label="Platform Revenue" value={data.revenue?.formatted || '$0.00'} highlight />
      </div>
    </div>
  );
}

// KPI Scoreboard Component
function KPIScoreboard({ kpis }: { kpis: any }) {
  if (!kpis?.kpis) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">KPI Scoreboard</h2>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{kpis.summary?.green || 0} Green</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">{kpis.summary?.yellow || 0} Yellow</span>
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">{kpis.summary?.red || 0} Red</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.kpis.map((kpi: KPI, i: number) => (
          <div
            key={i}
            className={`p-4 rounded-lg border-2 ${
              kpi.status === 'green' ? 'border-green-500 bg-green-50' :
              kpi.status === 'yellow' ? 'border-yellow-500 bg-yellow-50' :
              'border-red-500 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">{kpi.name}</span>
              <span className={`w-3 h-3 rounded-full ${
                kpi.status === 'green' ? 'bg-green-500' :
                kpi.status === 'yellow' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">
                {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                {kpi.unit && <span className="text-lg ml-1">{kpi.unit}</span>}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
                 {`Thresholds: Red <${kpi.thresholds.red}, Green ≥${kpi.thresholds.yellow}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Funnels Section Component
function FunnelsSection({ funnels }: { funnels: any }) {
  if (!funnels) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-900">Funnel Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelCard title="Operator Activation Funnel" steps={funnels.operatorActivation || []} />
        <FunnelCard title="Situation Quality Funnel" steps={funnels.situationQuality || []} />
        <FunnelCard title="Micro-Opportunity Funnel" steps={funnels.microOpportunity || []} />
        <FunnelCard title="Organization Funnel" steps={funnels.organization || []} />
      </div>
    </div>
  );
}

function FunnelCard({ title, steps }: { title: string; steps: FunnelStep[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-32 text-sm text-gray-600 truncate">{step.step}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="bg-indigo-500 h-full flex items-center justify-end px-2"
                style={{ width: `${Math.max(step.conversionRate, 5)}%` }}
              >
                <span className="text-xs text-white font-medium">{step.count}</span>
              </div>
            </div>
            <div className="w-20 text-sm text-right">
              <span className="text-green-600">{step.conversionRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Readiness Section Component
function ReadinessSection({ readiness }: { readiness: any }) {
  if (!readiness) return null;

  const statusColors: Record<string, string> = {
    'NOT_READY': 'bg-red-100 text-red-800 border-red-500',
    'EARLY_SIGNAL': 'bg-yellow-100 text-yellow-800 border-yellow-500',
    'STRONG_SIGNAL': 'bg-green-100 text-green-800 border-green-500',
    'EXIT_CONSIDERATION_SIGNAL': 'bg-purple-100 text-purple-800 border-purple-500',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Launch / Quit Readiness</h2>
      
      <div className={`p-6 rounded-lg border-2 ${statusColors[readiness.status] || 'bg-gray-100'}`}>
        <div className="text-center">
          <h3 className="text-2xl font-bold">{readiness.status?.replace(/_/g, ' ') || 'UNKNOWN'}</h3>
          <p className="mt-2 text-sm">
            {readiness.status === 'NOT_READY' && 'Continue building. Key metrics need improvement.'}
            {readiness.status === 'EARLY_SIGNAL' && 'Early traction detected. Keep iterating.'}
            {readiness.status === 'STRONG_SIGNAL' && 'Strong product-market fit signals. Consider scaling.'}
            {readiness.status === 'EXIT_CONSIDERATION_SIGNAL' && 'Exceptional traction. Evaluate strategic options.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Key Signals</h3>
          <ul className="space-y-2">
            {readiness.signals?.map((signal: string, i: number) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {signal}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">System Checks</h3>
          <ul className="space-y-2">
            {Object.entries(readiness.checks || {}).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between">
                <span className="text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className={value ? 'text-green-500' : 'text-red-500'}>
                  {value ? '✓' : '✗'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Current Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(readiness.metrics || {}).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{value as string}</div>
              <div className="text-sm text-gray-500">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


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


// Users Section Component
function UsersSection({ dataSources }: { dataSources: DataSource[] }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [dataSources]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/analytics?section=users&dataSource=${dataSources.join(',')}`);
      const data = await res.json();
      setUsers(data.data?.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">User Activity (Anonymized)</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interactions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.slice(0, 50).map((user, i) => (
              <tr key={i}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {user.anonymousUserId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.roleType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.verificationStatus === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.verificationStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.postCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.interactionCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${(user.revenueGeneratedCents / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Revenue Section Component
function RevenueSection({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Micro-Transaction Revenue</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total GMV</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{data.revenue?.formatted || '$0.00'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Platform Revenue (30%)</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            ${((data.revenue?.totalCents || 0) * 0.3 / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Operator Payouts (70%)</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            ${((data.revenue?.totalCents || 0) * 0.7 / 100).toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Revenue Model</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Buyer pays $150-$300 per micro-consult (default)</li>
          <li>• Operator receives 70% of fee</li>
          <li>• BTP retains 30% platform fee</li>
        </ul>
      </div>
    </div>
  );
}

// Safety Section Component
function SafetySection({ dataSources }: { dataSources: DataSource[] }) {
  const [safetyData, setSafetyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSafetyData();
  }, [dataSources]);

  const fetchSafetyData = async () => {
    try {
      const res = await fetch(`/api/admin/analytics?section=safety&dataSource=${dataSources.join(',')}`);
      const data = await res.json();
      setSafetyData(data.data);
    } catch (err) {
      console.error('Failed to fetch safety data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading safety data...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Anonymity & Safety Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="Flagged Content" value={safetyData?.totals?.flagged || 0} />
        <MetricCard label="Redactions Applied" value={safetyData?.totals?.redactions || 0} />
        <MetricCard label="High Risk Posts" value={safetyData?.totals?.highRisk || 0} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Safety Events</h3>
        <div className="space-y-2">
          {safetyData?.events?.map((e: any, i: number) => (
            <div key={i} className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">{e.type}</span>
              <span className="font-medium">{e.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, subLabel, highlight }: { 
  label: string; 
  value: number | string; 
  subLabel?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${highlight ? 'ring-2 ring-indigo-500' : ''}`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${highlight ? 'text-indigo-600' : 'text-gray-900'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subLabel && <p className="mt-1 text-xs text-gray-400">{subLabel}</p>}
    </div>
  );
}