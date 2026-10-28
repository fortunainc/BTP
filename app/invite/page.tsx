'use client';

import { useEffect, useState } from 'react';

/** A verified member's personal invite link, plus how many people it has brought in. */
export default function InvitePage() {
  const [data, setData] = useState<{ link: string; requested: number; joined: number } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/user/referral').then(async (res) => {
      if (res.status === 401) { window.location.replace('/sign-in?redirect_url=/invite'); return; }
      const body = await res.json().catch(() => ({}));
      if (res.ok) setData(body); else setError(body.error || 'Your invite link could not be loaded.');
    }).catch(() => setError('Your invite link could not be loaded.'));
  }, []);

  async function copy() {
    if (!data) return;
    try { await navigator.clipboard.writeText(data.link); setCopied(true); } catch { setCopied(false); }
  }

  return (
    <main className="min-h-screen px-4 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#dcbc82]">Invite</p>
        <h1 className="text-4xl text-[#fff6ea]">Bring in someone <span className="text-[#e8cc94]">you trust.</span></h1>
        <p className="mt-3 text-slate-400">Share your personal link with clinical research colleagues. They get an invitation to create an account, and every new member is still verified privately by BTP.</p>
        {error && <div role="alert" className="mt-6 rounded-lg border border-[#c46b6b]/40 bg-[#c46b6b]/10 px-4 py-3 text-[#f1b7b7]">{error}</div>}
        {data && (
          <div className="mt-8 space-y-5 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-white/[0.012] p-6">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]">Your invite link</p>
              <div className="flex gap-2">
                <input readOnly value={data.link} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-lg border border-[rgba(232,204,148,0.25)] bg-black/40 p-3 font-mono text-sm text-white" />
                <button type="button" onClick={copy} className="btn-primary whitespace-nowrap rounded px-5 text-sm">{copied ? 'Copied' : 'Copy'}</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 p-4"><p className="font-serif text-3xl text-[#fff6ea]">{data.requested}</p><p className="text-sm text-slate-400">asked to join</p></div>
              <div className="rounded-xl border border-white/10 p-4"><p className="font-serif text-3xl text-[#fff6ea]">{data.joined}</p><p className="text-sm text-slate-400">created an account</p></div>
            </div>
            <p className="text-xs text-slate-500">Your colleagues know who sent the link. BTP never shows other members who invited whom.</p>
          </div>
        )}
      </div>
    </main>
  );
}
