/**
 * Opportunities Page - Matched to Your Experience
 * 
 * Shows opportunities matched to the operator
 * Not browseable, not a job board
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  therapeuticArea: string | null;
  trialPhase: string | null;
  locationType: string | null;
  locationRegion: string | null;
  urgencyLevel: string | null;
  roleCategory: string | null;
  requiredSkills: string[];
  organization: {
    id: string;
    anonymousHandle: string;
    name: string;
  };
  matchScore?: number;
  matchReasons: string[];
  constraints: {
    minTrustScore: number;
    requiredTherapeuticAreas: string[];
  };
}

interface OpportunitiesResponse {
  opportunities: Opportunity[];
  matchMetadata: {
    totalMatches: number;
    priorityAccess: boolean;
  };
  profileCompleteness: number;
}

export default function OpportunitiesPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [priorityAccess, setPriorityAccess] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchOpportunities();
    }
  }, [isLoaded, isSignedIn]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/opportunities');
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Only operators can view matched opportunities');
          return;
        }
        throw new Error('Failed to load opportunities');
      }
      
      const data: OpportunitiesResponse = await response.json();
      setOpportunities(data.opportunities);
      setProfileCompleteness(data.profileCompleteness);
      setPriorityAccess(data.matchMetadata.priorityAccess);
      setError(null);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  // Show sign-in prompt for unauthenticated users
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Matched opportunities</h1>
          <p className="text-slate-400 mb-6">
            Sign in to see opportunities matched to your experience
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors border border-slate-600"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Matched for you
              </h1>
              <p className="text-slate-400">
                Opportunities aligned with what you've seen in trials
              </p>
            </div>
            {priorityAccess && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-700 text-slate-300 border border-slate-600">
                Priority matching
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Profile Completeness Warning */}
        {profileCompleteness < 80 && (
          <div className="mb-6 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 border-2 border-slate-500 rounded-full mt-0.5"></div>
              <div>
                <h3 className="text-sm font-medium text-white">
                  Complete your profile
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Your profile is {profileCompleteness}% complete. More complete profiles receive better matches.
                </p>
                <Link
                  href="/profile"
                  className="mt-2 inline-flex items-center text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Update profile →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* How Matching Works */}
        <div className="mb-8 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-2">How matching works</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                We show you opportunities based on your actual trial experience. You can't browse - we only show you what's relevant.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-slate-500">{error}</div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-500 mb-2">
              No matched opportunities at this time
            </p>
            <p className="text-slate-600">
              Complete your profile and check back later
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-slate-500">
              {opportunities.length} match{opportunities.length !== 1 ? 'es' : ''} for you
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {opportunities.map((opportunity) => (
                <article
                  key={opportunity.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <Link href={`/opportunities/${opportunity.id}`}>
                    <div className="p-6">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {opportunity.therapeuticArea && (
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                            {opportunity.therapeuticArea.replace('_', ' ')}
                          </span>
                        )}
                        {opportunity.trialPhase && (
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                            Phase {opportunity.trialPhase}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-semibold text-white mb-2">
                        {opportunity.title}
                      </h2>

                      {/* Organization */}
                      <p className="text-sm text-slate-400 mb-3">
                        {opportunity.organization.name}
                      </p>

                      {/* Match Summary */}
                      {opportunity.matchScore !== undefined && (
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-sm text-slate-300">
                            Relevant to your experience in trials
                          </p>
                        </div>
                      )}

                      {/* View Details */}
                      <div className="mt-4">
                        <span className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors">
                          View details →
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}