/**
 * Situation Detail Page - Structured Operator Interaction
 *
 * Privacy rules:
 * - no public identity, open discussion, popularity mechanics, or exact public counts
 * - structured responses only
 * - optional context capped at 200 characters
 * - privacy-safe summaries only
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import PatternSignals from '@/components/PatternSignals';

interface Situation {
  id: string;
  title: string;
  description: string;
  therapeuticArea: string | null;
  trialPhase: string | null;
  issueCategory: string | null;
  timeBucket: string;
  timeLabel: string;
  resolutionStatus?: string;
}

interface InteractionStatus {
  hasInteractions: boolean;
  interactionTypesPresent: string[];
  userInteractions: string[];
  userSafeSummaries: string[];
  maturityLabel: string;
  updatedReflectionAvailable: boolean;
}

const INTERACTION_BUTTONS = [
  { type: 'SEEN_THIS', label: "I've seen this", helper: 'Validates that this is not isolated', icon: '👀' },
  { type: 'TRIED_SIMILAR', label: 'We tried something similar', helper: 'Adds attempted-action context', icon: '🔁' },
  { type: 'WORKED_FOR_US', label: 'What worked for us', helper: 'Share a useful direction anonymously', icon: '✅', needsContext: true },
  { type: 'DIDNT_HOLD_UP', label: "What didn't hold up", helper: 'Separates temporary fixes from durable ones', icon: '⚠️', needsContext: true },
  { type: 'CAUSED_OTHER_ISSUES', label: 'This caused other issues', helper: 'Flags downstream risk', icon: '🧩', needsContext: true },
  { type: 'GOT_WORSE_LATER', label: 'This got worse later', helper: 'Shows progression risk', icon: '📈' },
  { type: 'STAYED_MANAGEABLE', label: 'This stayed manageable', helper: 'Helps calibrate urgency', icon: '🟢' },
];

const OUTCOME_OPTIONS = [
  { type: 'resolution', label: 'This was resolved', icon: '🎯' },
  { type: 'validation', label: 'Confirmed accurate', icon: '✓' },
  { type: 'correction', label: 'Needed correction', icon: '✏️' },
  { type: 'incomplete', label: 'Information incomplete', icon: '⚠️' },
  { type: 'misleading', label: 'Was misleading', icon: '❗' }
];

export default function SituationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isSignedIn } = useAuth();
  const [situation, setSituation] = useState<Situation | null>(null);
  const [interactionStatus, setInteractionStatus] = useState<InteractionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedContextType, setSelectedContextType] = useState<string | null>(null);
  const [contextText, setContextText] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [outcomeData, setOutcomeData] = useState({
    outcomeType: '',
    outcomeNotes: '',
    wasHelpful: null as boolean | null
  });

  useEffect(() => {
    fetchSituation();
  }, [id]);

  const fetchSituation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/situations/${id}`);

      if (!response.ok) {
        throw new Error('Situation not found');
      }

      const data = await response.json();
      setSituation(data.situation);
      setInteractionStatus(data.interactions);
    } catch (err) {
      console.error('Error fetching situation:', err);
      setError('Failed to load situation');
    } finally {
      setLoading(false);
    }
  };

  const submitInteraction = async (interactionType: string, context?: string) => {
    if (!isSignedIn) {
      window.location.href = '/sign-in';
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await fetch(`/api/situations/${id}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionType, context })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message);
        setContextText('');
        setSelectedContextType(null);
        fetchSituation();
        setTimeout(() => setSuccessMessage(null), 4500);
      } else {
        setError(data.error || 'Failed to record anonymous context');
      }
    } catch (err) {
      console.error('Error recording interaction:', err);
      setError('Failed to record anonymous context');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInteraction = async (button: typeof INTERACTION_BUTTONS[number]) => {
    if (button.needsContext) {
      setSelectedContextType(button.type);
      setContextText('');
      return;
    }

    await submitInteraction(button.type);
  };

  const handleSubmitContextInteraction = async () => {
    if (!selectedContextType || !contextText.trim()) return;
    await submitInteraction(selectedContextType, contextText.trim());
  };

  const handleSubmitOutcome = async () => {
    if (!outcomeData.outcomeType) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/situations/${id}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcomeType: outcomeData.outcomeType,
          outcomeData: outcomeData.outcomeNotes,
          wasHelpful: outcomeData.wasHelpful
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Outcome recorded. Thank you for closing the loop.');
        setOutcomeData({ outcomeType: '', outcomeNotes: '', wasHelpful: null });
        setShowOutcomeForm(false);
        fetchSituation();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'Failed to record outcome');
      }
    } catch (err) {
      console.error('Error recording outcome:', err);
      setError('Failed to record outcome');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedButton = INTERACTION_BUTTONS.find((button) => button.type === selectedContextType);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error || !situation) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
        <p className="text-red-400 text-lg text-center">{error || 'Situation not found'}</p>
        <Link href="/situations" className="mt-4 text-cyan-400 hover:text-cyan-300">
          ← Back to Situations
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/situations" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
            ← Back to Intelligence Feed
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
            <p className="text-emerald-300">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
            <p className="text-red-300">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-200 underline mt-2">Dismiss</button>
          </div>
        )}

        <article className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {situation.therapeuticArea && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {situation.therapeuticArea.replace('_', ' ')}
                </span>
              )}
              {situation.trialPhase && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                  {situation.trialPhase}
                </span>
              )}
              {situation.resolutionStatus && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {situation.resolutionStatus}
                </span>
              )}
              <span className="text-sm text-slate-500 ml-auto">{situation.timeLabel}</span>
            </div>

            <h1 className="text-2xl font-bold text-white mb-4">{situation.title}</h1>

            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-slate-300">{situation.description}</p>
              <div className="mt-4">
                <PatternSignals contributionId={id} />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">Add anonymous operator context</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Choose a structured response. Keep it general, anonymous, and separate from public identity.
                  </p>
                </div>
                {interactionStatus?.maturityLabel && (
                  <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700">
                    {interactionStatus.maturityLabel}
                  </span>
                )}
              </div>

              {interactionStatus?.hasInteractions && (
                <div className="mb-5 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <p className="text-sm font-medium text-cyan-300 mb-2">What is changing around this situation</p>
                  <div className="space-y-1">
                    {interactionStatus.userSafeSummaries.length > 0 ? (
                      interactionStatus.userSafeSummaries.map((summary) => (
                        <p key={summary} className="text-sm text-slate-300">· {summary}</p>
                      ))
                    ) : (
                      <p className="text-sm text-slate-300">Others are starting to recognize this pattern.</p>
                    )}
                  </div>
                  {interactionStatus.updatedReflectionAvailable && (
                    <Link href={`/insights/reflection/${id}`} className="inline-block mt-3 text-sm text-cyan-300 hover:text-cyan-200">
                      View updated reflection →
                    </Link>
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {INTERACTION_BUTTONS.map((button) => {
                  const hasInteracted = interactionStatus?.userInteractions.includes(button.type);
                  return (
                    <button
                      key={button.type}
                      onClick={() => handleInteraction(button)}
                      disabled={submitting || hasInteracted}
                      className={`text-left rounded-lg border p-4 transition-colors ${
                        hasInteracted
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200 cursor-default'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-900'
                      } ${submitting ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <span>{button.icon}</span>
                        <span>{button.label}</span>
                        {hasInteracted && <span className="ml-auto">✓</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{button.helper}</p>
                    </button>
                  );
                })}
              </div>

              {selectedContextType && selectedButton && (
                <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <h3 className="text-sm font-medium text-white mb-1">{selectedButton.label}</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Add up to 200 characters. Keep it general. Identifying details will be redacted or held for review.
                  </p>
                  <textarea
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value.slice(0, 200))}
                    rows={3}
                    maxLength={200}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Example: We documented the workaround weekly, but the root cause stayed unresolved."
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{contextText.length}/200</span>
                    <span>Anonymous context only</span>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedContextType(null);
                        setContextText('');
                      }}
                      className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitContextInteraction}
                      disabled={submitting || !contextText.trim()}
                      className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit anonymously'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <h2 className="text-sm font-medium text-slate-300 mb-2">Close the loop later</h2>
              <p className="text-xs text-slate-500 mb-4">
                If this changed, resolved, or became worse, add an outcome. It improves related context without opening a discussion.
              </p>

              {!showOutcomeForm ? (
                <button
                  onClick={() => setShowOutcomeForm(true)}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20"
                >
                  <span className="mr-2">🎯</span>
                  Report Outcome
                </button>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Outcome Type</label>
                      <div className="flex flex-wrap gap-2">
                        {OUTCOME_OPTIONS.map((option) => (
                          <button
                            key={option.type}
                            onClick={() => setOutcomeData({ ...outcomeData, outcomeType: option.type })}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              outcomeData.outcomeType === option.type
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                            }`}
                          >
                            <span className="mr-1">{option.icon}</span>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Was this information helpful?</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setOutcomeData({ ...outcomeData, wasHelpful: true })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            outcomeData.wasHelpful === true
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                          }`}
                        >
                          👍 Yes
                        </button>
                        <button
                          onClick={() => setOutcomeData({ ...outcomeData, wasHelpful: false })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            outcomeData.wasHelpful === false
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                          }`}
                        >
                          👎 No
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes (Optional)</label>
                      <textarea
                        value={outcomeData.outcomeNotes}
                        onChange={(e) => setOutcomeData({ ...outcomeData, outcomeNotes: e.target.value })}
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="What happened? Keep it anonymous."
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setShowOutcomeForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitOutcome}
                        disabled={submitting || !outcomeData.outcomeType}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Outcome'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>

        <div className="mt-6 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <div className="flex items-start">
            <span className="text-amber-400 text-lg mr-2">⚠️</span>
            <div className="text-sm text-amber-100">
              <p className="font-medium">Anonymity Reminder</p>
              <p className="mt-1">
                Do not include names, sites, protocol IDs, sponsor names, dates, locations, or other identifiers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
