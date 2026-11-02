import { UserProfile } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=%2Faccount%2Fsecurity');

  return (
    <main className="min-h-screen bg-[#080706] px-4 py-8 text-[#f2eadf] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/situations" className="text-[#e8cc94]">← Back to BTP</Link>
        <h1 className="mt-6 text-4xl">Account &amp; password</h1>
        <p className="mb-8 mt-3 text-[#d9ccbd]">In Security, add or change your password. You can still sign in with an email code.</p>
        <UserProfile routing="path" path="/account" appearance={{
          variables: { colorPrimary: '#e8cc94', colorNeutral: '#ffffff', colorBackground: '#171310', colorForeground: '#f2eadf', colorMutedForeground: '#d9ccbd', colorInput: '#080706', colorInputForeground: '#f2eadf', borderRadius: '0.75rem' },
          elements: { rootBox: 'w-full', cardBox: 'w-full max-w-full', card: 'w-full shadow-none' },
        }} />
      </div>
    </main>
  );
}
