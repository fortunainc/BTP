"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  BarChart3,
  Briefcase,
  MessageSquare,
  Award,
} from "lucide-react";

interface ContributionMetrics {
  contributions: {
    total: number;
    byType: Record<string, number>;
    recent: Array<{
      id: string;
      title: string;
      contributionType: string;
      therapeuticArea: string;
      issueCategory: string;
      resolutionStatus: string;
      createdAt: string;
    }>;
  };
  interactions: {
    total: number;
  };
  resolutions: Record<string, number>;
  opportunities: {
    available: number;
  };
  account: {
    isVerified: boolean;
    isFoundingOperator: boolean;
  };
}

const urgencyColors: Record<string, string> = {
  Normal: "text-slate-400",
  "Needs Advice": "text-blue-400",
  Urgent: "text-yellow-400",
  Critical: "text-red-400",
};

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<ContributionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isSignedIn) {
      fetchMetrics();
    }
  }, [isSignedIn, isLoaded]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/user/signal-metrics");
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-slate-400">Failed to load dashboard</p>
          <Button onClick={fetchMetrics} className="mt-4 btn-primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Calculate resolution rate from real data
  const totalSituations = Object.values(metrics.resolutions).reduce((a, b) => a + b, 0);
  const resolvedCount = (metrics.resolutions['Resolved'] || 0) + (metrics.resolutions['Avoided'] || 0);
  const resolutionRate = totalSituations > 0 ? Math.round((resolvedCount / totalSituations) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">BehindTheProtocol</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/situations">
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Browse Situations
                </Button>
              </Link>
              <Link href="/situations/new">
                <Button className="btn-primary flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Submit Situation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="glass-card p-8 mb-8 bg-slate-900/50 border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                  {metrics.account.isVerified ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <Shield className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-400">Account Status</p>
                  <h1 className="text-2xl font-bold text-slate-100">
                    {metrics.account.isVerified ? "Verified Operator" : "Pending Verification"}
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {metrics.account.isFoundingOperator && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs">
                    Founding Operator
                  </span>
                )}
                {metrics.account.isVerified && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                    Verified
                  </span>
                )}
                <span className="px-3 py-1 bg-slate-800/50 rounded-full text-xs text-slate-300">
                  {metrics.contributions.total} Contributions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Contributions */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Contributions</p>
                <p className="text-2xl font-bold text-slate-100">{metrics.contributions.total}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Total submitted</p>
          </div>

          {/* Interactions */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Interactions</p>
                <p className="text-2xl font-bold text-slate-100">{metrics.interactions.total}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Total interactions</p>
          </div>

          {/* Resolution Rate */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Resolution Rate</p>
                <p className="text-2xl font-bold text-slate-100">{resolutionRate}%</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">{resolvedCount} of {totalSituations} resolved</p>
          </div>

          {/* Opportunities */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Opportunities</p>
                <p className="text-2xl font-bold text-slate-100">{metrics.opportunities.available}</p>
              </div>
            </div>
            <Link href="/opportunities" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View matched <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Contributions */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Recent Contributions
              </h2>
              <Link href="/situations" className="text-sm text-cyan-400 hover:text-cyan-300">
                View all
              </Link>
            </div>

            {metrics.contributions.recent.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">No contributions yet</p>
                <Link href="/situations/new">
                  <Button className="btn-primary">Submit Your First Situation</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.contributions.recent.map((contribution) => (
                  <Link
                    key={contribution.id}
                    href={`/situations/${contribution.id}`}
                    className="block p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-slate-200 line-clamp-1">
                        {contribution.title}
                      </p>
                      <span className="text-xs text-slate-400 capitalize">
                        {contribution.contributionType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{contribution.issueCategory}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(contribution.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Contribution Breakdown */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-purple-400" />
              Contribution Breakdown
            </h2>

            {/* By Type */}
            <div className="space-y-3 mb-6">
              <p className="text-sm text-slate-400">By Type</p>
              {Object.keys(metrics.contributions.byType).length === 0 ? (
                <p className="text-sm text-slate-500">No contributions yet</p>
              ) : (
                Object.entries(metrics.contributions.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-slate-400 capitalize">{type}</span>
                    <span className="font-bold text-slate-200">{count}</span>
                  </div>
                ))
              )}
            </div>

            {/* Resolution Status */}
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Resolution Status</p>
              {Object.keys(metrics.resolutions).length === 0 ? (
                <p className="text-sm text-slate-500">No situations yet</p>
              ) : (
                Object.entries(metrics.resolutions).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-slate-400">{status}</span>
                    <span className="font-bold text-slate-200">{count}</span>
                  </div>
                ))
              )}
            </div>

            {/* Next Actions */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-sm text-slate-400 mb-3">Recommended Actions</p>
              <div className="space-y-2">
                <Link
                  href="/situations/new"
                  className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  <ArrowRight className="w-4 h-4" />
                  Submit a new situation
                </Link>
                {!metrics.account.isVerified && (
                  <Link
                    href="/onboarding"
                    className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Complete verification
                  </Link>
                )}
                {metrics.opportunities.available > 0 && (
                  <Link
                    href="/opportunities"
                    className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300"
                  >
                    <ArrowRight className="w-4 h-4" />
                    View {metrics.opportunities.available} matched opportunities
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}