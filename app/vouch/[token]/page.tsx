'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Request = { role: string | null; years: number | null; note: string | null };

/** A verified member confirms they have worked with an applicant who has no work email. */
export default function VouchPage() {
  const { token } = useParams<{ token: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [error, setError] = useState('');
  const [attested, setAttested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/vouch/${encodeURIComponent(token)}`).then(async (res) => {
      if (res.status === 401) { window.location.replace(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`); return; }
      const data = await res.json().catch(() => ({}));
      if (res.ok) setRequest(data); else setError(data.error || 'This vouch link could not be opened.');
    }).catch(() => setError('This vouch link could not be opened.'));
  }, [token]);

  async function vouch() {
    setBusy(true); setError('');
    const res = await fetch(`/api/vouch/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attested }) }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) setDone(true); else setError(data.error || 'The vouch could not be saved. Please try again.');
    setBusy(false);
  }

  return (
    <main className="min-h-screen px-4 py-14 text-white">
      <div className="mx-auto max-w-xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#dcbc82]">Vouch for a colleague</p>
        <h1 className="mb-6 text-4xl text-[#fff6ea]">Can you vouch for <span className="text-[#e8cc94]">this person?</span></h1>
        {error && <div role="alert" className="mb-6 rounded-lg border border-[#c46b6b]/40 bg-[#c46b6b]/10 px-4 py-3 text-[#f1b7b7]">{error}</div>}
        {done ? (
          <div className="rounded-2xl border border-[rgba(232,204,148,0.3)] bg-gradient-to-br from-[rgba(201,166,107,0.1)] to-white/[0.02] p-6">
            <h2 className="mb-2 text-2xl text-[#fff6ea]">Thank you.</h2>
            <p className="text-slate-300">Your vouch is recorded. A person at BTP still reviews every application. Their note is deleted once they are approved.</p>
          </div>
        ) : request ? (
          <div className="space-y-5 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-white/[0.012] p-6">
            <p className="text-slate-300">Someone applying to BTP says they have worked with you. BTP never shows their name. Vouch only if you recognize them from their note.</p>
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]">Role</dt><dd className="mt-1 text-[#fff6ea]">{request.role || 'Not given'}</dd></div>
              <div><dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]">Experience</dt><dd className="mt-1 text-[#fff6ea]">{request.years == null ? 'Not given' : `${request.years} years`}</dd></div>
            </dl>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]">Their note to you</p>
              <p className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/30 p-4 text-[#f1e7da]">{request.note}</p>
            </div>
            <label className="flex items-start gap-3 text-sm text-[#f1e7da]">
              <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-1 h-4 w-4 accent-[#c9a66b]" />
              I have worked with this person and can confirm their role and experience as described.
            </label>
            <button type="button" onClick={vouch} disabled={!attested || busy} className="btn-primary w-full rounded py-3 text-sm uppercase tracking-[0.16em] disabled:opacity-40">{busy ? 'Saving…' : 'Vouch for them'}</button>
            <p className="text-xs text-slate-500">Don&apos;t recognize them? Close this page. Nothing is recorded.</p>
          </div>
        ) : !error ? <p className="text-slate-400">Loading…</p> : null}
      </div>
    </main>
  );
}
