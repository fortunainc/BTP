'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { PollCard, type Poll } from '@/components/PollCard';
import { MembershipPending } from '@/components/MemberNav';

export default function PollsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [error, setError] = useState('');
  const [polls, setPolls] = useState<Poll[] | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { window.location.replace('/sign-in?redirect_url=/polls'); return; }
    (async () => {
      const res = await fetch('/api/polls');
      if (res.status === 403) { setPending(true); return; }
      if (!res.ok) throw new Error('Polls could not be loaded. Please refresh and try again.');
      const data = await res.json().catch(() => null);
      setPolls((data?.data ?? data)?.polls ?? []);
    })().catch(error => setError(error.message));
  }, [isLoaded, isSignedIn]);

  return (
    <main className="min-h-screen px-4 py-10 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-white">Polls</h1>
        <p className="mt-2 text-slate-400">One tap, then see how other members answered. Results show percentages only, never who voted.</p>
        <div className="mt-8 space-y-4">
          {error ? <p role="alert" className="text-[#f1b7b7]">{error}</p> : pending ? <MembershipPending /> : polls === null ? (
            <p className="text-slate-500">Loading…</p>
          ) : polls.length === 0 ? (
            <p className="text-slate-500">No polls yet.</p>
          ) : polls.map((p) => <PollCard key={p.id} poll={p} />)}
        </div>
      </div>
    </main>
  );
}
