'use client';

import { useState } from 'react';
import { MembershipPending } from '@/components/MemberNav';

const HELP_TYPES = [
  ['CONSULTATION', 'Expert consultation'],
  ['INTERVIEW_PREP', 'Interview preparation'],
  ['WRITTEN_REVIEW', 'Written resolution review'],
  ['DOCUMENT_REVIEW', 'Document or workflow review'],
  ['PROJECT_HELP', 'Defined project help'],
] as const;

export default function PrivateHelpPage() {
  const [helpType, setHelpType] = useState<string>('CONSULTATION');
  const [details, setDetails] = useState('');
  const [timing, setTiming] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'pending' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !details.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/help-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpType, details, timing }),
      });
      if (res.status === 401) { window.location.assign('/sign-in'); return; }
      if (res.status === 403) { setStatus('pending'); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || 'Request not submitted. Please retry.');
      setStatus('sent');
      setDetails('');
      setTiming('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Request not submitted. Please retry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#dcbc82]">Private help</p>
        <h1 className="text-4xl text-[#fff6ea]">Private help from <span className="text-[#e8cc94]">a verified expert.</span></h1>
        <p className="mt-3 text-slate-400">
          Need more than a public answer? Tell BTP what you&apos;re working through. We match you, privately, with a verified
          professional who has handled it before: an expert consultation, interview preparation, or a review of a workflow.
          Any introduction needs consent from both sides, and scope, timing and any cost are agreed with you before anything starts.
        </p>

        {status === 'pending' ? (
          <div className="mt-8"><MembershipPending /></div>
        ) : status === 'sent' ? (
          <div className="mt-8 rounded-lg border border-emerald-700 bg-emerald-900/20 p-6">
            <h2 className="text-lg font-semibold text-white">Request received</h2>
            <p className="mt-2 text-slate-300">BTP will review it privately and follow up. Submitting a request does not guarantee a match or a particular response time.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Type of help</span>
              <select value={helpType} onChange={e => setHelpType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3">
                {HELP_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">What do you need help with?</span>
              <textarea value={details} onChange={e => setDetails(e.target.value)} maxLength={2000} rows={7} required
                placeholder="Describe the situation and what a useful outcome would look like."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3" />
              <span className="mt-1 block text-xs text-slate-500">Do not include patient information, employer, site, sponsor or study names, confidential documents, or other identifying details.</span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Timing (optional)</span>
              <input value={timing} onChange={e => setTiming(e.target.value)} maxLength={100} placeholder="e.g. interview next week"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3" />
            </label>
            {status === 'error' && <p className="text-red-400">{message}</p>}
            <button type="submit" disabled={busy || !details.trim()}
              className="rounded-lg bg-slate-200 px-5 py-3 font-semibold text-slate-900 disabled:opacity-50">
              {busy ? 'Submitting…' : 'Request private help'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
