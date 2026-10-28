'use client';

import { useSignIn } from '@clerk/nextjs';
import { FormEvent, useState } from 'react';

const SUPPORT_EMAIL = 'fortunaindustriesinc@gmail.com';

function clerkMessage(error: unknown): string {
  const candidate = error as { errors?: Array<{ longMessage?: string; message?: string }> };
  return candidate.errors?.[0]?.longMessage || candidate.errors?.[0]?.message || 'Check your email and password and try again.';
}

/** Only same-site destinations; anything resolving to another origin falls back to the member home. */
function safeRedirect(destination: string | null): string {
  if (!destination) return '/situations';
  try {
    const url = new URL(destination, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : '/situations';
  } catch {
    return '/situations';
  }
}

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
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
      const redirectTo = safeRedirect(destination);
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

  async function sendCode() {
    if (fetchStatus === 'fetching' || busy || !email.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { error: createError } = await signIn.create({ identifier: email.trim() });
      if (createError) {
        setError(createError.longMessage || createError.message || 'Could not start email sign-in.');
        return;
      }
      const { error: codeError } = await signIn.emailCode.sendCode({ emailAddress: email.trim() });
      if (codeError) {
        setError(codeError.longMessage || codeError.message || 'Could not send the sign-in code.');
        return;
      }
      setCodeSent(true);
    } catch (cause) {
      setError(clerkMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fetchStatus === 'fetching' || busy || !code.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { error: codeError } = await signIn.emailCode.verifyCode({ code: code.trim() });
      if (codeError) {
        setError(codeError.longMessage || codeError.message || 'That code could not be verified.');
        return;
      }
      if (signIn.status !== 'complete') {
        setError('Your account requires another verification step. Contact BTP support.');
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const destination = params.get('redirect_url');
      const redirectTo = safeRedirect(destination);
      await signIn.finalize({ navigate: ({ decorateUrl }) => window.location.replace(decorateUrl(redirectTo)) });
    } catch (cause) {
      setError(clerkMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const loading = fetchStatus === 'fetching';
  const disabled = loading || busy || !email.trim() || !password;

  return (
    <main className="min-h-screen px-5 py-10 text-[#f2eadf] sm:flex sm:items-center sm:justify-center">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[22px] border border-[rgba(232,204,148,0.25)] bg-gradient-to-br from-white/[0.07] to-white/[0.015] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <div className="flex items-center gap-3 px-7 pt-8 sm:px-9">
          <span className="rounded-[9px] border border-[rgba(240,214,165,0.35)] bg-gradient-to-br from-white/10 to-white/[0.02] px-2.5 font-signet text-2xl leading-8 text-[#e8cc94]">BTP</span>
          <span className="text-[10.5px] font-medium uppercase leading-tight tracking-[0.14em] text-[#d9ccbd]">Behind<br />the Protocol</span>
        </div>

        <div className="px-7 py-8 sm:px-9">
          <h1 className="text-4xl text-[#fff6ea]">Welcome <span className="text-[#e8cc94]">back.</span></h1>
          <p className="mt-2 text-sm leading-6 text-[#d9ccbd]">Sign in with the email and password connected to your BTP account.</p>

          <form onSubmit={codeSent ? verifyCode : submit} className="mt-7 space-y-5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]">
              Email
              <input type="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full normal-case tracking-normal font-normal rounded-lg border border-[rgba(232,204,148,0.25)] bg-black/40 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-[#9c8a78] focus:border-[#c9a66b] focus:ring-2 focus:ring-[#C9A66B]/25" required />
            </label>

            {codeSent ? (
              <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]">
                Sign-in code
                <input type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter the code from your email" className="mt-2 w-full normal-case tracking-normal font-normal rounded-lg border border-[rgba(232,204,148,0.25)] bg-black/40 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-[#9c8a78] focus:border-[#c9a66b] focus:ring-2 focus:ring-[#C9A66B]/25" required />
              </label>
            ) : (
              <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c98f]">
                Password
                <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" className="mt-2 w-full normal-case tracking-normal font-normal rounded-lg border border-[rgba(232,204,148,0.25)] bg-black/40 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-[#9c8a78] focus:border-[#c9a66b] focus:ring-2 focus:ring-[#C9A66B]/25" />
              </label>
            )}

            {error ? <div role="alert" className="rounded-xl border border-[#c46b6b]/40 bg-[#c46b6b]/10 px-4 py-3 text-sm leading-5 text-[#f1b7b7]">{error}</div> : null}

            <button type="submit" disabled={codeSent ? loading || busy || !code.trim() : disabled} className="btn-primary w-full rounded px-4 py-4 text-sm uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-45">
              {busy || loading ? 'Signing in…' : codeSent ? 'Verify and enter BTP' : 'Sign in'}
            </button>

            {!codeSent ? (
              <button type="button" onClick={sendCode} disabled={loading || busy || !email.trim()} className="w-full rounded border border-[rgba(232,204,148,0.38)] bg-transparent px-4 py-3.5 text-sm uppercase tracking-[0.16em] text-[#f2eadf] transition hover:bg-[#C9A66B]/10 disabled:cursor-not-allowed disabled:opacity-45">
                Email me a sign-in code
              </button>
            ) : (
              <button type="button" onClick={() => { signIn.reset(); setCodeSent(false); setCode(''); setError(''); }} className="w-full text-sm font-semibold text-[#d9ccbd] underline decoration-[#C9A66B] underline-offset-4">Start over</button>
            )}
          </form>

          <p className="mt-6 text-center text-sm leading-6 text-[#d9ccbd]">
            New to BTP?{' '}
            <a className="text-[#e8cc94] underline decoration-[#C9A66B] underline-offset-4" href={`mailto:${SUPPORT_EMAIL}?subject=BTP%20beta%20access`}>Request beta access</a>
            <span className="mx-2 text-slate-600">·</span>
            <a className="text-[#d9ccbd] underline decoration-[#C9A66B] underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>Contact support</a>
          </p>
        </div>
      </section>
    </main>
  );
}
