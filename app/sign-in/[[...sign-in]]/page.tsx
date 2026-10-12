'use client';

import { useSignIn } from '@clerk/nextjs';
import Image from 'next/image';
import { FormEvent, useState } from 'react';
import appIcon from '../../../mobile/assets/brand/app-icon.png';

const SUPPORT_EMAIL = 'fortunaindustriesinc@gmail.com';

function clerkMessage(error: unknown): string {
  const candidate = error as { errors?: Array<{ longMessage?: string; message?: string }> };
  return candidate.errors?.[0]?.longMessage || candidate.errors?.[0]?.message || 'Check your email and password and try again.';
}

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fetchStatus === 'fetching' || busy) return;

    setBusy(true);
    setError('');
    try {
      const { error: signInError } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.longMessage || signInError.message || 'Check your email and password and try again.');
        return;
      }

      if (signIn.status !== 'complete') {
        setError('This account requires an additional verification step. Contact BTP support so we can complete your access.');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const destination = params.get('redirect_url');
      const redirectTo = destination?.startsWith('/') ? destination : '/admin/analytics';
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            setError('Your account requires one additional security step. Contact BTP support to complete access.');
            return;
          }
          window.location.replace(decorateUrl(redirectTo));
        },
      });
    } catch (cause) {
      setError(clerkMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const loading = fetchStatus === 'fetching';
  const disabled = loading || busy || !email.trim() || !password;

  return (
    <main className="min-h-screen bg-[#EFE6D8] px-5 py-10 text-[#3A1A1E] sm:flex sm:items-center sm:justify-center">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[28px] border border-[#D8C7B8] bg-[#FFFDFC] shadow-[0_24px_70px_rgba(58,26,30,0.14)]">
        <div className="bg-[#3A1A1E] px-8 py-8 text-center">
          <Image src={appIcon} alt="Behind The Protocol" className="mx-auto h-20 w-20 rounded-[20px]" priority />
          <p className="mt-5 font-serif text-2xl italic tracking-wide text-[#C9A66B]">Behind The Protocol</p>
          <p className="mt-2 text-sm text-[#EFE6D8]/75">Founder and member access</p>
        </div>

        <div className="px-7 py-8 sm:px-9">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-[#715E5B]">Sign in with the email and password connected to your BTP account.</p>

          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block text-sm font-semibold">
              Email
              <input type="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-[#D8C7B8] bg-white px-4 py-3.5 text-base text-[#3A1A1E] outline-none transition placeholder:text-[#9A8985] focus:border-[#9C7A3C] focus:ring-2 focus:ring-[#C9A66B]/30" required />
            </label>

            <label className="block text-sm font-semibold">
              Password
              <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" className="mt-2 w-full rounded-xl border border-[#D8C7B8] bg-white px-4 py-3.5 text-base text-[#3A1A1E] outline-none transition placeholder:text-[#9A8985] focus:border-[#9C7A3C] focus:ring-2 focus:ring-[#C9A66B]/30" required />
            </label>

            {error ? <div role="alert" className="rounded-xl border border-[#B54C4C]/30 bg-[#B54C4C]/10 px-4 py-3 text-sm leading-5 text-[#7D2F2F]">{error}</div> : null}

            <button type="submit" disabled={disabled} className="w-full rounded-xl bg-[#3A1A1E] px-4 py-4 text-base font-bold text-white transition hover:bg-[#51242A] disabled:cursor-not-allowed disabled:opacity-45">
              {busy || loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-[#715E5B]">
            BTP is invite-only. Need help?{' '}
            <a className="font-semibold text-[#3A1A1E] underline decoration-[#C9A66B] underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>Contact support</a>
          </p>
        </div>
      </section>
    </main>
  );
}
