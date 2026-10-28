'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import TrafficBeacon from '@/components/TrafficBeacon';

/** Landing page for a verified member's invite link. */
export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const res = await fetch('/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, email }) }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) setSent(true); else setError(data.error || 'Something went wrong. Please try again.');
    setBusy(false);
  }

  return (
    <main className="min-h-screen px-5 py-14 text-white sm:flex sm:items-center sm:justify-center">
      <TrafficBeacon path={`/join/${code}`} />
      <section className="mx-auto w-full max-w-md rounded-[22px] border border-[rgba(232,204,148,0.25)] bg-gradient-to-br from-white/[0.07] to-white/[0.015] p-8 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <span className="rounded-[9px] border border-[rgba(240,214,165,0.35)] bg-gradient-to-br from-white/10 to-white/[0.02] px-2.5 font-signet text-2xl leading-8 text-[#e8cc94]">BTP</span>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#dcbc82]">You&apos;re invited</p>
        <h1 className="mt-2 text-4xl text-[#fff6ea]">A colleague thinks you <span className="text-[#e8cc94]">belong here.</span></h1>
        <p className="mt-3 text-sm leading-6 text-[#d9ccbd]">BTP is a private, verified community where clinical research professionals ask what they can&apos;t ask at work and learn what actually worked. Members appear only by handle and verified role.</p>
        {sent ? (
          <div className="mt-6 rounded-xl border border-[rgba(232,204,148,0.3)] bg-[rgba(201,166,107,0.1)] p-4 text-sm text-[#f1e7da]">Check your inbox for your invitation to create an account. Every member is then verified privately before the community opens.</div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]">Your email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full rounded-lg border border-[rgba(232,204,148,0.25)] bg-black/40 px-4 py-3.5 text-white placeholder:text-[#9c8a78] focus:border-[#c9a66b] focus:outline-none" />
            {error && <p role="alert" className="text-sm text-[#f1b7b7]">{error}</p>}
            <button type="submit" disabled={busy || !email.trim()} className="btn-primary w-full rounded py-3.5 text-sm uppercase tracking-[0.16em] disabled:opacity-50">{busy ? 'Sending…' : 'Send my invitation →'}</button>
            <p className="text-xs text-slate-500">We use this email only to send your invitation and sign you in. It is never shown to members.</p>
          </form>
        )}
      </section>
    </main>
  );
}
