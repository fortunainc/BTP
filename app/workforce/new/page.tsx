'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function NewJobPostingPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contractorType: 'Independent Contractor',
    requiredRole: '',
    location: '',
    duration: '',
    hourlyRate: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    // Verification gate: Only approved organizations can post jobs
    if (user?.userRole !== 'organization' || user?.verificationStatus !== 'Approved') {
      router.push('/workforce');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/job-postings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          contractorType: formData.contractorType,
          requiredRole: formData.requiredRole,
          location: formData.location,
          duration: formData.duration,
          hourlyRate: parseFloat(formData.hourlyRate),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create job posting');
      }

      router.push('/workforce');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Workforce Exchange
          </button>
          <h1 className="text-3xl font-bold mb-2">Post Job Opening</h1>
          <p className="text-gray-400">
            Create a new job posting to connect with independent operators
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Clinical Research Associate - Remote"
              required
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the role, responsibilities, and requirements..."
              required
              rows={6}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Required Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.requiredRole}
                onChange={(e) => setFormData({ ...formData, requiredRole: e.target.value })}
                required
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select role...</option>
                <option value="CRA">Clinical Research Associate</option>
                <option value="CRC">Clinical Research Coordinator</option>
                <option value="PI">Principal Investigator</option>
                <option value="PM">Project Manager</option>
                <option value="DM">Data Manager</option>
                <option value="RM">Regulatory Manager</option>
                <option value="QA">Quality Assurance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Contractor Type
              </label>
              <select
                value={formData.contractorType}
                onChange={(e) => setFormData({ ...formData, contractorType: e.target.value })}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="Independent Contractor">Independent Contractor (Beta)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Remote, Boston MA, London UK"
                required
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Duration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 3 months, 6 months, 1 year"
                required
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Hourly Rate ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="e.g., 75"
                required
                min="0"
                step="0.01"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Platform fee: 25% will be added to your rate
              </p>
            </div>
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
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Posting...' : 'Post Job Opening'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}