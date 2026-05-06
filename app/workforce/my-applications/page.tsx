'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import HelpfulScore from '@/components/HelpfulScore';
import UserBadges from '@/components/UserBadges';

type Application = {
  id: string;
  status: string;
  coverLetter: string;
  availability: string;
  proposedRate: number;
  createdAt: string;
  jobPosting: {
    id: string;
    title: string;
    description: string;
    location: string;
    duration: string;
    hourlyRate: number;
    organization: {
      anonymousHandle: string;
      verificationStatus: string;
      helpfulScore?: number;
      isFoundingOperator?: boolean;
    };
  };
};

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    if (user?.userRole !== 'operator') {
      router.push('/dashboard');
      return;
    }

    fetchApplications();
  }, [isAuthenticated, user, router]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications/my-applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'Applied': 'bg-blue-500/20 text-blue-500',
      'Under Review': 'bg-yellow-500/20 text-yellow-500',
      'Rejected': 'bg-red-500/20 text-red-500',
      'Hired': 'bg-green-500/20 text-green-500',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-500/20 text-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading your applications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">My Applications</h1>
              <p className="text-gray-400 text-sm">Track your job applications</p>
            </div>
            <button
              onClick={() => router.push('/workforce')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {applications.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold mb-2">No Applications Yet</h2>
            <p className="text-gray-400 mb-6">
              Start applying to job openings to build your portfolio
            </p>
            <button
              onClick={() => router.push('/workforce')}
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Browse Available Jobs
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{app.jobPosting.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1 flex-wrap">
                        <span>🏢</span>
                        <span className="text-white font-medium">
                          {app.jobPosting.organization.anonymousHandle}
                        </span>
                        <HelpfulScore score={app.jobPosting.organization.helpfulScore || 0} size="sm" variant="minimal" />                        <UserBadges isFoundingOperator={app.jobPosting.organization.isFoundingOperator || false} size="sm" />
                        {app.jobPosting.organization.verificationStatus === 'Approved' && (
                          <span className="text-green-500">✓</span>
                        )}
                      </span>
                      <span>•</span>
                      <span>{app.jobPosting.location}</span>
                      <span>•</span>
                      <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-500">
                      ${app.proposedRate}/hr
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Your proposed rate
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Your Cover Letter</h4>
                    <p className="text-gray-300 text-sm line-clamp-2">{app.coverLetter}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Availability</h4>
                    <p className="text-gray-300 text-sm line-clamp-2">{app.availability}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">
                      Job Rate: ${app.jobPosting.hourlyRate}/hr • {app.jobPosting.duration}
                    </span>
                    {app.status === 'Applied' && (
                      <span className="text-yellow-500">
                        Awaiting review
                      </span>
                    )}
                    {app.status === 'Under Review' && (
                      <span className="text-yellow-500">
                        Being reviewed by organization
                      </span>
                    )}
                    {app.status === 'Rejected' && (
                      <span className="text-red-500">
                        Application not selected
                      </span>
                    )}
                    {app.status === 'Hired' && (
                      <span className="text-green-500">
                        Congratulations! You've been hired
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}