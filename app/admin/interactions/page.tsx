'use client';

/**
 * Founder Interaction Controls
 *
 * Admin-only operational surface for the structured operator return loop.
 * This page intentionally avoids public-discussion mechanics: no profiles, usernames,
 * open responses, public reactions, ranking, or popularity sorting.
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DISPLAY_STATUSES = ['PENDING_REVIEW', 'VISIBLE', 'SUPPRESSED', 'BLOCKED', 'ALL'];
const MODERATABLE_STATUSES = ['PENDING_REVIEW', 'VISIBLE', 'SUPPRESSED', 'BLOCKED'];
const INTERACTION_TYPES = [
  'SEEN_THIS',
  'TRIED_SIMILAR',
  'WORKED_FOR_US',
  'DIDNT_HOLD_UP',
  'CAUSED_OTHER_ISSUES',
  'GOT_WORSE_LATER',
  'STAYED_MANAGEABLE',
];

const NOTIFICATION_TRIGGERS = [
  { value: '', label: 'No manual notification' },
  { value: 'VALIDATION', label: 'Validation' },
  { value: 'EXPANSION', label: 'Expansion' },
  { value: 'MOMENTUM', label: 'Momentum' },
  { value: 'PRESSURE', label: 'Pressure' },
  { value: 'OPPORTUNITY', label: 'Opportunity' },
];

type InteractionItem = {
  id: string;
  contributionId: string;
  interactionType: string;
  context: string | null;
  originalContext?: string | null;
  correlationRisk: number;
  displayStatus: string;
  isSeeded: boolean;
  founderNote: string | null;
  isHighValue: boolean;
  escalatedToSafety: boolean;
  createdAt: string;
  contribution?: {
    title: string;
    issueCategory: string;
    therapeuticArea: string;
    trialPhase: string;
  };
};

type DraftState = {
  displayStatus: string;
  context: string;
  founderNote: string;
  isHighValue: boolean;
  escalatedToSafety: boolean;
  manualNotificationTrigger: string;
};

export default function FounderInteractionControlsPage() {
  if (!hasClerkKeys) {
    return <ClerkFallback />;
  }

  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [seedForm, setSeedForm] = useState({
    contributionId: '',
    interactionType: 'SEEN_THIS',
    context: '',
    founderNote: '',
    displayStatus: 'VISIBLE',
    isHighValue: false,
    triggerNotification: true,
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/admin/interactions');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const role = user.publicMetadata?.role as string;
      setIsAdmin(role === 'admin' || role === 'founder');
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (isSignedIn && isAdmin) {
      fetchInteractions();
    }
  }, [isSignedIn, isAdmin, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: interactions.length,
      highRisk: interactions.filter(item => item.correlationRisk >= 0.7).length,
      highValue: interactions.filter(item => item.isHighValue).length,
      escalated: interactions.filter(item => item.escalatedToSafety).length,
      seeded: interactions.filter(item => item.isSeeded).length,
    };
  }, [interactions]);

  const fetchInteractions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/interactions?status=${statusFilter}&limit=100`);
      if (response.status === 403) {
        setError('Access denied. Founder/admin privileges required.');
        setIsAdmin(false);
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch interaction controls.');
      }

      const result = await response.json();
      const items = result.interactions || [];
      setInteractions(items);

      const nextDrafts: Record<string, DraftState> = {};
      for (const item of items) {
        nextDrafts[item.id] = {
          displayStatus: item.displayStatus,
          context: item.context || '',
          founderNote: item.founderNote || '',
          isHighValue: Boolean(item.isHighValue),
          escalatedToSafety: Boolean(item.escalatedToSafety),
          manualNotificationTrigger: '',
        };
      }
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load interaction controls.');
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (id: string, patch: Partial<DraftState>) => {
    setDrafts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      },
    }));
  };

  const saveInteraction = async (item: InteractionItem) => {
    const draft = drafts[item.id];
    if (!draft) return;

    setSavingId(item.id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/interactions/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayStatus: draft.displayStatus,
          context: draft.context,
          founderNote: draft.founderNote,
          isHighValue: draft.isHighValue,
          escalatedToSafety: draft.escalatedToSafety,
          manualNotificationTrigger: draft.manualNotificationTrigger || undefined,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Failed to update interaction.');
      }

      setMessage('Interaction controls updated.');
      await fetchInteractions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update interaction.');
    } finally {
      setSavingId(null);
    }
  };

  const seedInteraction = async () => {
    setSavingId('seed');
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributionId: seedForm.contributionId.trim(),
          interactionType: seedForm.interactionType,
          context: seedForm.context.trim() || undefined,
          founderNote: seedForm.founderNote.trim() || undefined,
          displayStatus: seedForm.displayStatus,
          isHighValue: seedForm.isHighValue,
          triggerNotification: seedForm.triggerNotification,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Failed to seed interaction.');
      }

      setSeedForm({
        contributionId: '',
        interactionType: 'SEEN_THIS',
        context: '',
        founderNote: '',
        displayStatus: 'VISIBLE',
        isHighValue: false,
        triggerNotification: true,
      });
      setMessage('Founder-seeded interaction created.');
      await fetchInteractions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed interaction.');
    } finally {
      setSavingId(null);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading founder controls...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-lg shadow p-8 max-w-md">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Founder or admin privileges are required for interaction controls.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-indigo-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Founder Interaction Controls</h1>
              <p className="text-sm text-gray-500 mt-1">
                Review, seed, suppress, and trigger structured return-loop context without creating a discussion surface.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/analytics" className="px-4 py-2 rounded-md bg-white border text-gray-700 hover:bg-gray-50">
                Analytics
              </Link>
              <Link href="/admin/trust-safety" className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">
                Trust & Safety
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Privacy guardrail:</strong> This admin surface is for aggregate return-loop control only. It does not display
            usernames, profiles, open-response chains, public reactions, popularity ranking, or public timestamps. Raw pre-redaction context is retained for audit but not displayed here.
          </p>
        </section>

        {(message || error) && (
          <section className={`rounded-lg p-4 border ${error ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
            {error || message}
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <MetricCard label="Loaded Items" value={summary.total} />
          <MetricCard label="High Risk" value={summary.highRisk} />
          <MetricCard label="High Value" value={summary.highValue} />
          <MetricCard label="Escalated" value={summary.escalated} />
          <MetricCard label="Seeded" value={summary.seeded} />
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Review Queue</h2>
              <p className="text-sm text-gray-500">Filter by moderation state and apply founder controls.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {DISPLAY_STATUSES.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusFilter === status ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
              <button onClick={fetchInteractions} className="px-3 py-1 rounded-full text-sm font-medium bg-white border text-gray-600 hover:bg-gray-50">
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading interactions...</div>
          ) : interactions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No interaction items match this filter.</div>
          ) : (
            <div className="space-y-4">
              {interactions.map(item => (
                <InteractionControlCard
                  key={item.id}
                  item={item}
                  draft={drafts[item.id]}
                  saving={savingId === item.id}
                  onDraftChange={patch => updateDraft(item.id, patch)}
                  onSave={() => saveInteraction(item)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900">Seed Private-Alpha Interaction</h2>
          <p className="text-sm text-gray-500 mt-1">
            Use seeding sparingly to show first-time operators that structured context exists. Seeded data remains labeled operationally.
          </p>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Situation / Contribution ID">
              <input
                value={seedForm.contributionId}
                onChange={event => setSeedForm(prev => ({ ...prev, contributionId: event.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="cuid..."
              />
            </Field>
            <Field label="Interaction Type">
              <select
                value={seedForm.interactionType}
                onChange={event => setSeedForm(prev => ({ ...prev, interactionType: event.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {INTERACTION_TYPES.map(type => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </Field>
            <Field label="Safe Context (optional, 200 characters max)">
              <textarea
                value={seedForm.context}
                maxLength={200}
                onChange={event => setSeedForm(prev => ({ ...prev, context: event.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
                placeholder="Generalized, non-identifying context..."
              />
              <p className="mt-1 text-xs text-gray-400">{seedForm.context.length}/200</p>
            </Field>
            <Field label="Founder Note (internal)">
              <textarea
                value={seedForm.founderNote}
                maxLength={500}
                onChange={event => setSeedForm(prev => ({ ...prev, founderNote: event.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
                placeholder="Internal rationale..."
              />
            </Field>
            <Field label="Initial Display Status">
              <select
                value={seedForm.displayStatus}
                onChange={event => setSeedForm(prev => ({ ...prev, displayStatus: event.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {MODERATABLE_STATUSES.map(status => (
                  <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </Field>
            <div className="flex flex-col gap-3 justify-end">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={seedForm.isHighValue}
                  onChange={event => setSeedForm(prev => ({ ...prev, isHighValue: event.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600"
                />
                Mark high-value
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={seedForm.triggerNotification}
                  onChange={event => setSeedForm(prev => ({ ...prev, triggerNotification: event.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600"
                />
                Trigger privacy-safe return notification
              </label>
            </div>
          </div>

          <button
            onClick={seedInteraction}
            disabled={savingId === 'seed' || !seedForm.contributionId.trim()}
            className="mt-5 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingId === 'seed' ? 'Seeding...' : 'Seed Interaction'}
          </button>
        </section>
      </main>
    </div>
  );
}

function InteractionControlCard({
  item,
  draft,
  saving,
  onDraftChange,
  onSave,
}: {
  item: InteractionItem;
  draft?: DraftState;
  saving: boolean;
  onDraftChange: (patch: Partial<DraftState>) => void;
  onSave: () => void;
}) {
  if (!draft) return null;

  const riskClass = item.correlationRisk >= 0.7
    ? 'bg-red-100 text-red-800'
    : item.correlationRisk >= 0.4
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-green-100 text-green-800';

  return (
    <article className="border rounded-lg p-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900">{item.interactionType.replace(/_/g, ' ')}</span>
            <span className={`px-2 py-1 rounded text-xs ${riskClass}`}>Risk {item.correlationRisk.toFixed(2)}</span>
            {item.isSeeded && <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">Seeded</span>}
            {item.isHighValue && <span className="px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-800">High value</span>}
            {item.escalatedToSafety && <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Safety escalated</span>}
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{item.contribution?.title || 'Untitled situation'}</h3>
          <p className="mt-1 text-xs text-gray-500">
            {item.contribution?.issueCategory || 'Unknown issue'} · {item.contribution?.therapeuticArea || 'Unknown area'} · {item.contribution?.trialPhase || 'Unknown phase'}
          </p>
          <p className="mt-1 text-xs text-gray-400 font-mono">Situation ID: {item.contributionId}</p>
        </div>

        <div className="flex gap-2">
          <select
            value={draft.displayStatus}
            onChange={event => onDraftChange({ displayStatus: event.target.value })}
            className="rounded-md border-gray-300 text-sm"
          >
            {MODERATABLE_STATUSES.map(status => (
              <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field label="Display Context">
          <textarea
            value={draft.context}
            maxLength={200}
            onChange={event => onDraftChange({ context: event.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={3}
            placeholder="No display context approved."
          />
          <p className="mt-1 text-xs text-gray-400">{draft.context.length}/200 · Only generalized context should become visible.</p>
        </Field>

        <Field label="Founder Note">
          <textarea
            value={draft.founderNote}
            maxLength={500}
            onChange={event => onDraftChange({ founderNote: event.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={3}
            placeholder="Internal moderation note..."
          />
        </Field>

        <div className="space-y-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={draft.isHighValue}
              onChange={event => onDraftChange({ isHighValue: event.target.checked })}
              className="rounded border-gray-300 text-indigo-600"
            />
            Mark as high-value signal
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={draft.escalatedToSafety}
              onChange={event => onDraftChange({ escalatedToSafety: event.target.checked })}
              className="rounded border-gray-300 text-red-600"
            />
            Escalate to safety review
          </label>
        </div>

        <Field label="Manual Notification Trigger">
          <select
            value={draft.manualNotificationTrigger}
            onChange={event => onDraftChange({ manualNotificationTrigger: event.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {NOTIFICATION_TRIGGERS.map(trigger => (
              <option key={trigger.value} value={trigger.value}>{trigger.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">Notifications use privacy-safe copy and randomized/batched timing.</p>
        </Field>
      </div>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}