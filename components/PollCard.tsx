'use client';

import { useState } from 'react';

export type Poll = {
  id: string;
  question: string;
  options: string[];
  isDaily?: boolean;
  voted: boolean;
  myChoice: number | null;
  total: number | null;
  results: { label: string; count: number; percent: number }[] | null;
};

export function PollCard({ poll: initial, compact = false }: { poll: Poll; compact?: boolean }) {
  const [poll, setPoll] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function vote(option: number) {
    if (busy || poll.voted) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ option }),
      });
      const data = await res.json().catch(() => null);
      const payload = data?.data ?? data;
      if (res.ok && payload?.voted) {
        setPoll({ ...poll, voted: true, myChoice: payload.myChoice, total: payload.total, results: payload.results });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-lg border border-slate-700 bg-slate-800/50 ${compact ? 'p-4' : 'p-5'}`}>
      {poll.isDaily && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">Today&apos;s question</p>}
      <h3 className="font-medium text-white">{poll.question}</h3>
      <div className="mt-3 space-y-2">
        {poll.voted && !poll.results ? (
          <p className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300">
            Thanks. Results appear once at least 5 members have answered, so no one&apos;s choice can be identified.
          </p>
        ) : poll.voted && poll.results ? (
          <>
            {poll.results.map((r, i) => (
              <div key={r.label} className="relative overflow-hidden rounded-md border border-slate-700 px-3 py-2 text-sm">
                <div className={`absolute inset-y-0 left-0 ${i === poll.myChoice ? 'bg-cyan-800/50' : 'bg-slate-700/50'}`} style={{ width: `${r.percent}%` }} />
                <div className="relative flex justify-between gap-3 text-slate-200">
                  <span>{r.label}{i === poll.myChoice ? ' (you)' : ''}</span>
                  <span className="text-slate-400">{r.percent}%</span>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-500">{poll.total} {poll.total === 1 ? 'member has' : 'members have'} answered</p>
          </>
        ) : (
          poll.options.map((label, i) => (
            <button key={label} type="button" disabled={busy} onClick={() => void vote(i)}
              className="block w-full rounded-md border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:border-cyan-600 hover:bg-slate-800">
              {label}
            </button>
          ))
        )}
      </div>
      {!poll.voted && <p className="mt-2 text-xs text-slate-500">Vote to see how other members answered.</p>}
    </div>
  );
}

/** Loads the newest poll (today's question). Renders nothing for non-members or when no poll exists. */
export function DailyQuestion({ polls }: { polls: Poll[] | null }) {
  const daily = polls?.find((p) => p.isDaily);
  if (!daily) return null;
  return <PollCard poll={daily} compact />;
}
