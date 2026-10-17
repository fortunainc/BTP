'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

const links = [
  { href: '/situations', label: 'Questions' },
  { href: '/situations/new', label: 'Ask' },
  { href: '/polls', label: 'Polls' },
  { href: '/help', label: 'Private help' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/support', label: 'Support' },
];

export function MemberNav() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  return (
    <nav aria-label="Member navigation" className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm sm:px-8">
        <Link href="/situations" className="mr-2 font-bold tracking-wide text-white">BTP</Link>
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={pathname === l.href ? 'font-semibold text-white' : 'text-slate-400 hover:text-white'}>
            {l.label}
          </Link>
        ))}
        <button type="button" onClick={() => void signOut({ redirectUrl: '/' })}
          className="ml-auto text-slate-400 hover:text-white">Sign out</button>
      </div>
    </nav>
  );
}

export function MembershipPending() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-slate-700 bg-slate-800/50 p-6 text-left">
      <h2 className="text-xl font-semibold text-white">Your membership is under review</h2>
      <p className="mt-3 text-slate-300">
        BTP reviews every professional privately before community access opens. You will hear from BTP by email
        once your review is complete. If you have not finished your profile, <Link className="underline" href="/onboarding">complete it now</Link>.
      </p>
      <p className="mt-3 text-sm text-slate-400">
        Questions? Email <a className="underline" href="mailto:fortunaindustriesinc@gmail.com">fortunaindustriesinc@gmail.com</a>.
      </p>
    </div>
  );
}
