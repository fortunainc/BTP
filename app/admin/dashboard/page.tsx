'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Lock,
  Eye,
  EyeOff,
  UserX,
  BarChart3,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Ban
} from 'lucide-react';

export default function CEODashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [showDataBreakdown, setShowDataBreakdown] = useState(false);

  // Aggregate metrics (ONLY what CEO can see)
  const metrics = {
    users: {
      total: 15420,
      activeDaily: 3420,
      activeWeekly: 8920,
      activeMonthly: 12400,
      newThisMonth: 1850,
      churnRate: 3.2,
    },
    revenue: {
      mrr: 125000,
      arr: 1500000,
      arpu: 82,
      byTier: {
        free: 0,
        professional: 85000,
        enterprise: 40000,
      },
    },
    engagement: {
      totalThreads: 45200,
      totalMessages: 312000,
      activeWarRooms: 280,
      avgSessionDuration: 12.5, // minutes
    },
    platform: {
      uptime: 99.97,
      avgResponseTime: 145, // ms
      errorRate: 0.02, // %
    },
    growth: {
      momGrowth: 18.5, // %
      yoyGrowth: 245, // %
    },
  };

  // What CEO CANNOT access
  const inaccessibleData = [
    {
      category: 'User Identities',
      description: 'Real names, emails, employers, locations',
      reason: 'Would violate anonymity promise',
    },
    {
      category: 'User Content',
      description: 'Private messages and raw submissions',
      reason: 'Private user communications',
    },
    {
      category: 'IP Addresses',
      description: 'Network data, locations',
      reason: 'Could identify users',
    },
    {
      category: 'War Room Content',
      description: 'Private collaboration discussions',
      reason: 'Encrypted and private',
    },
    {
      category: 'Individual User Data',
      description: 'User-level activity, preferences',
      reason: 'Aggregated data only',
    },
    {
      category: 'Decryption Keys',
      description: 'Keys to decrypt user content',
      reason: 'Not stored on servers',
    },
  ];

  // Legal requests summary (metadata only)
  const legalRequests = {
    total: 3,
    byType: {
      subpoenas: 2,
      courtOrders: 1,
      nationalSecurityLetters: 0,
    },
    responseStatus: {
      pending: 0,
      challenged: 1,
      rejected: 2, // No data to provide
    },
  };

  // Security audit summary
  const securityAudit = {
    lastAuditDate: '2025-01-05',
    overallScore: 95,
    findings: {
      critical: 0,
      high: 0,
      medium: 2,
      low: 5,
    },
    canaryStatus: 'ACTIVE',
    lastBreachDate: null,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">CEO Dashboard</h1>
              <p className="text-slate-400 mt-1">Aggregate business insights only</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700 rounded-lg px-4 py-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Canary Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Access Limitation Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-amber-900/20 border border-amber-700/50 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-900/50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-400 mb-2">
                Your Access Limitations
              </h3>
              <p className="text-slate-300 mb-4">
                As CEO, you have access to aggregate business metrics for decision-making, 
                but you <strong>cannot</strong> access individual user data, content, or identities. 
                This is by design to protect users and the platform.
              </p>
              <button
                onClick={() => setShowDataBreakdown(!showDataBreakdown)}
                className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1"
              >
                {showDataBreakdown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showDataBreakdown ? 'Hide' : 'Show'} Data Access Details
              </button>
            </div>
          </div>

          {showDataBreakdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {inaccessibleData.map((item, index) => (
                <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Ban className="w-4 h-4 text-red-400" />
                    <span className="font-medium text-red-400">{item.category}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">{item.description}</p>
                  <p className="text-xs text-slate-500">Reason: {item.reason}</p>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Monthly Active Users"
            value={metrics.users.activeMonthly.toLocaleString()}
            change={`+${metrics.growth.momGrowth}%`}
            positive
            icon={<Users className="w-5 h-5" />}
            note="Aggregated count only"
          />
          <MetricCard
            title="Monthly Recurring Revenue"
            value={`$${metrics.revenue.mrr.toLocaleString()}`}
            change={`+${metrics.growth.momGrowth}%`}
            positive
            icon={<DollarSign className="w-5 h-5" />}
            note="Financial metric"
          />
          <MetricCard
            title="Active War Rooms"
            value={metrics.engagement.activeWarRooms.toLocaleString()}
            change="+12%"
            positive
            icon={<Activity className="w-5 h-5" />}
            note="Count only, no content access"
          />
          <MetricCard
            title="Platform Uptime"
            value={`${metrics.platform.uptime}%`}
            icon={<Globe className="w-5 h-5" />}
            positive
            note="System health metric"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Breakdown */}
          <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Revenue by Tier</h3>
              <div className="flex gap-2">
                {(['day', 'week', 'month'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      selectedPeriod === period
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <RevenueBar
                tier="Professional"
                amount={metrics.revenue.byTier.professional}
                total={metrics.revenue.mrr}
                color="emerald"
              />
              <RevenueBar
                tier="Enterprise"
                amount={metrics.revenue.byTier.enterprise}
                total={metrics.revenue.mrr}
                color="blue"
              />
              <RevenueBar
                tier="Free"
                amount={metrics.revenue.byTier.free}
                total={metrics.revenue.mrr}
                color="slate"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-sm">Average Revenue Per User</span>
                  <p className="text-2xl font-bold">${metrics.revenue.arpu}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">Annual Run Rate</span>
                  <p className="text-2xl font-bold">${(metrics.revenue.arr / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Status */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Security Status
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Warrant Canary</span>
                </div>
                <span className="text-emerald-400 font-medium">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Encryption Status</span>
                </div>
                <span className="text-emerald-400 font-medium">E2E Active</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-400" />
                  <span>Security Score</span>
                </div>
                <span className="text-blue-400 font-medium">{securityAudit.overallScore}/100</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Last Audit</span>
                  <span className="text-slate-300">{securityAudit.lastAuditDate}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded">
                    {securityAudit.findings.critical} Critical
                  </span>
                  <span className="text-xs px-2 py-1 bg-amber-900/30 text-amber-400 rounded">
                    {securityAudit.findings.medium} Medium
                  </span>
                  <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded">
                    {securityAudit.findings.low} Low
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Requests Section */}
        <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            Legal Requests Summary
          </h3>

          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
            <p className="text-blue-300 text-sm">
              <strong>Note:</strong> This shows only counts and types of requests. 
              Specific request details and any user data involved are not accessible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <span className="text-slate-400 text-sm">Total Requests</span>
              <p className="text-3xl font-bold">{legalRequests.total}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <span className="text-slate-400 text-sm">Challenged</span>
              <p className="text-3xl font-bold text-amber-400">{legalRequests.responseStatus.challenged}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <span className="text-slate-400 text-sm">Rejected (No Data)</span>
              <p className="text-3xl font-bold text-emerald-400">{legalRequests.responseStatus.rejected}</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-medium">Protected by Architecture</p>
                <p className="text-slate-400 text-sm">
                  All rejected requests were due to having no user identity data to provide.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What You Can Do */}
        <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-6">CEO Actions Available</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton
              icon={<BarChart3 className="w-5 h-5" />}
              title="View Reports"
              description="Generate aggregate business reports"
            />
            <ActionButton
              icon={<Users className="w-5 h-5" />}
              title="Manage Employees"
              description="Hire, fire, and set employee permissions"
            />
            <ActionButton
              icon={<DollarSign className="w-5 h-5" />}
              title="Financial Oversight"
              description="Revenue, expenses, and projections"
            />
            <ActionButton
              icon={<Shield className="w-5 h-5" />}
              title="Security Audits"
              description="Commission and review security audits"
            />
          </div>
        </div>

        {/* Data Architecture Diagram */}
        <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-6">Data Access Architecture</h3>

          <div className="bg-slate-900 rounded-lg p-6">
            <div className="flex flex-col items-center">
              {/* CEO Level */}
              <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-4 w-full max-w-md text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="font-semibold text-amber-400">CEO Access</span>
                </div>
                <p className="text-sm text-slate-400">Aggregate metrics, financial data, system health</p>
              </div>

              {/* Arrow down */}
              <div className="h-8 border-l-2 border-dashed border-slate-600" />

              {/* Aggregation Layer */}
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4 w-full max-w-md text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-blue-400">Aggregation Layer</span>
                </div>
                <p className="text-sm text-slate-400">All data anonymized and aggregated before reaching CEO</p>
              </div>

              {/* Arrow down */}
              <div className="h-8 border-l-2 border-dashed border-slate-600" />

              {/* User Data */}
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-full max-w-md text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <UserX className="w-4 h-4 text-red-400" />
                  <span className="font-semibold text-red-400">User Data - NO ACCESS</span>
                </div>
                <p className="text-sm text-slate-400">Identities, content, messages, locations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            All displayed data is aggregated. No individual user data is accessible.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ 
  title, 
  value, 
  change, 
  positive, 
  icon, 
  note 
}: { 
  title: string; 
  value: string; 
  change?: string;
  positive?: boolean;
  icon: React.ReactNode;
  note: string;
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        <div className="text-emerald-400">{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {change && (
        <p className={`text-sm ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {change} vs last period
        </p>
      )}
      <p className="text-xs text-slate-500 mt-2">{note}</p>
    </div>
  );
}

function RevenueBar({ 
  tier, 
  amount, 
  total, 
  color 
}: { 
  tier: string; 
  amount: number; 
  total: number;
  color: 'emerald' | 'blue' | 'slate';
}) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  
  const colors = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    slate: 'bg-slate-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{tier}</span>
        <span className="text-slate-400">${amount.toLocaleString()}/mo</span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ActionButton({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <button className="text-left p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-colors">
      <div className="text-emerald-400 mb-2">{icon}</div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-slate-400">{description}</p>
    </button>
  );
}