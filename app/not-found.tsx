import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-slate-400">This page does not exist or is not part of the BTP beta.</p>
        <Link href="/" className="mt-6 inline-block underline">Return home</Link>
      </div>
    </main>
  );
}
