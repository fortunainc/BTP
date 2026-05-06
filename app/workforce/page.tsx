'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Link from 'next/link';
import { Award, Lock, FileText, Zap } from 'lucide-react';

type JobPosting = {
  id: string;
  title: string;
  description: string;
  contractorType: string;
  requiredRole: string;
  location: string;
  duration: string;
  hourlyRate: number;
  feePercentage: number;
  status: string;
  minTierRequired: number;
  organization: {
    id: string;
    anonymousHandle: string;
    verificationStatus: string;
  };
  _count: {
    applications: number;
  };
  createdAt: string;
};

type AccessMetrics = {
  accessLevel: number;
  helpfulnessScore: number;
  contributionCount: number;
  availableJobsCount: number;
};

const ACCESS_LEVEL_NAMES = ['Observer', 'Contributor', 'Operator', 'Expert', 'Authority'];
const ACCESS_LEVEL_COLORS = ['text-slate-400', 'text-blue-400', 'text-green-400', 'text-purple-400', 'text-amber-400'];

export default function WorkforcePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [accessMetrics, setAccessMetrics] = useState<AccessMetrics | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    fetchJobPostings();
    
    if (isAuthenticated) {
      fetchUserRole();
      fetchAccessMetrics();
    }
  }, [isAuthenticated, authLoading]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/me');
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.userRole);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchAccessMetrics = async () => {
    try {
      const response = await fetch('/api/user/signal-metrics');
      if (response.ok) {
        const data = await response.json();
        setAccessMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching access metrics:', error);
    }
  };

  const getAccessLevelName = (accessLevel: number) => ACCESS_LEVEL_NAMES[accessLevel] || 'Observer';
  const getAccessLevelColor = (accessLevel: number) => ACCESS_LEVEL_COLORS[accessLevel] || ACCESS_LEVEL_COLORS[0];

  const fetchJobPostings = async () => {
    try {
      const response = await fetch('/api/job-postings');
      if (response.ok) {
        const data = await response.json();
        setJobPostings(data.data || data.jobPostings || []);
      }
    } catch (error) {
      console.error('Error fetching job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Open: 'bg-green-500/20 text-green-500',
      Closed: 'bg-gray-500/20 text-gray-500',
      Filled: 'bg-blue-500/20 text-blue-500',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-500/20 text-gray-500';
  };

  const handleApplyClick = (jobId: string) => {
    if (!isAuthenticated) {
      router.push(`/sign-in?redirect_url=/workforce/apply/${jobId}`);
      return;
    }
    router.push(`/workforce/apply/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading workforce exchange...</div>
      </div>
    );
  }

  const userAccessLevel = accessMetrics?.accessLevel ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Workforce Exchange</h1>
              <p className="text-gray-400 text-sm">Verified opportunities for experienced operators</p>
            </div>
            {isAuthenticated && userRole === 'organization' && user?.verificationStatus === 'Approved' && (
              <Link
                href="/workforce/new"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                + Post Job Opening
              </Link>
            )}
            {!isAuthenticated && (
              <Link
                href="/sign-up"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
              >
                Sign Up to Apply
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Public Browsing Banner for non-authenticated users */}
        {!isAuthenticated && (
          <div className="bg-blue-500/10 border border-blue-500 text-blue-400 px-6 py-4 rounded-lg mb-6">
            <p className="font-medium">Browse Job Openings</p>
            <p className="text-sm mt-1">
              You're viewing available opportunities. Sign up or sign in to apply for positions.
            </p>
          </div>
        )}

        {/* Access status banner for authenticated users */}
        {isAuthenticated && accessMetrics && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700/50 px-6 py-4 rounded-lg mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <Award className={`w-6 h-6 ${getAccessLevelColor(accessMetrics.accessLevel)}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Your Access Status</p>
                  <p className={`text-xl font-bold ${getAccessLevelColor(accessMetrics.accessLevel)}`}>
                    Level {accessMetrics.accessLevel}: {getAccessLevelName(accessMetrics.accessLevel)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <p className="text-sm text-slate-400">Helpful Score</p>
                  <p className="text-lg font-bold text-white flex items-center gap-1">
                    <FileText className="w-4 h-4 text-green-400" />
                    {accessMetrics.helpfulnessScore.toFixed(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">Contributions</p>
                  <p className="text-lg font-bold text-white">{accessMetrics.contributionCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">Jobs Unlocked</p>
                  <p className="text-lg font-bold text-green-400">{accessMetrics.availableJobsCount}</p>
                </div>
                <Link
                  href="/situations/new"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Submit Situation to Build Access
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Verification Gate for Organizations */}
        {isAuthenticated && userRole === 'organization' && user?.verificationStatus !== 'Approved' && (
          <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 px-6 py-4 rounded-lg mb-6">
            <p className="font-medium">Account Verification Required</p>
            <p className="text-sm mt-1">
              Your organization must be verified to post job openings. Current status: {user?.verificationStatus}
            </p>
          </div>
        )}

        {/* Operator Info Banner */}
        {isAuthenticated && userRole === 'operator' && user?.verificationStatus !== 'Approved' && (
          <div className="bg-blue-500/10 border border-blue-500 text-blue-500 px-6 py-4 rounded-lg mb-6">
            <p className="font-medium">Operator Access</p>
            <p className="text-sm mt-1">
              Browse available job openings below. Your account is currently {user?.verificationStatus}. 
              Verification required to apply.
            </p>
          </div>
        )}

        {/* Job Postings List */}
        {jobPostings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💼</div>
            <h2 className="text-xl font-semibold mb-2">No Job Postings Yet</h2>
            <p className="text-gray-400 mb-6">
              Check back soon for new opportunities.
            </p>
            {!isAuthenticated && (
              <Link
                href="/sign-up"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Sign Up for Notifications
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {jobPostings.map((job) => {
              const requiredAccessLevel = job.minTierRequired || 0;
              const isLocked = requiredAccessLevel > userAccessLevel;
              
              return (
                <div
                  key={job.id}
                  className={`bg-gray-800/50 border rounded-xl p-6 transition-all ${
                    isLocked 
                      ? 'border-gray-700 opacity-75' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {/* Access requirement banner */}
                  {isLocked && (
                    <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-2 rounded-lg mb-4">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Requires access level {requiredAccessLevel}: {getAccessLevelName(requiredAccessLevel)}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">
                        Submit situations to unlock
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                          {job.status}
                        </span>
                        {requiredAccessLevel > 0 && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            isLocked 
                              ? 'bg-red-600/20 text-red-400 border border-red-500/30' 
                              : 'bg-green-600/20 text-green-400 border border-green-500/30'
                          }`}>
                            <Award className="w-3 h-3" />
                            Access level {requiredAccessLevel}+
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span>🏥</span>
                          <span className="text-white font-medium">{job.organization?.anonymousHandle || 'Anonymous Organization'}</span>
                          {job.organization?.verificationStatus === 'Approved' && (
                            <span className="text-green-500">✓</span>
                          )}
                        </span>
                        <span>•</span>
                        <span>{job.requiredRole}</span>
                        <span>•</span>
                        <span>{job.location || 'Remote'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-500">
                        ${job.hourlyRate}/hr
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {job._count?.applications || 0} application{(job._count?.applications || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4 line-clamp-2">{job.description}</p>

                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex gap-3 text-sm text-gray-400 flex-wrap">
                      <span className="px-3 py-1 bg-gray-700 rounded-full">
                        {job.contractorType}
                      </span>
                      <span className="px-3 py-1 bg-gray-700 rounded-full">
                        {job.duration}
                      </span>
                      <span className="px-3 py-1 bg-gray-700 rounded-full">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {job.status === 'Open' && (
                      isLocked ? (
                        <Link
                          href="/situations/new"
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          Submit Situation to Unlock
                        </Link>
                      ) : isAuthenticated ? (
                        userRole === 'operator' && user?.verificationStatus === 'Approved' && (
                          <Link
                            href={`/workforce/apply/${job.id}`}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-sm"
                          >
                            Apply Now
                          </Link>
                        )
                      ) : (
                        <button
                          onClick={() => handleApplyClick(job.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors text-sm"
                        >
                          Sign In to Apply
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}