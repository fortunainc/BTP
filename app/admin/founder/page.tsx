'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

type Metrics = {
  generatedAt: string;
  members: { total: number; verified: number; pendingVerification: number; new7: number; new30: number };
  community: { questions: number; questions7: number; answers: number; answers7: number; worked: number; helpful: number; answersPerQuestion: number };
  help: { open: number; total: number };
  growth: { joinRequests: number; joinedViaReferral: number };
  investors: { approved: number; pending: number; active7: number };
  traffic: { visits: number; uniqueVisitors: number; logins: number; roomViews: number };
  weeks: Array<{ week: string; members: number; questions: number; answers: number }>;
};

const card = 'rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-white/[0.012] p-4';
const label = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]';

function Tile({ value, name, note, href }: { value: number | string; name: string; note?: string; href?: string }) {
  const body = <><p className="font-serif text-3xl text-[#fff6ea]">{value}</p><p className="mt-1 text-xs text-slate-300">{name}</p>{note && <p className="mt-1 text-[11px] text-slate-500">{note}</p>}</>;
  return href ? <Link href={href} className={`${card} block transition hover:border-[rgba(232,204,148,0.4)]`}>{body}</Link> : <div className={card}>{body}</div>;
}

/** The founder's one-screen view of BTP. */
export default function FounderPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const [m, setM] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) { router.push('/situations'); return; }
    fetch('/api/admin/founder').then(async (r) => (r.ok ? setM(await r.json()) : setError('Metrics could not be loaded.'))).catch(() => setError('Metrics could not be loaded.'));
  }, [isAdmin, loading, router]);

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#dcbc82]">Founder view</p>
        <h1 className="text-4xl text-[#fff6ea]">How BTP is <span className="text-[#e8cc94]">doing.</span></h1>
        {m && <p className="mt-2 text-sm text-slate-400">Live from the database · {new Date(m.generatedAt).toLocaleString()}</p>}
        {error && <p className="mt-6 text-[#f1b7b7]">{error}</p>}
        {!m && !error && <p className="mt-6 text-slate-400">Loading…</p>}
        {m && (
          <div className="mt-8 space-y-8">
            <section><p className={`${label} mb-3`}>Members</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Tile value={m.members.verified} name="Verified members" note={`${m.members.total} accounts in total`} />
                <Tile value={m.members.pendingVerification} name="Waiting for your review" href="/admin/verifications" />
                <Tile value={m.members.new7} name="New this week" note={`${m.members.new30} in 30 days`} />
                <Tile value={m.growth.joinedViaReferral} name="Joined through a member invite" note={`${m.growth.joinRequests} invite requests`} />
              </div></section>
            <section><p className={`${label} mb-3`}>Community</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Tile value={m.community.questions} name="Questions" note={`${m.community.questions7} this week`} />
                <Tile value={m.community.answers} name="Answers" note={`${m.community.answers7} this week · ${m.community.answersPerQuestion} per question`} />
                <Tile value={m.community.worked} name={'"It worked" marks'} note={`${m.community.helpful} marked helpful`} />
                <Tile value={m.help.open} name="Open private help requests" note={`${m.help.total} in total`} href="/admin/help-requests" />
              </div></section>
            <section><p className={`${label} mb-3`}>Website and investors · last 30 days</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Tile value={m.traffic.visits} name="Website visits" note={`${m.traffic.uniqueVisitors} unique (daily)`} href="/admin/traffic" />
                <Tile value={m.investors.pending} name="Investors waiting for approval" href="/admin/investors" />
                <Tile value={m.investors.approved} name="Approved investors" note={`${m.investors.active7} active this week`} href="/admin/investors" />
                <Tile value={m.traffic.roomViews} name="Investor room views" note={`${m.traffic.logins} sign-ins`} href="/admin/investors" />
              </div></section>
            <section><p className={`${label} mb-3`}>Last 8 weeks</p>
              <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
                <table className="w-full text-sm">
                  <thead><tr className={`text-left ${label}`}>{['Week of', 'New members', 'Questions', 'Answers'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
                  <tbody>{m.weeks.map((w) => <tr key={w.week} className="border-t border-white/[0.06] text-[#efe3d2]"><td className="px-4 py-3">{w.week}</td><td className="px-4 py-3">{w.members}</td><td className="px-4 py-3">{w.questions}</td><td className="px-4 py-3">{w.answers}</td></tr>)}</tbody>
                </table>
              </div></section>
          </div>
        )}
      </div>
    </main>
  );
}
