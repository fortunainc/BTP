'use client';

import { useState } from 'react';

type ReactionType = 'HELPFUL' | 'SAME_HERE' | 'SAVED' | 'WORKED';
type Counts = Record<ReactionType, number>;

const LABELS: Record<ReactionType, string> = {
  HELPFUL: 'Helpful',
  SAME_HERE: 'Same here',
  SAVED: 'Save',
  WORKED: 'It worked',
};

export function AnswerReactions({ answerId, initialCounts, initialMine, isOwnAnswer, viewerIsAsker }: {
  answerId: string;
  initialCounts?: Counts;
  initialMine?: ReactionType[];
  isOwnAnswer: boolean;
  viewerIsAsker: boolean;
}) {
  const [counts, setCounts] = useState<Counts>(initialCounts ?? { HELPFUL: 0, SAME_HERE: 0, SAVED: 0, WORKED: 0 });
  const [mine, setMine] = useState<ReactionType[]>(initialMine ?? []);
  const [busy, setBusy] = useState(false);

  const types: ReactionType[] = viewerIsAsker ? ['WORKED', 'HELPFUL', 'SAME_HERE', 'SAVED'] : ['HELPFUL', 'SAME_HERE', 'SAVED'];

  async function toggle(type: ReactionType) {
    if (busy || isOwnAnswer) return;
    setBusy(true);
    const active = mine.includes(type);
    try {
      const res = await fetch(`/api/answers/${answerId}/reactions${active ? `?type=${type}` : ''}`, {
        method: active ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: active ? undefined : JSON.stringify({ type }),
      });
      const data = await res.json().catch(() => null);
      const payload = data?.data ?? data;
      if (res.ok && payload?.counts) {
        setCounts(payload.counts);
        setMine(payload.mine ?? []);
      }
    } finally {
      setBusy(false);
    }
  }

  const workedCount = counts.WORKED;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {workedCount > 0 && (
        <span className="rounded-full bg-emerald-900/40 px-2.5 py-1 text-xs font-medium text-emerald-300">Worked for the asker</span>
      )}
      {isOwnAnswer ? (
        <span className="text-xs text-slate-500">
          {counts.HELPFUL} helpful · {counts.SAME_HERE} same here · {counts.SAVED} saved
        </span>
      ) : (
        types.map((type) => {
          const active = mine.includes(type);
          const count = type === 'WORKED' ? null : counts[type];
          return (
            <button key={type} type="button" disabled={busy} onClick={() => void toggle(type)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${active
                ? (type === 'WORKED' ? 'border-emerald-500 bg-emerald-900/40 text-emerald-200' : 'border-cyan-500 bg-cyan-900/30 text-cyan-200')
                : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
              {LABELS[type]}{count ? ` · ${count}` : ''}
            </button>
          );
        })
      )}
    </div>
  );
}
