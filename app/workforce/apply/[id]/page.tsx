'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

type JobPosting = {
  id: string;
  title: string;
  description: string;
  contractorType: string;
  requiredRole: string;
  location: string;
  duration: string;
  hourlyRate: number;
  organization: {
    anonymousHandle: string;
    verificationStatus: string;
  };
};

export default function ApplyToJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    coverLetter: '',
    availability: '',
    hourlyRate: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    // Verification gate: Only approved operators can apply
    if (user?.userRole !== 'operator' || user?.verificationStatus !== 'Approved') {
      router.push('/workforce');
      return;
    }

    fetchJobPosting();
  }, [isAuthenticated, user, router, params.id]);

  const fetchJobPosting = async () => {
    try {
      const response = await fetch(`/api/job-postings/${params.id}`);
      if (!response.ok) {
        throw new Error('Job posting not found');
      }
      const data = await response.json();
      setJob(data.jobPosting);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job posting');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobPostingId: params.id,
          coverLetter: formData.coverLetter,
          availability: formData.availability,
          hourlyRate: parseFloat(formData.hourlyRate),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      router.push('/workforce/my-applications');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading job posting...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-lg">
            {error || 'Job posting not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Workforce Exchange
          </button>
          <h1 className="text-3xl font-bold mb-2">Apply for Position</h1>
        </div>

        {/* Job Details */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2">{job.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <span>🏢</span>
                  <span className="text-white font-medium">{job.organization.anonymousHandle}</span>
                  {job.organization.verificationStatus === 'Approved' && (
                    <span className="text-green-500">✓</span>
                  )}
                </span>
                <span>•</span>
                <span>{job.requiredRole}</span>
                <span>•</span>
                <span>{job.location}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-500">
                ${job.hourlyRate}/hr
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {job.duration}
              </div>
            </div>
          </div>
          <p className="text-gray-300">{job.description}</p>
        </div>

        {/* Application Form */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-6">Your Application</h3>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Cover Letter <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.coverLetter}
                onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                placeholder="Introduce yourself and explain why you're a good fit for this role..."
                required
                rows={6}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Availability <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                placeholder="Describe your availability (start date, hours per week, etc.)..."
                required
                rows={3}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Your Hourly Rate ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="Enter your hourly rate"
                required
                min="0"
                step="0.01"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Note: Platform fee (25%) will be applied
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}