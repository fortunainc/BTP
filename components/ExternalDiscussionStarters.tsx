'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DISCUSSION_STARTERS } from '@/lib/curated-discussion-starters';

/** External inspiration only. Never represented as member reports or BTP evidence. */
export function ExternalDiscussionStarters() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? DISCUSSION_STARTERS : DISCUSSION_STARTERS.slice(0, 3);

  return (
    <section aria-labelledby="external-prompts-title" className="mb-8 rounded-xl border border-slate-700 bg-slate-800/30 p-5 sm:p-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-300">
        Curated from public conversations
      </p>
      <h2 id="external-prompts-title" className="text-xl font-semibold text-white">
        Looking for a place to start?
      </h2>
      <p className="mt-2 mb-5 max-w-3xl text-sm text-slate-300">
        These prompts are paraphrased from linked public Reddit and LinkedIn discussions. They are not
        BTP member questions, verified operator experiences, proven patterns, or clinical guidance.
        Share your own firsthand observation instead of copying someone else's account.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {visible.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded bg-slate-700 px-2 py-1 text-slate-200">{item.theme}</span>
              <span>{item.platform} · External discussion</span>
            </div>
            <h3 className="font-medium text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{item.question}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">
                View original discussion ↗
              </a>
              <Link href="/situations/new" className="text-white hover:underline">
                Share your own experience →
              </Link>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs text-slate-400">
          Please omit patient, site, sponsor, vendor and identifiable study details.
        </p>
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}
          className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:border-cyan-600 hover:text-white">
          {expanded ? 'Show fewer prompts' : 'See all 10 prompts'}
        </button>
      </div>
    </section>
  );
}
