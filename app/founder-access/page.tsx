'use client';

import { useState } from 'react';

export default function FounderAccessPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function claimAccess() {
    setBusy(true);
    setError('');
    const response = await fetch('/api/founder/claim', { method: 'POST' });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error || 'Could not activate founder access.');
      setBusy(false);
      return;
    }
    window.location.replace('/admin/analytics');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EFE6D8] px-5 text-[#3A1A1E]">
      <section className="w-full max-w-md rounded-[28px] border border-[#D8C7B8] bg-[#FFFDFC] p-8 shadow-[0_24px_70px_rgba(58,26,30,0.14)]">
        <p className="font-serif text-2xl italic text-[#9C7A3C]">Behind The Protocol</p>
        <h1 className="mt-5 text-3xl font-semibold">Activate founder access</h1>
        <p className="mt-3 text-sm leading-6 text-[#715E5B]">This securely connects your verified BTP identity to the founder controls.</p>
        {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        <button onClick={claimAccess} disabled={busy} className="mt-7 w-full rounded-xl bg-[#3A1A1E] px-4 py-4 font-bold text-white disabled:opacity-50">
          {busy ? 'Activating…' : 'Activate founder access'}
        </button>
      </section>
    </main>
  );
}
