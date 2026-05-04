/**
 * New Situation Page — ZERO-FRICTION INPUT
 * 
 * TRANSLATION ENGINE FRONTEND
 * 
 * Rules:
 * - Single text field only
 * - Prompt: "What's happening in your trial that shouldn't be?"
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

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { Loader2, Shield, Eye, CheckCircle, AlertTriangle } from 'lucide-react';

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

  // Redirect if not signed in
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
        <p className="text-slate-400 text-lg text-center">Please sign in to share a situation</p>
        <Link href="/sign-in" className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">
          Sign In
        </Link>
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
      setError('Please describe what\'s happening');
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
          originalDescription: description.trim(),
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
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Translating your experience</h2>
        <p className="text-slate-400 text-center mb-6">Comparing against similar anonymous context...</p>
        <div className="text-sm text-slate-500 text-center space-y-1">
          <p>Checking for pattern matches</p>
          <p>Identifying workarounds others have used</p>
          <p>Protecting your identity</p>
        </div>
        <p className="text-xs text-slate-600 mt-6">You'll receive a full reflection within 48 hours</p>
      </div>
    );
  }

  // ==================== CONFIRMATION STATE ====================
  if (step === 'confirmation' && result) {
    return (
      <div className="min-h-screen bg-slate-950">
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">You said what you couldn't say anywhere else.</h1>
            <p className="text-slate-400">Your situation has been turned into anonymous, structured context.</p>
          </div>

          {/* Anonymity Confirmation */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-5 h-5 text-cyan-500 mt-0.5" />
              <div>
                <h3 className="text-white font-medium">Your identity is protected</h3>
                <p className="text-slate-400 text-sm mt-1">
                  No employer visibility · No identity attached · All data anonymized
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
              This is being compared with similar anonymous context from other operators.
              You'll receive a detailed reflection within 48 hours.
            </p>
            {result.reflection?.patternName && (
              <p className="text-xs text-cyan-400/80 italic mb-3">
                Early indication: this may relate to {result.reflection.patternName.toLowerCase()} patterns
              </p>
            )}
            <p className="text-sm text-slate-400">
              In about a week, we'll check back: did this stay manageable, get worse, or turn into something real?
              Your answer helps us learn what patterns actually matter.
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
      <div className="min-h-screen bg-slate-950">
        <header className="border-b border-slate-800">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <button onClick={handleEditOriginal} className="text-slate-400 hover:text-white text-sm">
              ← Edit original
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-2">Review before posting</h1>
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
              {submitting ? 'Posting...' : 'Post Anonymously'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ==================== INPUT STATE (DEFAULT) ====================
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/situations" className="text-slate-400 hover:text-white text-sm">
            ← Back to Feed
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          What's happening in your trial that shouldn't be?
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Keep it anonymous. No names, sponsors, sites, protocol IDs, or patient details.
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
              placeholder="e.g., 'We keep skipping the pharmacokinetic draws because the timing window is impossible with our patient volume' or 'Everyone knows the monitoring visit prep takes two full days but nobody accounts for it'"
              autoFocus
            />
            <p className="text-xs text-slate-600 mt-1.5">
              One sentence is enough. We'll do the rest.
            </p>
          </div>

          {/* OPTIONAL CHIPS — NOT required */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Optionally tag what's happening:</p>
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
                  <span className="mr-1">{chip.icon}</span>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymity reminder */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Shield className="w-3.5 h-3.5" />
            <span>Auto-redaction active · No employer visibility · Anonymous by default</span>
          </div>

          {/* SUBMIT — Single button */}
          <button
            type="submit"
            disabled={submitting || !description.trim()}
            className="w-full py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
          >
            {submitting ? 'Processing...' : 'Review & Post'}
          </button>
        </form>
      </main>
    </div>
  );
}