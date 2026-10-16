'use client';

import Link from 'next/link';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-slate-400">This page could not load. Try again, or return to the questions list.</p>
        <div className="mt-6 flex justify-center gap-4">
          <button type="button" onClick={reset} className="rounded-lg bg-slate-200 px-4 py-2 font-semibold text-slate-900">Try again</button>
          <Link href="/situations" className="rounded-lg border border-slate-600 px-4 py-2">Questions</Link>
        </div>
      </div>
    </main>
  );
}
