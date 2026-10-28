'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

type Investor = { id: string; email: string; name: string | null; company: string | null; status: string; createdAt: string; lastSeenAt: string | null; visits: number; downloads: number };
type Doc = { id: string; title: string; category: string; fileName: string; size: number };
type Activity = { id: string; at: string; action: string; who: string; doc: string | null };
type Data = { investors: Investor[]; docs: Doc[]; activity: Activity[] };

const CATEGORIES = ['Company and legal', 'Financials', 'Product and technology', 'Traction', 'Market'];
const card = 'rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-white/[0.012] p-5';
const label = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]';
const input = 'rounded-lg border border-[rgba(232,204,148,0.25)] bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#c9a66b]';
const btn = 'rounded border border-[rgba(232,204,148,0.38)] px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-[#f2eadf] hover:bg-[#C9A66B]/10';
const when = (d: string | null) => (d ? new Date(d).toLocaleDateString() : 'Never');
const ACTIONS: Record<string, string> = { room: 'opened the investor room', data_room: 'opened the data room', download: 'opened' };

/** Approve investors, share their personal link, manage data room files and see who looked at what. */
export default function InvestorsAdmin() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [msg, setMsg] = useState('');
  const [links, setLinks] = useState<Record<string, string>>({});

  const load = useCallback(() => fetch('/api/admin/investors').then(async (r) => (r.ok ? setData(await r.json()) : setMsg('Could not load investors.'))), []);
  useEffect(() => { if (loading) return; if (!isAdmin) { router.push('/situations'); return; } void load(); }, [isAdmin, loading, router, load]);

  async function act(id: string, action: string, extra: Record<string, string> = {}) {
    setMsg('');
    const r = await fetch(`/api/admin/investors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(body.error || 'That did not work.'); return; }
    if (body.link) { setLinks((l) => ({ ...l, [id]: body.link })); await navigator.clipboard?.writeText(body.link).catch(() => {}); setMsg('Personal link copied. It works for 7 days.'); }
    void load();
  }
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg('');
    const f = new FormData(e.currentTarget); const form = e.currentTarget;
    const r = await fetch('/api/admin/investors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(f)) });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(body.error || 'Could not add.'); return; }
    form.reset(); setMsg('Approved. They can now enter their email on the investor page, or you can copy their link.'); void load();
  }
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg('Uploading…');
    const form = e.currentTarget;
    const r = await fetch('/api/admin/diligence', { method: 'POST', body: new FormData(form) });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(body.error || 'Upload failed.'); return; }
    form.reset(); setMsg('File added to the data room.'); void load();
  }
  async function remove(id: string) {
    if (!window.confirm('Remove this file from the data room?')) return;
    await fetch(`/api/admin/diligence/${id}`, { method: 'DELETE' }); void load();
  }

  const pending = data?.investors.filter((i) => i.status === 'pending') ?? [];
  const others = data?.investors.filter((i) => i.status !== 'pending') ?? [];

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#dcbc82]">Admin</p>
          <h1 className="text-4xl text-[#fff6ea]">Investors <span className="text-[#e8cc94]">and data room</span></h1>
          <p className="mt-2 text-sm text-slate-400">Investors request access with their email at /investors. Nothing is sent until you approve. Approved investors get a sign-in link when they enter their email, or you can copy their personal link and send it yourself.</p>
        </div>
        {msg && <p role="status" className="rounded-lg border border-[rgba(232,204,148,0.3)] bg-[#c9a66b]/10 px-4 py-3 text-sm text-[#f1e7da]">{msg}</p>}

        <section className={card}>
          <p className={`${label} mb-3`}>Waiting for approval ({pending.length})</p>
          {pending.length === 0 && <p className="text-sm text-slate-500">No requests right now.</p>}
          <div className="space-y-3">{pending.map((i) => (
            <form key={i.id} className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void act(i.id, 'approve', { name: String(f.get('name')), company: String(f.get('company')) }); }}>
              <span className="min-w-[200px] text-sm text-[#fff6ea]">{i.email}<small className="block text-xs text-slate-500">Requested {when(i.createdAt)}</small></span>
              <input name="name" defaultValue={i.name ?? ''} placeholder="Name" className={input} />
              <input name="company" defaultValue={i.company ?? ''} placeholder="Firm" className={input} />
              <button className="btn-primary rounded px-3 py-1.5 text-xs uppercase tracking-[0.12em]">Approve</button>
              <button type="button" className={btn} onClick={() => void act(i.id, 'revoke')}>Decline</button>
            </form>))}</div>
        </section>

        <section className={card}>
          <p className={`${label} mb-3`}>Add and approve an investor</p>
          <form onSubmit={add} className="flex flex-wrap gap-2">
            <input name="email" type="email" required placeholder="Email" className={input} />
            <input name="name" placeholder="Name" className={input} />
            <input name="company" placeholder="Firm" className={input} />
            <button className="btn-primary rounded px-3 py-1.5 text-xs uppercase tracking-[0.12em]">Add</button>
          </form>
        </section>

        <section className={card}>
          <p className={`${label} mb-3`}>Investors</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className={`text-left ${label}`}>{['Investor', 'Status', 'Visits', 'Files opened', 'Last seen', ''].map((h) => <th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
              <tbody>
                {others.length === 0 && <tr><td colSpan={6} className="px-2 py-4 text-slate-500">No approved investors yet.</td></tr>}
                {others.map((i) => (
                  <tr key={i.id} className="border-t border-white/[0.06] align-top text-[#efe3d2]">
                    <td className="px-2 py-3">{i.name || i.email}{i.company && <span className="text-slate-400"> · {i.company}</span>}<small className="block text-xs text-slate-500">{i.email}</small>{links[i.id] && <input readOnly value={links[i.id]} onFocus={(e) => e.currentTarget.select()} className={`${input} mt-2 w-full text-xs`} />}</td>
                    <td className="px-2 py-3 capitalize">{i.status}</td>
                    <td className="px-2 py-3">{i.visits}</td>
                    <td className="px-2 py-3">{i.downloads}</td>
                    <td className="px-2 py-3">{when(i.lastSeenAt)}</td>
                    <td className="space-x-2 whitespace-nowrap px-2 py-3 text-right">
                      {i.status === 'approved'
                        ? <><button className={btn} onClick={() => void act(i.id, 'link')}>Copy link</button><button className={btn} onClick={() => void act(i.id, 'revoke')}>Revoke</button></>
                        : <button className={btn} onClick={() => void act(i.id, 'approve')}>Approve</button>}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={card}>
          <p className={`${label} mb-3`}>Data room files</p>
          <form onSubmit={upload} className="mb-5 flex flex-wrap items-center gap-2">
            <input name="file" type="file" required accept=".pdf,.docx,.xlsx,.pptx,.csv,.png,.jpg,.jpeg" className="text-sm text-slate-300" />
            <input name="title" placeholder="Title (optional)" className={input} />
            <select name="category" required className={input} defaultValue="">{[<option key="" value="" disabled>Section</option>, ...CATEGORIES.map((c) => <option key={c}>{c}</option>)]}</select>
            <button className="btn-primary rounded px-3 py-1.5 text-xs uppercase tracking-[0.12em]">Upload</button>
          </form>
          {CATEGORIES.map((c) => {
            const files = data?.docs.filter((d) => d.category === c) ?? [];
            return <div key={c} className="border-t border-white/[0.06] py-3"><p className="text-sm text-[#fff6ea]">{c}</p>
              {files.length === 0 ? <p className="text-xs text-slate-500">Empty. Investors see &quot;Available on request.&quot;</p>
                : <ul className="mt-1 space-y-1">{files.map((d) => <li key={d.id} className="flex justify-between text-sm text-[#efe3d2]"><span>{d.title} <small className="text-slate-500">{d.fileName}</small></span><button className="text-xs text-slate-400 underline" onClick={() => void remove(d.id)}>Remove</button></li>)}</ul>}</div>;
          })}
          <p className="mt-2 text-xs text-slate-500">PDF, Word, Excel, PowerPoint, CSV or images, up to 4 MB each.</p>
        </section>

        <section className={card}>
          <p className={`${label} mb-3`}>Recent investor activity</p>
          {(data?.activity.length ?? 0) === 0 && <p className="text-sm text-slate-500">Nothing yet.</p>}
          <ul className="space-y-1 text-sm text-[#efe3d2]">{data?.activity.map((a) => <li key={a.id}><span className="text-slate-500">{new Date(a.at).toLocaleString()}</span> · {a.who} {ACTIONS[a.action] ?? a.action}{a.doc ? ` ${a.doc}` : ''}</li>)}</ul>
        </section>
      </div>
    </main>
  );
}
