/**
 * Reflection Page - privacy-safe return loop
 *
 * Shows updated anonymous context without exact counts, profile codes, reply chains, or social mechanics.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Shield,
} from 'lucide-react';

interface ReflectionData {
  id: string;
  title: string;
  timeBucket: string;
  updatedBasedOnAnonymousContext: boolean;
  patternCluster: {
    similarIssueBucket: string;
    therapeuticAreas: string[];
    trialPhases: string[];
    patternStatus: 'early indication' | 'repeating issue' | 'showing up repeatedly';
  };
  interactionSummary: {
    hasInteractions: boolean;
    userSafeSummaries: string[];
    maturityLabel: string;
    interactionTypesPresent: string[];
  };
  responseSignals: string[];
  whatWorked: string[];
  whatDidntHoldUp: string[];
  downstreamRisks: string[];
  confidence: 'low' | 'emerging' | 'strong';
  opportunitySignal: string | null;
}

export default function ReflectionPage() {
  const params = useParams();
  const { isSignedIn, isLoaded } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReflectionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && params.id) {
      fetchReflectionData(params.id as string);
    }
  }, [isLoaded, isSignedIn, params.id]);

  const fetchReflectionData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/insights/reflection/${id}`);

      if (!response.ok) {
        throw new Error('Failed to load reflection data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching reflection:', err);
      setError('Unable to load reflection data');
    } finally {
      setLoading(false);
    }
  };

  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <p className="text-slate-400">Please sign in to view insights</p>
        <Link href="/sign-in" className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-md">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-400">Loading updated reflection...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <p className="text-white text-lg mb-2">Insights not yet available</p>
        <p className="text-slate-400 mb-4 text-center">Check back after similar anonymous context appears.</p>
        <Link href="/situations" className="px-4 py-2 bg-cyan-600 text-white rounded-md">
          Back to Feed
        </Link>
      </div>
    );
  }

  const confidenceConfig = {
    low: { label: 'Early indications', color: 'text-slate-400', bg: 'bg-slate-500/20' },
    emerging: { label: 'Emerging pattern', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    strong: { label: 'Strong pattern', color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
  };

  const patternConfig = {
    'early indication': { label: 'Early indication', color: 'text-blue-400' },
    'repeating issue': { label: 'Repeating issue', color: 'text-amber-400' },
    'showing up repeatedly': { label: 'Showing up repeatedly', color: 'text-red-400' }
  };

  const confidence = confidenceConfig[data.confidence];
  const pattern = patternConfig[data.patternCluster.patternStatus];

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href={`/situations/${data.id}`} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Situation
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-1 rounded ${confidence.bg} ${confidence.color}`}>
              {confidence.label}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded bg-slate-900 border border-slate-800 ${pattern.color}`}>
              {pattern.label}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500">{data.timeBucket}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{data.title}</h1>
          <p className="text-slate-400">Your situation and how it is changing as anonymous context comes in.</p>
        </div>

        {data.updatedBasedOnAnonymousContext && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <h2 className="text-cyan-300 font-medium">Updated based on new anonymous context</h2>
                <p className="text-slate-300 text-sm mt-1">
                  Structured anonymous context appeared after your original submission. The reflection below now includes that context without exposing identity, count, or timing details.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-cyan-500" />
            <h2 className="text-xl font-semibold text-white">Pattern movement</h2>
          </div>
          <p className={`text-lg mb-2 ${pattern.color}`}>{pattern.label}</p>
          <p className="text-sm text-slate-400 mb-4">
            Similar situations are in the <span className="text-slate-200">{data.patternCluster.similarIssueBucket}</span> range.
          </p>
          <div className="flex flex-wrap gap-2">
            {data.patternCluster.therapeuticAreas.map((area) => (
              <span key={area} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">{area}</span>
            ))}
            {data.patternCluster.trialPhases.map((phase) => (
              <span key={phase} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">{phase}</span>
            ))}
          </div>
        </div>

        {data.interactionSummary.hasInteractions && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-cyan-500" />
              <h3 className="text-white font-medium">Anonymous operator context</h3>
            </div>
            <div className="space-y-2">
              {data.interactionSummary.userSafeSummaries.map((summary) => (
                <p key={summary} className="text-sm text-slate-300">· {summary}</p>
              ))}
            </div>
          </div>
        )}

        {data.responseSignals.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <h3 className="text-white font-medium mb-4">What this suggests</h3>
            <div className="space-y-2">
              {data.responseSignals.map((item) => (
                <p key={item} className="text-sm text-slate-300">· {item}</p>
              ))}
            </div>
          </div>
        )}

        {data.whatWorked.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <h3 className="text-white font-medium">What worked somewhere similar</h3>
            </div>
            <div className="space-y-3">
              {data.whatWorked.map((item) => (
                <div key={item} className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <p className="text-slate-100 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.whatDidntHoldUp.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-white font-medium">What did not hold up</h3>
            </div>
            <div className="space-y-3">
              {data.whatDidntHoldUp.map((item) => (
                <div key={item} className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-slate-100 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.downstreamRisks.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-amber-300 font-medium">Downstream risk indication</h3>
            </div>
            <div className="space-y-2">
              {data.downstreamRisks.map((risk) => (
                <p key={risk} className="text-sm text-slate-200">· {risk}</p>
              ))}
            </div>
          </div>
        )}

        {data.opportunitySignal && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 mb-6">
            <h3 className="text-cyan-400 font-medium mb-2">Possible paid consult fit</h3>
            <p className="text-slate-300 text-sm">{data.opportunitySignal}</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Submitted {data.timeBucket}</span>
        </div>
      </main>
    </div>
  );
}
