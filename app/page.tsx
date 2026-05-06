'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  ChevronRight,
} from 'lucide-react';

// ==========================================
// TYPES
// ==========================================

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

interface Insight {
  patternId: string;
  statement: string;
  type: string;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function HomePage() {
  const [situations, setSituations] = useState<Situation[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [insights, setInsights] = useState<Record<string, Insight>>({});
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
      // Private alpha: do not show fallback/example activity as if it were real.
      setSituations([]);
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header - Minimal, no navigation noise */}
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* SECTION A: ACTIVE SITUATIONS */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">What's happening right now</h2>
            <Link 
              href="/situations"
              className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg">
              <p className="text-slate-400">Loading situations...</p>
            </div>
          ) : situations.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-700 rounded-lg">
              <p className="text-slate-400 mb-2">No situations shared yet</p>
              <p className="text-slate-500 text-sm mb-4">Be one of the first operators to share what's really happening behind the protocol</p>
              <Link 
                href="/situations/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Share a situation
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {situations.slice(0, 12).map((situation) => (
                <SituationCard key={situation.id} situation={situation} />
              ))}
            </div>
          )}
        </section>

        {/* SECTION B: THIS KEEPS COMING UP (PATTERNS) */}
        {!loading && patterns.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h2 className="text-2xl font-bold">This keeps coming up</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {patterns.slice(0, 4).map((pattern) => (
                <PatternCard 
                  key={pattern.patternId} 
                  pattern={pattern}
                  insight={insights[pattern.patternId]}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECTION C: UNRESOLVED PRESSURE */}
        {patterns.filter(p => p.resolutionStatus === 'unresolved').length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-2xl font-bold">Still unresolved</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {patterns
                .filter(p => p.resolutionStatus === 'unresolved')
                .slice(0, 6)
                .map((pattern) => (
                  <div 
                    key={pattern.patternId}
                    className="bg-slate-900/50 border border-slate-800 rounded-lg p-4"
                  >
                    <p className="font-medium text-slate-200 mb-2">{pattern.patternTitle}</p>
                    <p className="text-sm text-slate-500">
                      No consistent solution emerged yet
                    </p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* BOTTOM CTA */}
        <section className="border-t border-slate-800 pt-8">
          <div className="text-center">
            <p className="text-slate-400 mb-4">
              Something happening at your site?
            </p>
            <Link
              href="/situations/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors"
            >
              Share a situation
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

// ==========================================
// SITUATION CARD
// ==========================================

function SituationCard({ situation }: { situation: Situation }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    new: { label: 'New', color: 'bg-emerald-500/20 text-emerald-400' },
    evolving: { label: 'Evolving', color: 'bg-blue-500/20 text-blue-400' },
    escalating: { label: 'Escalating', color: 'bg-red-500/20 text-red-400' }
  };

  const status = statusConfig[situation.status] || statusConfig.evolving;

  return (
    <Link href={`/situations/${situation.id}`}>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors h-full">
        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-white mb-2 line-clamp-2">
          {situation.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 mb-4 line-clamp-3">
          {situation.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded">
            {situation.therapeuticArea}
          </span>
          <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded">
            {situation.trialPhase}
          </span>
          <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded">
            {formatCategory(situation.issueCategory)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ==========================================
// PATTERN CARD
// ==========================================

function PatternCard({ 
  pattern, 
  insight 
}: { 
  pattern: Pattern; 
  insight?: Insight;
}) {
  const statusColors: Record<string, string> = {
    emerging: 'text-blue-400',
    repeating: 'text-amber-400',
    critical: 'text-red-400'
  };

  const resolutionLabels: Record<string, string> = {
    unresolved: 'No consistent solution',
    partial: 'Partially addressed',
    resolved: 'Resolved'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg text-white pr-4">{pattern.patternTitle}</h3>
        <span className={`text-xs font-medium ${statusColors[pattern.patternStatus] || 'text-slate-400'}`}>
          {pattern.patternStatus.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm mb-4">{pattern.description}</p>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-4">
        <span>
          {pattern.therapeuticAreas.length > 1 
            ? 'Multiple therapeutic areas' 
            : pattern.therapeuticAreas[0] || 'Unknown area'}
        </span>
        <span>
          {pattern.trialPhases.length > 1 
            ? 'Multiple phases' 
            : pattern.trialPhases[0] || 'Unknown phase'}
        </span>
      </div>

      {/* Resolution Status */}
      <div className="mb-4">
        <span className={`text-xs px-2 py-1 rounded ${
          pattern.resolutionStatus === 'unresolved' 
            ? 'bg-red-500/20 text-red-400' 
            : pattern.resolutionStatus === 'partial'
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          {resolutionLabels[pattern.resolutionStatus]}
        </span>
      </div>

      {/* Insight */}
      <div className="bg-slate-800/50 rounded p-3 mb-4">
        <div className="flex items-start gap-2">
          <span className="text-amber-500 text-sm">⚠️</span>
          <p className="text-sm text-slate-300">
            {insight?.statement || 'This pattern is likely to impact trial timelines'}
          </p>
        </div>
      </div>

      {/* Private-alpha context */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-500">
          Anonymous context only. No profiles, public counts, or popularity mechanics.
        </p>
      </div>
    </div>
  );
}

// ==========================================
// HELPERS
// ==========================================

function formatCategory(category: string): string {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getMockSituations(): Situation[] {
  return [
    {
      id: '1',
      title: 'Protocol amendments killing enrollment momentum',
      description: 'We had strong enrollment going, then three protocol amendments in two months. Now sites are confused and patients are dropping.',
      issueCategory: 'enrollment',
      trialPhase: 'Phase 3',
      therapeuticArea: 'Oncology',
      roleContext: 'CRC',
      status: 'escalating',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Eligibility criteria too narrow for real patients',
      description: 'The I/E criteria are so restrictive we\'re screening 20 patients to enroll 1. Real patients have comorbidities.',
      issueCategory: 'enrollment',
      trialPhase: 'Phase 2',
      therapeuticArea: 'Cardiology',
      roleContext: 'CRA',
      status: 'new',
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Visit schedule is crushing site capacity',
      description: 'Weekly visits for 6 months, each with 15+ assessments. Patients are exhausted, staff is burned out.',
      issueCategory: 'protocol-burden',
      trialPhase: 'Phase 2',
      therapeuticArea: 'Neurology',
      roleContext: 'CRC',
      status: 'evolving',
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      title: 'We\'re running 12 studies with 3 coordinators',
      description: 'Every sponsor thinks their study is the priority. We\'re underwater. Quality is suffering.',
      issueCategory: 'site-overload',
      trialPhase: 'Multiple',
      therapeuticArea: 'Multiple',
      roleContext: 'CRC',
      status: 'escalating',
      createdAt: new Date().toISOString()
    },
    {
      id: '5',
      title: 'Getting different answers from CRO and sponsor',
      description: 'Asked the CRO about a protocol deviation, they said one thing. Sponsor said something completely different.',
      issueCategory: 'cro-disconnect',
      trialPhase: 'Phase 3',
      therapeuticArea: 'Oncology',
      roleContext: 'Site Director',
      status: 'evolving',
      createdAt: new Date().toISOString()
    },
    {
      id: '6',
      title: 'Reimbursement delays threatening site viability',
      description: 'Haven\'t received payment for completed visits in 4 months. Our institution is questioning whether to keep this study open.',
      issueCategory: 'reimbursement',
      trialPhase: 'Phase 3',
      therapeuticArea: 'Multiple',
      roleContext: 'Site Director',
      status: 'escalating',
      createdAt: new Date().toISOString()
    }
  ];
}

function getMockPatterns(): Pattern[] {
  return [
    {
      patternId: 'p1',
      patternTitle: 'Enrollment Challenges Keep Appearing',
      description: 'This issue is appearing across multiple trials and therapeutic areas. No consistent solution has emerged yet.',
      therapeuticAreas: ['Oncology', 'Cardiology', 'Neurology'],
      trialPhases: ['Phase 2', 'Phase 3'],
      patternStatus: 'repeating',
      resolutionStatus: 'unresolved',
      situationCount: 0
    },
    {
      patternId: 'p2',
      patternTitle: 'Protocol Burden is Slowing Things Down',
      description: 'This issue is appearing across multiple trials. It\'s showing up in different trial phases.',
      therapeuticAreas: ['Neurology', 'Immunology'],
      trialPhases: ['Phase 2', 'Phase 3'],
      patternStatus: 'emerging',
      resolutionStatus: 'unresolved',
      situationCount: 0
    },
    {
      patternId: 'p3',
      patternTitle: 'Sites Are Getting Overwhelmed',
      description: 'This issue is appearing across multiple trials. No consistent solution has emerged yet.',
      therapeuticAreas: ['Multiple'],
      trialPhases: ['Phase 2', 'Phase 3'],
      patternStatus: 'critical',
      resolutionStatus: 'unresolved',
      situationCount: 0
    },
    {
      patternId: 'p4',
      patternTitle: 'CRO-Sponsor Communication Gaps',
      description: 'This issue is appearing across multiple trials. No consistent solution has emerged yet.',
      therapeuticAreas: ['Oncology', 'Cardiology'],
      trialPhases: ['Phase 3'],
      patternStatus: 'repeating',
      resolutionStatus: 'partial',
      situationCount: 0
    }
  ];
}
