'use client';

import { useState } from 'react';

export default function AdminPolls() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage('');
    try {
      const res = await fetch('/api/admin/polls', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options: options.filter((o) => o.trim()) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not create poll');
      setMessage('Published. It is now today’s question for members.');
      setQuestion(''); setOptions(['', '', '']);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create poll');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl">Daily question / poll</h1>
      <p>The newest poll appears as today&apos;s question at the top of Questions. Members see results only after voting, as percentages; voters are never shown. Avoid anything that could identify a site, sponsor or study.</p>
      <p><a className="underline" href="/admin/engagement">Engagement metrics</a></p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">Question
          <input className="mt-1 block w-full border p-2 text-black" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={200} required
            placeholder="How long does budget sign-off usually take at your site?" />
        </label>
        {options.map((o, i) => (
          <label key={i} className="block">Option {i + 1}
            <input className="mt-1 block w-full border p-2 text-black" value={o} maxLength={80}
              onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} />
          </label>
        ))}
        {options.length < 6 && <button type="button" className="underline" onClick={() => setOptions([...options, ''])}>Add option</button>}
        <div><button disabled={busy} className="rounded border p-2">{busy ? 'Publishing…' : 'Publish poll'}</button></div>
        {message && <p role="status">{message}</p>}
      </form>
    </main>
  );
}
