/**
 * New Situation Page — ZERO-FRICTION INPUT
 * 
 * TRANSLATION ENGINE FRONTEND
 * 
 * Rules:
 * - Single text field only
 * - Prompt: "What question do you need help answering?"
 * - Subtext: anonymity reminder
 * - Optional chips (NOT required)
 * - No required fields beyond text
 * - No multi-step forms
 * - Submission must remain <30 seconds
 * - Mobile-first design
 * 
 * Flow:
 * 1. Input → auto-redact → show sanitized version
 * 2. User reviews sanitized version: Post or Edit
 * 3. On Post: submit and show reflection
 */

'use client';

import { MembershipPending } from '@/components/MemberNav';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { Loader2, Shield, Eye, CheckCircle, AlertTriangle, User } from 'lucide-react';

// Optional chips — NOT required
const SIGNAL_CHIPS = [
  { id: 'worsening', label: 'This is getting worse', icon: '📈' },
  { id: 'workaround', label: 'We\'re using workarounds', icon: '🔧' },
  { id: 'no_escalation', label: 'No one is escalating this', icon: '🤐' },
  { id: 'patient_struggle', label: 'Patients are struggling', icon: '😔' },
  { id: 'overload', label: 'Site is overloaded', icon: '⚡' },
];

interface ReflectionContent {
  patternName: string;
  causalChain: string;
  contextTag: string;
  observedWorkarounds: string[];
  connections: string[];
  peerObservations: string[];
  attemptedApproaches: string[];
  failedApproaches: string[];
  trajectoryAssessment: string;
  classificationLabel: string;
  confidenceLevel: string;
  confidenceQualifier: string;
  riskDirection: string;
}

interface SubmissionResult {
  success: boolean;
  id?: string;
  redactedContent?: string;
  redactionsApplied?: number;
  reflection?: ReflectionContent;
  message?: string;
}

type Step = 'input' | 'review' | 'processing' | 'confirmation';

export default function NewSituationPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  
  const [step, setStep] = useState<Step>('input');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state — MINIMAL
  const [description, setDescription] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  
  // Review state
  const [redactedContent, setRedactedContent] = useState('');
  const [redactionCount, setRedactionCount] = useState(0);
  
  // Result state
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [approved, setApproved] = useState(false);
  const [suspended, setSuspended] = useState(false);

  // Check onboarding status when user is authenticated
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded || !isSignedIn) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const response = await fetch('/api/user/status');
        if (response.ok) {
          const data = await response.json();
          setOnboardingComplete(data.onboardingCompleted === true);
          setApproved(data.approved === true);
          setSuspended(data.suspended === true);
        } else {
          setOnboardingComplete(false);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setOnboardingComplete(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [isLoaded, isSignedIn]);

  // Loading state
  if (!isLoaded || checkingOnboarding) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-400">Checking your account...</p>
      </div>
    );
  }

  // Membership gate - signed in and onboarded, but not yet approved (or suspended)
  if (isSignedIn && onboardingComplete && (!approved || suspended)) {
    return (
      <div className="min-h-screen px-4 py-16">
        {suspended ? (
          <div className="mx-auto max-w-xl rounded-lg border border-slate-700 bg-slate-800/50 p-6 text-slate-300">
            <h2 className="text-xl font-semibold text-white">Your account is suspended</h2>
            <p className="mt-3">Contact BTP support if you believe this is a mistake: fortunaindustriesinc@gmail.com.</p>
          </div>
        ) : <MembershipPending />}
      </div>
    );
  }

  // Account Gate - Not authenticated
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-cyan-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Sign in to ask the BTP community.
          </h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            BTP requires sign-in so each submission can be protected, reviewed, and connected to your display handle. Your identity is not displayed with community posts. Authorized BTP staff can access account information for verification and safety.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/sign-up"
              className="w-full py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
            >
              Create account
            </Link>
            <Link
              href="/sign-in"
              className="w-full py-3 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Profile Completion Gate - Authenticated but onboarding incomplete
  if (!onboardingComplete) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Complete your profile to share
          </h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Before you can submit, we need a few details to connect your submissions to your display handle.
          </p>
          <Link
            href="/onboarding"
            className="w-full py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors block"
          >
            Complete profile
          </Link>
        </div>
      </div>
    );
  }

  const toggleChip = (chipId: string) => {
    setSelectedChips(prev => 
      prev.includes(chipId) 
        ? prev.filter(c => c !== chipId)
        : [...prev, chipId]
    );
  };

  // Step 1: Submit for redaction review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError('Please enter your question');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/situations/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          chips: selectedChips
        })
      });

      const data = await response.json();

      if (data.success) {
        setRedactedContent(data.redactedContent);
        setRedactionCount(data.redactionsApplied || 0);
        setStep('review');
      } else {
        setError(data.error || 'Failed to process');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to process. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Confirm and post
  const handleConfirmPost = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setStep('processing');

      const response = await fetch('/api/situations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: redactedContent,
          chips: selectedChips,
          confirmedRedaction: true
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setStep('confirmation');
      } else {
        setError(data.error || 'Failed to submit');
        setStep('review');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to submit. Please try again.');
      setStep('review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOriginal = () => {
    setStep('input');
  };

  const handleConfirm = () => {
    router.push('/situations');
  };

  // ==================== PROCESSING STATE ====================
  if (step === 'processing') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Preparing your question</h2>
        <p className="text-slate-400 text-center mb-6">Protecting identifying details and organizing the context...</p>
        <div className="text-sm text-slate-500 text-center space-y-1">
          <p>Checking for pattern matches</p>
          <p>Identifying workarounds others have used</p>
          <p>Protecting your identity</p>
        </div>
        
      </div>
    );
  }

  // ==================== CONFIRMATION STATE ====================
  if (step === 'confirmation' && result) {
    return (
      <div className="min-h-screen">
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Your question is live.</h1>
            <p className="text-slate-400">Verified BTP members can now answer it publicly without exposing their identity.</p>
          </div>

          {/* Anonymity Confirmation */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-5 h-5 text-cyan-500 mt-0.5" />
              <div>
                <h3 className="text-white font-medium">Your identity is protected</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Identity protected in community discussions · Review redactions before posting
                </p>
              </div>
            </div>
            {redactionCount > 0 && (
              <p className="text-sm text-amber-400">
                {redactionCount} potential identifier(s) were automatically removed
              </p>
            )}
          </div>

          {/* Reflection — The Translation Output */}
          {result.reflection && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-cyan-500" />
                <h3 className="text-white font-medium">What we're seeing</h3>
              </div>
              
              {/* Pattern Name — specific, causal */}
              {result.reflection.patternName && (
                <div className="mb-4 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-md">
                  <p className="text-cyan-300 text-sm font-medium">{result.reflection.patternName}</p>
                  {result.reflection.causalChain && (
                    <p className="text-slate-500 text-xs mt-1">{result.reflection.causalChain}</p>
                  )}
                </div>
              )}

              {/* Confidence + Risk Direction */}
              <div className="flex gap-3 mb-4">
                {result.reflection.confidenceLevel && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.reflection.confidenceLevel.includes('Strong')
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : result.reflection.confidenceLevel.includes('Repeating')
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-700 text-slate-300'
                  }`}>
                    {result.reflection.confidenceLevel}
                  </span>
                )}
                {result.reflection.riskDirection && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.reflection.riskDirection === 'Critical'
                      ? 'bg-red-500/20 text-red-400'
                      : result.reflection.riskDirection === 'Escalating'
                        ? 'bg-amber-500/20 text-amber-400'
                        : result.reflection.riskDirection === 'Worsening'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-slate-700 text-slate-300'
                  }`}>
                    {result.reflection.riskDirection}
                  </span>
                )}
              </div>

              {/* Classification */}
              <div className="mb-4 px-3 py-2 bg-slate-800 rounded-md">
                <p className={`text-sm font-medium ${
                  result.reflection.classificationLabel.includes('escalate') 
                    ? 'text-amber-400' 
                    : 'text-slate-300'
                }`}>
                  {result.reflection.classificationLabel}
                </p>
              </div>

              {/* Observed Workarounds — specific, real-feeling */}
              {result.reflection.observedWorkarounds && result.reflection.observedWorkarounds.length > 0 && (
                <div className="mb-4">
                  <span className="text-slate-500 text-sm">What operators have tried</span>
                  {result.reflection.observedWorkarounds.map((w, i) => (
                    <p key={i} className="text-white text-sm mt-1">· {w}</p>
                  ))}
                </div>
              )}

              {/* Trajectory */}
              {result.reflection.trajectoryAssessment && (
                <div className="mb-4">
                  <span className="text-slate-500 text-sm">What this may turn into</span>
                  <p className="text-white text-sm mt-1">{result.reflection.trajectoryAssessment}</p>
                </div>
              )}

              {/* Connections */}
              {result.reflection.connections.length > 0 && (
                <div className="mb-4">
                  <span className="text-slate-500 text-sm">What this connects to</span>
                  {result.reflection.connections.map((c, i) => (
                    <p key={i} className="text-white text-sm mt-1">· {c}</p>
                  ))}
                </div>
              )}

              {/* What others are seeing */}
              {result.reflection.peerObservations.length > 0 && (
                <div className="mb-4">
                  <span className="text-slate-500 text-sm">What others are seeing</span>
                  {result.reflection.peerObservations.map((o, i) => (
                    <p key={i} className="text-white text-sm mt-1">· {o}</p>
                  ))}
                </div>
              )}

              {/* What people tried */}
              {result.reflection.attemptedApproaches.length > 0 && (
                <div className="mb-4">
                  <span className="text-slate-500 text-sm">What people tried</span>
                  {result.reflection.attemptedApproaches.map((a, i) => (
                    <p key={i} className="text-white text-sm mt-1">· {a}</p>
                  ))}
                </div>
              )}

              {/* What didn't hold up */}
              {result.reflection.failedApproaches.length > 0 && (
                <div className="mb-4">
                  <span className="text-slate-500 text-sm">What didn't hold up</span>
                  {result.reflection.failedApproaches.map((f, i) => (
                    <p key={i} className="text-white text-sm mt-1">· {f}</p>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-600 mt-4 italic">{result.reflection.confidenceQualifier}</p>
            </div>
          )}

          {/* What happens next */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 mb-6">
            <h3 className="text-cyan-400 font-medium mb-2">What happens next</h3>
            <p className="text-sm text-slate-300 mb-3">
              Your question is visible to approved members. You will see responses here as peers answer;
              during the early beta, responses may take time.
            </p>
            {result.reflection?.patternName && (
              <p className="text-xs text-cyan-400/80 italic mb-3">
                Early indication: this may relate to {result.reflection.patternName.toLowerCase()} patterns
              </p>
            )}
            <p className="text-sm text-slate-400">
              Later, you can return and record what happened. Outcomes help other members learn what actually worked.
            </p>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
          >
            Continue to Feed
          </button>
        </main>
      </div>
    );
  }

  // ==================== REVIEW STATE (Safe-to-Submit Layer) ====================
  if (step === 'review') {
    return (
      <div className="min-h-screen">
        <header className="border-b border-slate-800">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <button onClick={handleEditOriginal} className="text-slate-400 hover:text-white text-sm">
              ← Edit original
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <ol aria-label="Steps" className="mb-6 flex gap-3">{['Your question', 'Review and post'].map((s, i) => <li key={s} aria-current={i === 1 ? 'step' : undefined} className={`flex-1 border-t-[3px] pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${i <= 1 ? 'border-[#c9a66b]' : 'border-white/10'} ${i === 1 ? 'text-[#e8cc94]' : 'text-slate-500'}`}>{i + 1} · {s}</li>)}</ol>
          <h1 className="text-3xl text-[#fff6ea] mb-2">Review before posting</h1>
          <p className="text-slate-400 mb-6">
            We removed details that could identify a study, site, sponsor, or patient.
          </p>

          {/* Redacted Content */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-cyan-500" />
              <span className="text-sm text-cyan-400 font-medium">Sanitized version</span>
            </div>
            <p className="text-white whitespace-pre-wrap">{redactedContent}</p>
            {redactionCount > 0 && (
              <p className="text-xs text-amber-400 mt-3">
                {redactionCount} identifier(s) automatically removed
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-200">
                Do not include patient identifiers, protocol IDs, sponsor names, site names, or investigator names. 
                Edit your original text if any remain.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleEditOriginal}
              className="flex-1 py-3 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleConfirmPost}
              disabled={submitting}
              className="flex-1 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Posting...' : 'Post with your handle'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ==================== INPUT STATE (DEFAULT) ====================
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/situations" className="text-slate-400 hover:text-white text-sm">
            ← All questions
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <ol aria-label="Steps" className="mb-6 flex gap-3">{['Your question', 'Review and post'].map((s, i) => <li key={s} aria-current={i === 0 ? 'step' : undefined} className={`flex-1 border-t-[3px] pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${i <= 0 ? 'border-[#c9a66b]' : 'border-white/10'} ${i === 0 ? 'text-[#e8cc94]' : 'text-slate-500'}`}>{i + 1} · {s}</li>)}</ol>
        <h1 className="text-3xl text-[#fff6ea] mb-2">
          Ask what you <span className="text-[#e8cc94]">can&apos;t ask at work.</span>
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Your question shows only your verified role, never your name or employer. You review it before anyone sees it. No names, sponsors, sites, protocol IDs or patient details.
        </p>

        {/* Main Form — SINGLE TEXT FIELD */}
        <form onSubmit={handleReviewSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* THE SINGLE INPUT FIELD */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-base"
              placeholder="Ask the question you cannot get a clear answer to at work."
              autoFocus
            />
            <p className="text-xs text-slate-600 mt-1.5">
              One sentence is enough. We'll do the rest.
            </p>
          </div>

          {/* OPTIONAL CHIPS — NOT required */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]">Anything else true right now? <span className="tracking-[0.1em] text-slate-500">(optional)</span></p>
            <div className="flex flex-wrap gap-2">
              {SIGNAL_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => toggleChip(chip.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedChips.includes(chip.id)
                      ? 'bg-cyan-600/30 border border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-900 border border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymity reminder */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Shield className="w-3.5 h-3.5" />
            <span>Names, emails, phone numbers and protocol numbers are removed automatically. Check your text too.</span>
          </div>

          {/* SUBMIT — Single button */}
          <button
            type="submit"
            disabled={submitting || !description.trim()}
            className="btn-primary w-full rounded py-3 text-sm uppercase tracking-[0.16em] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Preparing…' : 'Next: review →'}
          </button>
        </form>
      </main>
    </div>
  );
}
