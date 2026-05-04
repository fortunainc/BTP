/**
 * Opportunity Realm - Opportunity Details Page
 * 
 * Architecture Rules:
 * - NO browsing (only accessible for matched opportunities)
 * - Express interest - NOT "apply" (not a job application)
 * - Organizations see anonymized Capability Identities
 * - Match metadata and compatibility scores visible
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Globe, MapPin } from 'lucide-react';

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

type InterestStatus = 'none' | 'expressed' | 'viewed' | 'declined' | 'hired';

export default function OpportunityDetailsPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const opportunityId = params.id as string;
  
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestStatus, setInterestStatus] = useState<InterestStatus>('none');
  const [submittingInterest, setSubmittingInterest] = useState(false);

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      fetchOpportunity();
    }
  }, [authLoaded, isSignedIn, opportunityId]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/opportunities/${opportunityId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('This opportunity is not available to you. Opportunities are only shown based on capability matching.');
          return;
        }
        if (response.status === 404) {
          setError('Opportunity not found');
          return;
        }
        throw new Error('Failed to load opportunity');
      }
      
      const data = await response.json();
      setOpportunity(data.opportunity);
      setInterestStatus(data.interestStatus || 'none');
      setError(null);
    } catch (err) {
      console.error('Error fetching opportunity:', err);
      setError('Failed to load opportunity');
    } finally {
      setLoading(false);
    }
  };

  const handleExpressInterest = async () => {
    try {
      setSubmittingInterest(true);
      const response = await fetch(`/api/opportunities/${opportunityId}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to express interest');
      }
      
      setInterestStatus('expressed');
    } catch (err) {
      console.error('Error expressing interest:', err);
      setError('Failed to express interest');
    } finally {
      setSubmittingInterest(false);
    }
  };

  const handleDecline = async () => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declined: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to decline opportunity');
      }
      
      setInterestStatus('declined');
    } catch (err) {
      console.error('Error declining opportunity:', err);
      setError('Failed to decline opportunity');
    }
  };

  // Show sign-in prompt for unauthenticated users
  if (authLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Matched opportunity</h1>
          <p className="text-slate-400 mb-6">
            Sign in to view opportunity details and express interest.
          </p>
          <Link
            href={`/sign-in?redirect_url=/opportunities/${opportunityId}`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg text-white mb-4">{error || 'Opportunity not found'}</p>
          <Link
            href="/opportunities"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Opportunities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/opportunities"
            className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Opportunities
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Match Summary - No scores, just relevance */}
        {opportunity.matchScore !== undefined && (
          <div className="mb-6 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Relevant to your experience
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  This opportunity is aligned with what you've seen in trials
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-slate-800/50 rounded-lg shadow-sm border border-slate-700 p-8">
          {/* Title and Organization */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">{opportunity.title}</h1>
            <p className="text-lg text-slate-400">{opportunity.organization.name}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {opportunity.therapeuticArea && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {opportunity.therapeuticArea.replace('_', ' ')}
              </span>
            )}
            {opportunity.trialPhase && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-slate-300">
                Phase {opportunity.trialPhase}
              </span>
            )}
            {opportunity.urgencyLevel === 'critical' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <Clock className="h-4 w-4 mr-1" />
                Urgent
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">About This Opportunity</h2>
            <div className="prose prose-sm text-slate-300 max-w-none">
              <p>{opportunity.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">Required Capabilities</h2>
              <div className="flex flex-wrap gap-2">
                {opportunity.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">Location</h2>
            <div className="flex items-center text-slate-300">
              {opportunity.locationType === 'remote' && <Globe className="h-5 w-5 mr-2" />}
              {opportunity.locationType === 'on_site' && <MapPin className="h-5 w-5 mr-2" />}
              {opportunity.locationType === 'hybrid' && <div className="h-5 w-5 mr-2" />}
              
              <span className="capitalize">
                {opportunity.locationType?.replace('_', ' ')}{opportunity.locationRegion && ` • ${opportunity.locationRegion}`}
              </span>
            </div>
          </div>

          {/* Match Reasons */}
          {opportunity.matchReasons && opportunity.matchReasons.length > 0 && (
            <div className="mb-8 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h2 className="text-sm font-semibold text-indigo-900 mb-2">Why This Matched You</h2>
              <ul className="space-y-1">
                {opportunity.matchReasons.map((reason, index) => (
                  <li key={index} className="text-sm text-indigo-700">
                    • {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-700">
            {interestStatus === 'none' ? (
              <>
                <button
                  onClick={handleExpressInterest}
                  disabled={submittingInterest}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingInterest ? 'Submitting...' : 'Express Interest'}
                </button>
                <button
                  onClick={handleDecline}
                  className="px-6 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-300 bg-slate-800/50 hover:bg-slate-900"
                >
                  Not Interested
                </button>
              </>
            ) : interestStatus === 'expressed' ? (
              <div className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                Interest Expressed
              </div>
            ) : interestStatus === 'viewed' ? (
              <div className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                Organization Viewed Your Profile
              </div>
            ) : interestStatus === 'hired' ? (
              <div className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                You've Been Hired
              </div>
            ) : (
              <div className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-500 bg-gray-100">
                Declined
              </div>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">
            <strong>Privacy Note:</strong> The organization can only see your anonymized Capability Identity, 
            not your personal information or contribution history. You can express interest without revealing your identity.
          </p>
        </div>
      </main>
    </div>
  );
}