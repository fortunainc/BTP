'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

type Application = {
  id: string;
  status: string;
  coverLetter: string;
  availability: string;
  proposedRate: number;
  createdAt: string;
  operator: {
    id: string;
    anonymousHandle: string;
    verificationStatus: string;
    roleCategory: string | null;
  };
  jobPosting: {
    id: string;
    title: string;
    hourlyRate: number;
    duration: string;
    location: string;
  };
};

export default function ManageApplicationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Applied' | 'Under Review' | 'Hired'>('all');
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [jobPostings, setJobPostings] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    if (user?.userRole !== 'organization') {
      router.push('/dashboard');
      return;
    }

    fetchApplications();
  }, [isAuthenticated, user, router]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications/organization-applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      const data = await response.json();
      setApplications(data.applications || []);
      
      const uniqueJobs = Array.from(
        new Map<string, { id: string; title: string }>(
          data.applications.map((app: Application) => [app.jobPosting.id, app.jobPosting])
        ).values()
      );
      setJobPostings(uniqueJobs);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      await fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application status');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Applied': 'bg-blue-500/20 text-blue-500',
      'Under Review': 'bg-yellow-500/20 text-yellow-500',
      'Rejected': 'bg-red-500/20 text-red-500',
      'Hired': 'bg-green-500/20 text-green-500',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-500';
  };

  const filteredApplications = applications.filter((app) => {
    if (filter !== 'all' && app.status !== filter) return false;
    if (selectedJob !== 'all' && app.jobPosting.id !== selectedJob) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Manage Applications</h1>
              <p className="text-gray-400 text-sm">Review and respond to job applications</p>
            </div>
            <button
              onClick={() => router.push('/workforce/my-postings')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              My Postings
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            {(['all', 'Applied', 'Under Review', 'Hired'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
          
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Jobs</option>
            {jobPostings.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📂</div>
            <h2 className="text-xl font-semibold mb-2">No Applications Yet</h2>
            <p className="text-gray-400 mb-6">
              Applications to your job postings will appear here
            </p>
            <button
              onClick={() => router.push('/workforce/new')}
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Post a Job Opening
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{app.operator.anonymousHandle}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                      {app.operator.verificationStatus === 'Approved' && (
                        <span className="text-green-500 text-sm">✓ Verified</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Applied for: {app.jobPosting.title}</span>
                      <span>•</span>
                      <span>{app.operator.roleCategory || 'Role not specified'}</span>
                      <span>•</span>
                      <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-500">
                      ${app.proposedRate}/hr
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Proposed rate
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Cover Letter</h4>
                    <p className="text-gray-300 text-sm line-clamp-3">{app.coverLetter}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Availability</h4>
                    <p className="text-gray-300 text-sm line-clamp-2">{app.availability}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    Job Rate: ${app.jobPosting.hourlyRate}/hr • {app.jobPosting.duration} • {app.jobPosting.location}
                  </div>
                  <div className="flex gap-2">
                    {app.status === 'Applied' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'Under Review')}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'Rejected')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'Under Review' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'Hired')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Hire
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'Rejected')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'Hired' && (
                      <span className="text-green-500 text-sm font-medium">
                        ✓ Hired - 25% platform fee applies
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