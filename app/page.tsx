'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Shield, Eye, CheckCircle, Lock } from 'lucide-react';

interface Situation {
  id: string;
  title: string;
  description: string;
  issueCategory: string;
  trialPhase: string;
  therapeuticArea: string;
  roleContext: string;
  status: string;
  createdAt: string;
}

interface Pattern {
  patternId: string;
  patternTitle: string;
  description: string;
  therapeuticAreas: string[];
  trialPhases: string[];
  patternStatus: string;
  resolutionStatus: string;
  situationCount: number;
}

export default function HomePage() {
  const [situations, setSituations] = useState<Situation[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [situationsRes, patternsRes] = await Promise.all([
        fetch('/api/situations?limit=12'),
        fetch('/api/patterns')
      ]);

      if (situationsRes.ok) {
        const data = await situationsRes.json();
        setSituations(data.situations || data.slice?.(0, 12) || []);
      }

      if (patternsRes.ok) {
        const data = await patternsRes.json();
        setPatterns(data.patterns || data.slice?.(0, 5) || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setSituations([]);
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-200">Behind the Protocol</h1>
            <Link
              href="/situations/new"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Share a situation
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Say what usually stays hidden behind the protocol.
          </h1>
          <p className="text-xl text-slate-400 mb-8 leading-relaxed">
            Behind the Protocol is a protected space for clinical trial operators to share what is actually happening during trial execution — without exposing names, sponsors, sites, protocols, or patients.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/situations/new"
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-medium transition-colors text-lg"
            >
              Share a situation
            </Link>
            <Link
              href="/situations"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors text-lg"
            >
              View situations
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">What this is</h2>
          <div className="bg-slate-900 rounded-lg p-8 border border-slate-800">
            <p className="text-lg text-slate-300 leading-relaxed">
              BTP is not a forum, social network, or whistleblower platform. It is a structured way to capture execution reality — the operational friction, workarounds, and burden that rarely show up in dashboards.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
              <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Share anonymously</h3>
              <p className="text-slate-400">
                Describe what is happening in your trial. Keep it general. Avoid names, sponsors, sites, protocol IDs, and patient details.
              </p>
            </div>

            <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
              <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Review before posting</h3>
              <p className="text-slate-400">
                BTP shows you a sanitized version before anything is shared. You stay in control of what gets posted.
              </p>
            </div>

            <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
              <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Build operational memory</h3>
              <p className="text-slate-400">
                Over time, repeated situations help reveal patterns in trial execution that the system usually forgets.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">Situations shared</h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading situations...</p>
            </div>
          ) : situations.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-700 rounded-lg">
              <Lock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No situations shared yet. Be one of the first operators to share what's actually happening behind the protocol.</p>
              <Link href="/situations/new" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors mt-4">
                Share a situation
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {situations.map((situation) => (
                <Link key={situation.id} href={`/situations/${situation.id}`} className="bg-slate-900 rounded-lg p-5 hover:bg-slate-800 transition-colors border border-slate-800">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium text-cyan-400 uppercase tracking-wide">
                      {situation.trialPhase}
                    </span>
                    <span className="text-xs text-slate-500">{situation.therapeuticArea}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {situation.title || 'Anonymous submission'}
                  </h3>
                  <p className="text-slate-400 text-sm line-clamp-2">{situation.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <span>No public profiles</span>
            <span>•</span>
            <span>No popularity mechanics</span>
            <span>•</span>
            <span>No employer visibility</span>
            <span>•</span>
            <span>Sanitized submissions only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}