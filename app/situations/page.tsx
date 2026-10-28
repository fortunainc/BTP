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
import { MembershipPending } from '@/components/MemberNav';
import { DailyQuestion, type Poll } from '@/components/PollCard';

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

const TIME_BUCKETS = [
  { value: '', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' }
];

export default function SituationsPage() {
  const { isSignedIn } = useAuth();
  const [situations, setSituations] = useState<Situation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [polls, setPolls] = useState<Poll[] | null>(null);

  useEffect(() => {
    fetch('/api/polls').then(r => r.ok ? r.json() : null).then(d => setPolls((d?.data ?? d)?.polls ?? null)).catch(() => setPolls(null));
  }, []);
  const [timeBucket, setTimeBucket] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    try { setShowWelcome(localStorage.getItem('btp-welcome-dismissed') !== '1'); } catch { setShowWelcome(true); }
  }, []);
  function dismissWelcome() {
    setShowWelcome(false);
    try { localStorage.setItem('btp-welcome-dismissed', '1'); } catch { /* storage unavailable */ }
  }

  useEffect(() => {
    fetchSituations();
  }, [timeBucket]);

  async function fetchSituations() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (timeBucket) params.append('timeBucket', timeBucket);

      const response = await fetch(`/api/situations?${params.toString()}`);
      
      if (response.status === 403) {
        const body = await response.json().catch(() => ({}));
        setSuspended(String(body?.error || '').toLowerCase().includes('suspend'));
        setPending(true);
        setSituations([]);
        setError(null);
        return;
      }
      if (response.status === 401) {
        window.location.assign('/sign-in');
        return;
      }
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
  }

  return (
    <div className="min-h-screen">
      {/* Header - Clear, observational */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl text-[#fff6ea] mb-2">
                Questions from <span className="text-[#e8cc94]">the BTP community.</span>
              </h1>
              <p className="text-slate-400">
                Ask openly. Answer from experience. Keep identities and employers protected.
              </p>
            </div>
            {isSignedIn && (
              <Link
                href="/situations/new"
                className="btn-primary inline-flex items-center gap-2 whitespace-nowrap rounded px-6 py-3 text-xs uppercase tracking-[0.16em]"
              >
                Ask a question <span aria-hidden>→</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Orientation for new members, then time filter */}
      <div className="max-w-7xl mx-auto px-8 pt-6">
        {showWelcome && !pending && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(232,204,148,0.3)] bg-gradient-to-br from-[rgba(201,166,107,0.12)] to-white/[0.02] px-5 py-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#dcbc82]">New here? How BTP works</p>
              <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#f1e7da]">
                {['Ask a work question under your handle', 'Verified peers answer from experience', 'Mark the answer that worked'].map((s, i) => (
                  <li key={s} className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#ead0a0] to-[#c9a66b] text-xs font-medium text-[#1c0e0b]">{i + 1}</span>{s}</li>
                ))}
              </ol>
            </div>
            <button type="button" onClick={dismissWelcome} className="text-sm text-[#e8cc94] hover:underline">Got it</button>
          </div>
        )}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by time">
          {TIME_BUCKETS.map(bucket => (
            <button key={bucket.value} type="button" onClick={() => setTimeBucket(bucket.value)} aria-pressed={timeBucket === bucket.value}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${timeBucket === bucket.value ? 'border-transparent bg-gradient-to-br from-[#ead0a0] to-[#c9a66b] text-[#1c0e0b]' : 'border-white/10 bg-white/[0.02] text-[#e6dacb] hover:border-[rgba(232,204,148,0.4)]'}`}>
              {bucket.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {!pending && polls && polls.length > 0 && (
          <div className="mb-6 max-w-2xl"><DailyQuestion polls={polls} /></div>
        )}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          </div>
        ) : pending ? (
          <div className="py-12">{suspended ? (
            <div className="mx-auto max-w-xl rounded-lg border border-slate-700 bg-slate-800/50 p-6 text-slate-300"><h2 className="text-xl font-semibold text-white">Your account is suspended</h2><p className="mt-3">Contact BTP support if you believe this is a mistake: fortunaindustriesinc@gmail.com.</p></div>
          ) : <MembershipPending />}</div>
        ) : error ? (
          <div className="text-center py-12 text-slate-500">{error}</div>
        ) : situations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-500 mb-2">
              No questions yet
            </p>
            <p className="text-slate-600">
              {isSignedIn
                ? 'The beta is just opening. Ask the first question: an operational situation you are working through, without patient, site, sponsor or study identifiers.'
                : 'Sign in to ask a question'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {situations.map((situation) => (
              <article
                key={situation.id}
                className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-white/[0.012] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-[rgba(232,204,148,0.35)]"
              >
                <Link href={`/situations/${situation.id}`}>
                  <div className="p-6">
                    {/* Title and Time */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-xl text-[#fff6ea]">
                        {situation.title}
                      </h2>
                      <span className="text-sm text-slate-500 flex-shrink-0">
                        {situation.timeLabel}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
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
