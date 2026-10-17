'use client';

import { useEffect, useState } from 'react';

type Metrics = {
  windowDays: number; questions: number; answeredPct: number; answeredWithin2hPct: number;
  medianMinutesToFirstAnswer: number | null; outcomeReportedPct: number; membersWhoAskAndAnswer: number;
  reactions: { helpful: number; sameHere: number; saved: number; worked: number }; pollVotes: number;
};

export default function AdminEngagement() {
  const [m, setM] = useState<Metrics | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/admin/engagement').then(async (r) => {
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || 'Unable to load');
      setM(body);
    }).catch((e) => setError(e instanceof Error ? e.message : 'Unable to load'));
  }, []);
  const rows: [string, string][] = m ? [
    ['Questions (last 30 days)', String(m.questions)],
    ['Answered', `${m.answeredPct}%`],
    ['Answered within 2 hours (target)', `${m.answeredWithin2hPct}%`],
    ['Median time to first answer', m.medianMinutesToFirstAnswer === null ? '—' : `${m.medianMinutesToFirstAnswer} min`],
    ['Outcome reported', `${m.outcomeReportedPct}%`],
    ['Members who both ask and answer', String(m.membersWhoAskAndAnswer)],
    ['"It worked" marks', String(m.reactions.worked)],
    ['Helpful / same here / saved', `${m.reactions.helpful} / ${m.reactions.sameHere} / ${m.reactions.saved}`],
    ['Poll votes', String(m.pollVotes)],
  ] : [];
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl">Engagement</h1>
      <p><a className="underline" href="/admin/polls">Publish a daily question</a> · <a className="underline" href="/admin/analytics">Founder analytics</a></p>
      {error && <p role="alert">{error}</p>}
      {!m && !error && <p role="status">Loading…</p>}
      {m && <table className="w-full text-left"><tbody>{rows.map(([k, v]) => <tr key={k} className="border-b"><td className="py-2">{k}</td><td className="py-2 font-semibold">{v}</td></tr>)}</tbody></table>}
    </main>
  );
}
