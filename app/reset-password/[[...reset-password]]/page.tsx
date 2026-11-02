'use client';

import { SignIn, useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  return (
    <main className="min-h-screen bg-[#080706] px-4 py-10 text-[#f2eadf]">
      <div className="mx-auto max-w-md">
        <Link href="/sign-in" className="text-[#e8cc94]">← Back to sign in</Link>
        <h1 className="mt-6 text-4xl">Reset your password</h1>
        <p className="mb-8 mt-3 text-[#d9ccbd]">Enter your email, then choose “Forgot password?” on the password screen. Verify the code sent to your email and choose a new password.</p>
        {!isLoaded ? <p>Loading…</p> : isSignedIn ? (
          <div className="rounded-xl border border-[#e8cc94]/25 p-5">
            <p className="mb-4">You’re currently signed in. Sign out here to reset your password with an email code.</p>
            <button type="button" onClick={() => void signOut({ redirectUrl: '/reset-password' })} className="btn-primary rounded px-5 py-3">Sign out to reset password</button>
            <p className="mt-4 text-sm"><Link href="/account/security" className="text-[#e8cc94] underline">Back to account settings</Link></p>
          </div>
        ) : <SignIn routing="path" path="/reset-password" forceRedirectUrl="/account/security" signUpUrl="/join" appearance={{
          variables: { colorPrimary: '#e8cc94', colorNeutral: '#ffffff', colorBackground: '#171310', colorForeground: '#f2eadf', colorMutedForeground: '#d9ccbd', colorInput: '#080706', colorInputForeground: '#f2eadf', borderRadius: '0.75rem' },
          elements: { rootBox: 'w-full', cardBox: 'w-full', card: 'w-full shadow-none' },
        }} />}
      </div>
    </main>
  );
}
