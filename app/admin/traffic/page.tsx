'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ANALYTICS_DASHBOARD } from '@/lib/acquisition';
import { useAuth } from '@/components/AuthContext';

type Day = { date: string; visits: number; uniqueVisitors: number; logins: number; failed: number; roomViews: number };
type Summary = { acquisition: {counts:Record<string,number>;channels:Record<string,number>}; days: number; totals: Omit<Day, 'date'>; daily: Day[]; topReferrers: Array<{ source: string; visits: number }> };

/** Website visits and investor room activity for the last 30 days. */
export default function TrafficPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) { router.push('/situations'); return; }
    fetch('/api/admin/traffic').then(async (r) => (r.ok ? setData(await r.json()) : setError('Traffic could not be loaded.'))).catch(() => setError('Traffic could not be loaded.'));
  }, [isAdmin, loading, router]);

  const tiles: Array<[string, keyof Summary['totals']]> = [['Website visits', 'visits'], ['Unique visitors (daily, summed)', 'uniqueVisitors'], ['Investor room sign-ins', 'logins'], ['Investor room views', 'roomViews'], ['Wrong investor passwords', 'failed']];

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#dcbc82]">Admin</p>
        <h1 className="text-4xl text-[#fff6ea]">Traffic history <span className="text-[#e8cc94]">· last 30 days</span></h1>
        <p className="mt-2 text-sm text-slate-400">Historical counters below include earlier internal and test visits and are not verified external traction. New public analytics exclude browsers marked internal by an admin visit. Other devices need their own admin visit. Visitor counts are estimates and may miss blocked tracking.</p>
        <div className="mt-5 flex gap-5 text-[#e8cc94]"><a href={ANALYTICS_DASHBOARD} target="_blank" rel="noopener noreferrer">Open public website analytics ↗</a><a href="/admin/requests">View signup details →</a></div><p className="mt-2 text-sm text-slate-400">This admin browser is excluded from new traffic. Signup records remain the source of truth for people and requests.</p>
        {error && <p className="mt-6 text-[#f1b7b7]">{error}</p>}
        {data && (
          <>
            <section className="mt-8 rounded-2xl border border-white/10 p-5"><h2 className="text-xl text-[#e8cc94]">New requests by audience</h2><p className="mt-1 text-sm text-slate-400">Since acquisition tracking launched. Repeat submissions and marked internal browsers are excluded. These are requests, not approved members or paying customers.</p><div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{[['Community signups','community_signup'],['Founder requests','founder_request'],['Investor requests','investor_request'],['Experience profiles completed','experience_completed']].map(([label,key])=><div key={key}><strong className="text-3xl">{data.acquisition.counts[key]||0}</strong><p className="text-sm">{label}</p></div>)}</div><p className="mt-5 text-sm text-slate-400">Request sources: {Object.entries(data.acquisition.channels).map(([source,count])=>`${source}: ${count}`).join(' · ')||'No new requests yet.'}</p></section>
            <h2 className="mt-8 text-xl">Historical traffic counters</h2><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              {tiles.map(([label, key]) => (
                <div key={key} className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-white/[0.012] p-4">
                  <p className="font-serif text-3xl text-[#fff6ea]">{data.totals[key]}</p><p className="mt-1 text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-white/[0.08]">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-[0.16em] text-[#e6c98f]">{['Date', 'Visits', 'Unique', 'Investor sign-ins', 'Room views', 'Wrong passwords'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
                <tbody>
                  {data.daily.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-slate-500">No visits recorded yet. Counting started with this release.</td></tr>}
                  {data.daily.map((d) => (
                    <tr key={d.date} className="border-t border-white/[0.06] text-[#efe3d2]"><td className="px-4 py-3">{d.date}</td><td className="px-4 py-3">{d.visits}</td><td className="px-4 py-3">{d.uniqueVisitors}</td><td className="px-4 py-3">{d.logins}</td><td className="px-4 py-3">{d.roomViews}</td><td className="px-4 py-3">{d.failed}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.topReferrers.length > 0 && (
              <div className="mt-8"><p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]">Where visitors came from</p>
                <ul className="space-y-1 text-sm text-[#efe3d2]">{data.topReferrers.map((r) => <li key={r.source}>{r.source} · {r.visits}</li>)}</ul></div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
