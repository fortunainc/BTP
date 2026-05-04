'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Link from 'next/link';

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
  createdAt: string;
  _count: {
    applications: number;
  };
};

export default function MyPostingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetchJobPostings();
  }, [isAuthenticated, user, router]);

  const fetchJobPostings = async () => {
    try {
      const response = await fetch('/api/job-postings/my-postings');
      if (!response.ok) {
        throw new Error('Failed to fetch job postings');
      }
      const data = await response.json();
      setJobPostings(data.jobPostings || []);
    } catch (error) {
      console.error('Error fetching job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/job-postings/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job posting');
      }

      await fetchJobPostings();
    } catch (error) {
      console.error('Error updating job posting:', error);
      alert('Failed to update job posting');
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      const response = await fetch(`/api/job-postings/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job posting');
      }

      await fetchJobPostings();
    } catch (error) {
      console.error('Error deleting job posting:', error);
      alert('Failed to delete job posting');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading your job postings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">My Job Postings</h1>
              <p className="text-gray-400 text-sm">Manage your job openings</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/workforce/manage-applications')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Applications
              </button>
              <Link
                href="/workforce/new"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                + Post New Job
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {jobPostings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold mb-2">No Job Postings Yet</h2>
            <p className="text-gray-400 mb-6">
              Post your first job opening to start receiving applications
            </p>
            <Link
              href="/workforce/new"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Post Your First Job Opening
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobPostings.map((job) => (
              <div
                key={job.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{job.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{job.requiredRole}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-500">
                      ${job.hourlyRate}/hr
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {job._count.applications} application{job._count.applications !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex gap-3 text-sm text-gray-400">
                    <span className="px-3 py-1 bg-gray-700 rounded-full">
                      {job.contractorType}
                    </span>
                    <span className="px-3 py-1 bg-gray-700 rounded-full">
                      {job.duration}
                    </span>
                    <span className="px-3 py-1 bg-gray-700 rounded-full">
                      {job.feePercentage * 100}% platform fee
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {job.status === 'Open' && (
                      <button
                        onClick={() => handleStatusUpdate(job.id, 'Closed')}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium transition-colors"
                      >
                        Close Posting
                      </button>
                    )}
                    {job.status === 'Closed' && (
                      <button
                        onClick={() => handleStatusUpdate(job.id, 'Open')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Reopen
                      </button>
                    )}
                    <Link
                      href={`/workforce/manage-applications?job=${job.id}`}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      View Applications ({job._count.applications})
                    </Link>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
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