'use client';

import { useState } from 'react';
import { STARTER_POLL, STARTER_QUESTIONS } from '@/lib/starter-questions';

type Status = 'idle' | 'posting' | 'posted' | 'held' | 'error';

export default function StarterQuestions() {
  const [status, setStatus] = useState<Status[]>(STARTER_QUESTIONS.map(() => 'idle'));
  const [pollMessage, setPollMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function post(i: number) {
    setStatus((s) => s.map((x, j) => (j === i ? 'posting' : x)));
    try {
      const res = await fetch('/api/situations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: STARTER_QUESTIONS[i], confirmedRedaction: true, postAsTeam: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'failed');
      const held = typeof body.pendingReview === 'boolean'
        ? body.pendingReview
        : typeof body.message === 'string' && /review/i.test(body.message);
      setStatus((s) => s.map((x, j) => (j === i ? (held ? 'held' : 'posted') : x)));
    } catch {
      setStatus((s) => s.map((x, j) => (j === i ? 'error' : x)));
    }
  }

  async function postAll() {
    setBusy(true);
    for (let i = 0; i < STARTER_QUESTIONS.length; i++) {
      if (status[i] === 'posted' || status[i] === 'held') continue;
      await post(i);
    }
    setBusy(false);
  }

  async function postPoll() {
    setPollMessage('Publishing…');
    const res = await fetch('/api/admin/polls', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(STARTER_POLL),
    });
    const body = await res.json().catch(() => ({}));
    setPollMessage(res.ok ? 'Poll published.' : body.error || 'Could not publish poll');
  }

  const label: Record<Status, string> = { idle: '', posting: 'Posting…', posted: 'Posted', held: 'Posted, held for review', error: 'Failed, try again' };

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl">Starter questions</h1>
      <p>Publishes each question under the <b>BTP_Team</b> profile, labeled as a starter question. Click once; already-posted questions are skipped while this page is open.</p>
      <button disabled={busy} onClick={postAll} className="rounded border p-2">{busy ? 'Publishing…' : 'Publish all questions'}</button>
      <ol className="list-decimal space-y-3 pl-6">
        {STARTER_QUESTIONS.map((q, i) => (
          <li key={q}>
            <span>{q.replace('Starter question from the BTP team: ', '')}</span>
            {status[i] !== 'idle' && <span role="status" className="ml-2 text-sm font-semibold">{label[status[i]]}</span>}
            {status[i] === 'error' && <button className="ml-2 underline" onClick={() => post(i)}>Retry</button>}
          </li>
        ))}
      </ol>
      <h2 className="text-xl">Starter poll</h2>
      <p>{STARTER_POLL.question} ({STARTER_POLL.options.join(' · ')})</p>
      <button onClick={postPoll} className="rounded border p-2">Publish poll</button>
      {pollMessage && <p role="status">{pollMessage}</p>}
    </main>
  );
}
