from pathlib import Path

root = Path('cei-platform')

# 1) Situation detail page
(root / 'app/situations/[id]/page.tsx').write_text(r'''/**
 * Situation Detail Page - Structured Operator Interaction
 *
 * Anti-forum rules:
 * - no usernames, profiles, replies, likes, votes, karma, popularity sorting, or exact counts
 * - structured interactions only
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
  { type: 'TRIED_SIMILAR', label: 'We tried something similar', helper: 'Adds attempted-action signal', icon: '🔁' },
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
                  <h2 className="text-lg font-semibold text-white">Add anonymous operator signal</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Choose a structured response. No replies, profiles, names, likes, or public counts.
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
                If this changed, resolved, or became worse, add an outcome. It improves pattern quality without creating a thread.
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
''')

# 2) Reflection API
(root / 'app/api/insights/reflection/[id]/route.ts').write_text(r'''/**
 * Reflection API - privacy-safe return loop
 *
 * Returns anonymized, bucketed reflection updates. It deliberately avoids:
 * - exact small counts
 * - exact percentages
 * - operator profile codes
 * - identities or actor-level details
 */

import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { bucketTimestamp } from '@/lib/anti-correlation';
import {
  buildInteractionSummary,
  bucketCount,
  normalizeInteractionType,
  type OperatorInteractionType,
} from '@/lib/operator-return-loop';
import { getOrCreateUserMetrics, trackEvent, EVENT_TYPES } from '@/lib/analytics-tracker';

interface ReflectionResponse {
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

const DISPLAYABLE_CONTEXT_TYPES: OperatorInteractionType[] = [
  'WORKED_FOR_US',
  'DIDNT_HOLD_UP',
  'CAUSED_OTHER_ISSUES',
  'TRIED_SIMILAR',
  'GOT_WORSE_LATER',
  'STAYED_MANAGEABLE',
];

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[4];

  if (!id) {
    return createErrorResponse('Reflection ID is required', 400);
  }

  const contribution = await prisma.contribution.findFirst({
    where: {
      id,
      userId: user.id,
      contributionType: 'situation',
    },
    include: {
      interactions: {
        where: { displayStatus: { notIn: ['BLOCKED', 'SUPPRESSED'] } },
        select: {
          interactionType: true,
          context: true,
          displayStatus: true,
        },
      },
    },
  });

  if (!contribution) {
    return createErrorResponse('Contribution not found', 404);
  }

  const similarContributions = await prisma.contribution.findMany({
    where: {
      id: { not: id },
      contributionType: 'situation',
      isHidden: false,
      isFlagged: false,
      forceExcludeFromPatterns: false,
      OR: [
        {
          signalQualityScore: { in: ['HIGH', 'MEDIUM'] },
          OR: [
            { issueCategory: contribution.issueCategory },
            { therapeuticArea: contribution.therapeuticArea },
          ],
        },
        {
          forceIncludeFromPatterns: true,
          OR: [
            { issueCategory: contribution.issueCategory },
            { therapeuticArea: contribution.therapeuticArea },
          ],
        },
      ],
    },
    include: {
      interactions: {
        where: { displayStatus: { notIn: ['BLOCKED', 'SUPPRESSED'] } },
        select: {
          interactionType: true,
          context: true,
          displayStatus: true,
        },
      },
    },
    take: 50,
  });

  const allInteractions = [
    ...contribution.interactions,
    ...similarContributions.flatMap((similar) => similar.interactions),
  ];

  const ownSummary = buildInteractionSummary(contribution.interactions);
  const combinedSummary = buildInteractionSummary(allInteractions);
  const responseSignals = buildResponseSignals(allInteractions);
  const contexts = extractPrivacySafeContexts(allInteractions);

  const similarIssueCount = similarContributions.length + 1;
  const patternStatus = determinePatternStatus(similarIssueCount, combinedSummary.maturityLabel);
  const confidence = determineConfidence(similarIssueCount, allInteractions.length);
  const therapeuticAreas = Array.from(
    new Set(
      [contribution.therapeuticArea, ...similarContributions.map((item) => item.therapeuticArea)]
        .filter((value): value is string => Boolean(value))
    )
  ).slice(0, 4);
  const trialPhases = Array.from(
    new Set(
      [contribution.trialPhase, ...similarContributions.map((item) => item.trialPhase)]
        .filter((value): value is string => Boolean(value))
    )
  ).slice(0, 4);

  const metrics = await getOrCreateUserMetrics(user.id, 'operator');
  await trackEvent({
    anonymousUserId: metrics.anonymousUserId,
    eventType: EVENT_TYPES.SITUATION.REFLECTION_OPENED,
    eventCategory: 'situation',
    objectType: 'Contribution',
    objectId: contribution.id,
    metadata: {
      updatedBasedOnAnonymousContext: ownSummary.updatedReflectionAvailable,
      maturityLabel: ownSummary.maturityLabel,
      privacySafe: true,
    },
  });

  const response: ReflectionResponse = {
    id: contribution.id,
    title: contribution.title || 'Your Situation',
    timeBucket: bucketTimestamp(contribution.createdAt).label,
    updatedBasedOnAnonymousContext: ownSummary.updatedReflectionAvailable,
    patternCluster: {
      similarIssueBucket: bucketCount(similarIssueCount) || 'early',
      therapeuticAreas,
      trialPhases,
      patternStatus,
    },
    interactionSummary: {
      hasInteractions: ownSummary.hasInteractions,
      userSafeSummaries: ownSummary.userSafeSummaries,
      maturityLabel: ownSummary.maturityLabel,
      interactionTypesPresent: ownSummary.interactionTypesPresent,
    },
    responseSignals,
    whatWorked: contexts.WORKED_FOR_US,
    whatDidntHoldUp: contexts.DIDNT_HOLD_UP,
    downstreamRisks: [...contexts.CAUSED_OTHER_ISSUES, ...contexts.GOT_WORSE_LATER],
    confidence,
    opportunitySignal: contribution.microOpportunityEligible
      ? 'Your experience may be relevant to a short paid consult if a matching request appears.'
      : null,
  };

  return createApiResponse(response);
}, { requireAuth: true });

function buildResponseSignals(interactions: { interactionType: string }[]): string[] {
  const normalized = interactions
    .map((interaction) => normalizeInteractionType(interaction.interactionType))
    .filter((type): type is OperatorInteractionType => Boolean(type));

  const present = new Set(normalized);
  const signals: string[] = [];

  if (present.has('SEEN_THIS')) signals.push('Others have seen something similar.');
  if (present.has('TRIED_SIMILAR')) signals.push('Some operators tried a similar approach.');
  if (present.has('WORKED_FOR_US')) signals.push('There is at least one useful direction from similar context.');
  if (present.has('DIDNT_HOLD_UP')) signals.push('At least one workaround did not hold up.');
  if (present.has('CAUSED_OTHER_ISSUES')) signals.push('Someone reported downstream issues.');
  if (present.has('GOT_WORSE_LATER')) signals.push('This may become more serious if left alone.');
  if (present.has('STAYED_MANAGEABLE')) signals.push('This stayed manageable in at least one similar situation.');

  return signals;
}

function extractPrivacySafeContexts(
  interactions: { interactionType: string; context: string | null; displayStatus?: string | null }[]
): Record<OperatorInteractionType, string[]> {
  const result: Record<OperatorInteractionType, string[]> = {
    SEEN_THIS: [],
    TRIED_SIMILAR: [],
    WORKED_FOR_US: [],
    DIDNT_HOLD_UP: [],
    CAUSED_OTHER_ISSUES: [],
    GOT_WORSE_LATER: [],
    STAYED_MANAGEABLE: [],
  };

  for (const interaction of interactions) {
    const type = normalizeInteractionType(interaction.interactionType);
    if (!type || !DISPLAYABLE_CONTEXT_TYPES.includes(type)) continue;
    if (!interaction.context || interaction.displayStatus === 'PENDING_REVIEW') continue;

    const safeContext = interaction.context.trim().slice(0, 200);
    if (safeContext && !result[type].includes(safeContext)) {
      result[type].push(safeContext);
    }
  }

  return result;
}

function determinePatternStatus(
  similarIssueCount: number,
  maturityLabel: string
): ReflectionResponse['patternCluster']['patternStatus'] {
  if (maturityLabel === 'showing up repeatedly' || similarIssueCount >= 12) return 'showing up repeatedly';
  if (maturityLabel === 'repeating issue' || similarIssueCount >= 5) return 'repeating issue';
  return 'early indication';
}

function determineConfidence(similarCount: number, interactionCount: number): ReflectionResponse['confidence'] {
  if (similarCount >= 8 || interactionCount >= 8) return 'strong';
  if (similarCount >= 3 || interactionCount >= 3) return 'emerging';
  return 'low';
}

export default { GET };
''')

# 3) Reflection page
(root / 'app/insights/reflection/[id]/page.tsx').write_text(r'''/**
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
    low: { label: 'Early signals', color: 'text-slate-400', bg: 'bg-slate-500/20' },
    emerging: { label: 'Emerging pattern', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    strong: { label: 'Strong signal', color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
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
                  Someone added structured context after your original submission. The reflection below now includes that signal without exposing identity, count, or timing details.
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
              <h3 className="text-white font-medium">Anonymous operator signals</h3>
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
              {data.responseSignals.map((signal) => (
                <p key={signal} className="text-sm text-slate-300">· {signal}</p>
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
              <h3 className="text-amber-300 font-medium">Downstream risk signal</h3>
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
            <h3 className="text-cyan-400 font-medium mb-2">Micro-opportunity signal</h3>
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
''')

# 4) Admin interaction controls route list + seed
(root / 'app/api/admin/interactions/route.ts').write_text(r'''/**
 * Founder Interaction Controls API
 *
 * Admin-only route for reviewing structured operator signals and seeding private-alpha interactions.
 * User-facing product remains anti-forum: no public profiles, replies, votes, likes, or exact counts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAccess } from '@/lib/admin-auth';
import {
  normalizeInteractionType,
  OPERATOR_INTERACTION_TYPES,
  redactInteractionContext,
  triggerReturnLoopForInteraction,
} from '@/lib/operator-return-loop';

export async function GET(request: NextRequest) {
  const adminAuth = await verifyAdminAccess(request);
  if (!adminAuth.success) {
    return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.statusCode || 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'PENDING_REVIEW';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  const interactions = await prisma.interaction.findMany({
    where: status === 'ALL' ? {} : { displayStatus: status },
    select: {
      id: true,
      contributionId: true,
      interactionType: true,
      context: true,
      originalContext: true,
      correlationRisk: true,
      displayStatus: true,
      isSeeded: true,
      founderNote: true,
      isHighValue: true,
      escalatedToSafety: true,
      createdAt: true,
      contribution: {
        select: {
          title: true,
          issueCategory: true,
          therapeuticArea: true,
          trialPhase: true,
          userId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({
    success: true,
    interactions,
    meta: {
      privacyNote: 'Admin-only view. Do not expose user identities or raw context in user-facing surfaces.',
      generatedAt: new Date().toISOString(),
      adminUser: adminAuth.handle,
    },
  });
}

export async function POST(request: NextRequest) {
  const adminAuth = await verifyAdminAccess(request);
  if (!adminAuth.success) {
    return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.statusCode || 403 });
  }

  const body = await request.json();
  const contributionId = String(body.contributionId || '');
  const normalizedType = normalizeInteractionType(String(body.interactionType || ''));
  const rawContext = typeof body.context === 'string' ? body.context : undefined;

  if (!contributionId) {
    return NextResponse.json({ error: 'contributionId is required' }, { status: 400 });
  }

  if (!normalizedType || !OPERATOR_INTERACTION_TYPES.includes(normalizedType)) {
    return NextResponse.json({ error: `interactionType must be one of: ${OPERATOR_INTERACTION_TYPES.join(', ')}` }, { status: 400 });
  }

  if (rawContext && rawContext.trim().length > 200) {
    return NextResponse.json({ error: 'context must be 200 characters or fewer' }, { status: 400 });
  }

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId, contributionType: 'situation' },
    select: {
      id: true,
      userId: true,
      therapeuticArea: true,
      trialPhase: true,
      issueCategory: true,
    },
  });

  if (!contribution) {
    return NextResponse.json({ error: 'Situation not found' }, { status: 404 });
  }

  const contextResult = redactInteractionContext(rawContext, {
    therapeuticArea: contribution.therapeuticArea,
    trialPhase: contribution.trialPhase,
    issueCategory: contribution.issueCategory,
  });

  const interaction = await prisma.interaction.create({
    data: {
      contributionId,
      userId: null,
      interactionType: normalizedType,
      weight: Number(body.weight || 1),
      context: contextResult.blockedFromDisplay ? null : contextResult.displayContext,
      originalContext: contextResult.originalContext,
      correlationRisk: contextResult.correlationRisk,
      displayStatus: contextResult.blockedFromDisplay ? 'PENDING_REVIEW' : String(body.displayStatus || 'VISIBLE'),
      isSeeded: true,
      seededBy: adminAuth.handle || 'founder',
      founderNote: typeof body.founderNote === 'string' ? body.founderNote.slice(0, 500) : null,
      isHighValue: Boolean(body.isHighValue),
    },
  });

  if (contribution.userId && body.triggerNotification !== false) {
    await triggerReturnLoopForInteraction({
      contributionId,
      authorId: contribution.userId,
      actorId: 'founder-seed',
      interactionType: normalizedType,
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: adminAuth.userId,
      action: 'FOUNDER_SEEDED_INTERACTION',
      resourceType: 'Interaction',
      resourceId: interaction.id,
      details: {
        contributionId,
        interactionType: normalizedType,
        displayStatus: interaction.displayStatus,
        privacySafe: true,
      },
    },
  });

  return NextResponse.json({ success: true, interaction });
}
''')

# 5) Admin interaction item control
(root / 'app/api/admin/interactions/[id]/route.ts').write_text(r'''/**
 * Founder Interaction Item Controls API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { createReturnLoopNotification } from '@/lib/operator-return-loop';

const DISPLAY_STATUSES = ['VISIBLE', 'PENDING_REVIEW', 'SUPPRESSED', 'BLOCKED'];

export async function PATCH(request: NextRequest) {
  const adminAuth = await verifyAdminAccess(request);
  if (!adminAuth.success) {
    return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.statusCode || 403 });
  }

  const url = new URL(request.url);
  const id = url.pathname.split('/').pop() || '';
  const body = await request.json();

  const existing = await prisma.interaction.findUnique({
    where: { id },
    include: {
      contribution: {
        select: { id: true, userId: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Interaction not found' }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.displayStatus !== undefined) {
    if (!DISPLAY_STATUSES.includes(body.displayStatus)) {
      return NextResponse.json({ error: `displayStatus must be one of: ${DISPLAY_STATUSES.join(', ')}` }, { status: 400 });
    }
    updateData.displayStatus = body.displayStatus;
  }

  if (body.context !== undefined) updateData.context = body.context ? String(body.context).slice(0, 200) : null;
  if (body.founderNote !== undefined) updateData.founderNote = body.founderNote ? String(body.founderNote).slice(0, 500) : null;
  if (body.isHighValue !== undefined) updateData.isHighValue = Boolean(body.isHighValue);
  if (body.escalatedToSafety !== undefined) updateData.escalatedToSafety = Boolean(body.escalatedToSafety);

  const updated = await prisma.interaction.update({
    where: { id },
    data: updateData,
  });

  if (body.manualNotificationTrigger && existing.contribution.userId) {
    await createReturnLoopNotification({
      authorId: existing.contribution.userId,
      actorId: adminAuth.userId,
      contributionId: existing.contribution.id,
      trigger: body.manualNotificationTrigger,
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: adminAuth.userId,
      action: 'FOUNDER_INTERACTION_CONTROL_UPDATED',
      resourceType: 'Interaction',
      resourceId: id,
      details: {
        changedFields: Object.keys(updateData),
        manualNotificationTrigger: body.manualNotificationTrigger || null,
        privacySafe: true,
      },
    },
  });

  return NextResponse.json({ success: true, interaction: updated });
}
''')

# 6) Notification open/click tracking
(root / 'app/api/notifications/[id]/route.ts').write_text(r'''/**
 * Notification Detail API - Return Engine
 *
 * PATCH /api/notifications/[id] - Mark as read/dismissed/opened/clicked
 * DELETE /api/notifications/[id] - Dismiss notification
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { getOrCreateUserMetrics, trackEvent, EVENT_TYPES } from '@/lib/analytics-tracker';

export const PATCH = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop() || '';
    const body = await request.json();
    const { read, dismissed, opened, clicked } = body;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    if (notification.userId !== user.id) {
      return createErrorResponse('Unauthorized', 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        ...(read !== undefined && { read }),
        ...(dismissed !== undefined && { dismissed }),
        ...((opened || clicked) && { read: true }),
      },
    });

    if (opened || clicked) {
      const metrics = await getOrCreateUserMetrics(user.id, 'operator');
      await trackEvent({
        anonymousUserId: metrics.anonymousUserId,
        eventType: opened ? EVENT_TYPES.ENGAGEMENT.NOTIFICATION_OPENED : EVENT_TYPES.ENGAGEMENT.NOTIFICATION_CLICKED,
        eventCategory: 'engagement',
        objectType: 'Notification',
        objectId: id,
        metadata: {
          variantId: notification.variantId,
          notificationClass: notification.notificationClass,
          relatedPostId: notification.relatedPostId,
          returnLoop: true,
          privacySafe: true,
        },
      });

      if (clicked && notification.relatedPostId) {
        await trackEvent({
          anonymousUserId: metrics.anonymousUserId,
          eventType: 'return_loop_notification_clickthrough',
          eventCategory: 'engagement',
          objectType: 'Contribution',
          objectId: notification.relatedPostId,
          metadata: {
            notificationId: id,
            variantId: notification.variantId,
            returnLoop: true,
          },
        });
      }
    }

    return createApiResponse(updated);
  } catch (error) {
    console.error('Error updating notification:', error);
    return createErrorResponse('Failed to update notification', 500);
  }
}, { requireAuth: true });

export const DELETE = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop() || '';

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    if (notification.userId !== user.id) {
      return createErrorResponse('Unauthorized', 403);
    }

    await prisma.notification.update({
      where: { id },
      data: { dismissed: true },
    });

    return createApiResponse({ success: true });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return createErrorResponse('Failed to dismiss notification', 500);
  }
}, { requireAuth: true });
''')
