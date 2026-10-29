'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
type Entry = { id: string; name: string; email: string; company: string; website: string; product: string; goals: string; accessLabel: string; status: string; createdAt: string };
const STATUS: [string, string][] = [['new', 'New'], ['in_discussion', 'In discussion'], ['closed', 'Closed']];
export default function CompanyInquiriesAdmin() {
  const { isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Entry[] | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState('');
  const load = useCallback(async () => { try { const r = await fetch('/api/admin/company-inquiries'); if (!r.ok) throw new Error('Could not load company inquiries.'); setRows((await r.json()).entries); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load.'); } }, []);
  useEffect(() => { if (!loading && isAdmin) void load(); }, [loading, isAdmin, load]);
  async function setStatus(id: string, status: string) {
    setBusy(id); setError('');
    try { const r = await fetch('/api/admin/company-inquiries', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); const b = await r.json(); if (!r.ok) throw new Error(b.error); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save.'); } finally { setBusy(''); }
  }
  if (loading) return <main className="p-8">Loading…</main>;
  if (!isAdmin) return <main className="p-8">Founder access required. <Link href="/sign-in">Sign in</Link></main>;
  const all = rows || [];
  return <main className="min-h-screen bg-[#080706] px-5 py-10 text-[#eee6d9]"><div className="mx-auto max-w-5xl">
    <Link href="/admin/founder" className="text-[#e2c58e]">← Founder view</Link>
    <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[#d9bc83]">Company inquiry</p>
    <h1 className="mt-2 text-4xl">Product review inquiries.</h1>
    <p className="mt-3 text-slate-400">From the For companies page. Stored separately from the operator waitlist. Nothing here is sent to anyone automatically.</p>
    <div className="my-8 grid grid-cols-3 gap-4">{STATUS.map(([k, l]) => <div key={k} className="rounded-xl border border-[#5c4b32] p-5"><p className="text-3xl text-[#e2c58e]">{all.filter(r => r.status === k).length}</p><p>{l}</p></div>)}</div>
    <div className="mb-6"><a href="/api/admin/company-inquiries?format=csv" className="rounded border border-[#5c4b32] p-3 text-[#e2c58e]">Download all as CSV</a></div>
    {error && <p role="alert" className="my-4 text-red-300">{error}</p>}
    {!rows && !error && <p>Loading inquiries…</p>}
    {rows && all.length === 0 && <p className="text-slate-400">No company inquiries yet.</p>}
    <div className="space-y-5">{all.map(r => <article key={r.id} className="rounded-xl border border-[#3a3023] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl">{r.company}</h2><p className="text-sm text-slate-400">{r.name} · <a className="text-[#e2c58e]" href={`mailto:${r.email}`}>{r.email}</a> · <a className="text-[#e2c58e]" href={r.website} target="_blank" rel="noopener noreferrer">{r.website}</a> · {new Date(r.createdAt).toLocaleDateString()}</p></div>
        <label className="text-sm">Status <select aria-label={`Status for ${r.company}`} disabled={busy === r.id} value={r.status} onChange={e => void setStatus(r.id, e.target.value)} className="ml-2 rounded border border-[#5c4b32] bg-black p-2">{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label></div>
      <dl className="mt-4 grid gap-4 md:grid-cols-3"><div><dt className="text-xs uppercase tracking-widest text-[#d9bc83]">Product and users</dt><dd className="mt-1 whitespace-pre-wrap">{r.product}</dd></div><div><dt className="text-xs uppercase tracking-widest text-[#d9bc83]">Wants to learn</dt><dd className="mt-1 whitespace-pre-wrap">{r.goals}</dd></div><div><dt className="text-xs uppercase tracking-widest text-[#d9bc83]">Can share</dt><dd className="mt-1">{r.accessLabel}</dd></div></dl>
    </article>)}</div>
  </div></main>;
}
