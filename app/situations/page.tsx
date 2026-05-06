/**
 * Situations Page - What's Actually Happening
 * 
 * Shows real situations from clinical trials
 * Observational, not browsing
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import PatternBadge from '@/components/PatternBadge';

interface Situation {
  id: string;
  title: string;
  description: string;
  therapeuticArea: string | null;
  trialPhase: string | null;
  roleCategory: string | null;
  timeBucket: string;
  timeLabel: string;
  hasInteractions: boolean;
  interactionTypesPresent: string[];
}

interface SituationsResponse {
  situations: Situation[];
  filters: {
    therapeuticArea: string | null;
    contributionType: string | null;
    timeBucket: string | null;
  };
}

const THERAPEUTIC_AREAS = [
  { value: '', label: 'All Areas' },
  { value: 'oncology', label: 'Oncology' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'immunology', label: 'Immunology' },
  { value: 'rare_disease', label: 'Rare Disease' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'infectious_disease', label: 'Infectious Disease' },
  { value: 'metabolism', label: 'Metabolism' },
  { value: 'respiratory', label: 'Respiratory' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'other', label: 'Other' }
];

const TIME_BUCKETS = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' }
];

export default function SituationsPage() {
  const { isSignedIn } = useAuth();
  const [situations, setSituations] = useState<Situation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [therapeuticArea, setTherapeuticArea] = useState('');
  const [timeBucket, setTimeBucket] = useState('');

  useEffect(() => {
    fetchSituations();
  }, [therapeuticArea, timeBucket]);

  const fetchSituations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (therapeuticArea) params.append('therapeuticArea', therapeuticArea);
      if (timeBucket) params.append('timeBucket', timeBucket);

      const response = await fetch(`/api/situations?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load situations');
      }
      
      const data: SituationsResponse = await response.json();
      setSituations(data.situations);
      setError(null);
    } catch (err) {
      console.error('Error fetching situations:', err);
      setError('Failed to load situations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header - Clear, observational */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                What's happening
              </h1>
              <p className="text-slate-400">
                Real situations from clinical trials, confirmed by operators
              </p>
            </div>
            {isSignedIn && (
              <Link
                href="/situations/new"
                className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors border border-slate-600"
              >
                Share a situation
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Filters - Subtle, not prominent */}
      <div className="bg-slate-800/30 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex gap-4">
            <select
              value={therapeuticArea}
              onChange={(e) => setTherapeuticArea(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-slate-600"
            >
              {THERAPEUTIC_AREAS.map(area => (
                <option key={area.value} value={area.value}>{area.label}</option>
              ))}
            </select>
            <select
              value={timeBucket}
              onChange={(e) => setTimeBucket(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-slate-600"
            >
              {TIME_BUCKETS.map(bucket => (
                <option key={bucket.value} value={bucket.value}>{bucket.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-slate-500">{error}</div>
        ) : situations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-500 mb-2">
              No situations yet
            </p>
            <p className="text-slate-600">
              {isSignedIn 
                ? 'Share the first situation from your trial'
                : 'Sign in to share situations'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {situations.map((situation) => (
              <article
                key={situation.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <Link href={`/situations/${situation.id}`}>
                  <div className="p-6">
                    {/* Title and Time */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-lg font-semibold text-white">
                        {situation.title}
                      </h2>
                      <span className="text-sm text-slate-500 flex-shrink-0">
                        {situation.timeLabel}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {situation.therapeuticArea && (
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                          {situation.therapeuticArea.replace('_', ' ')}
                        </span>
                      )}
                      {situation.trialPhase && (
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                          Phase {situation.trialPhase}
                        </span>
                      )}
                      <PatternBadge contributionId={situation.id} />
                    </div>

                    {/* Description Preview */}
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {situation.description}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}