'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { useAuth } from '@/components/AuthContext';
import { SUPPORT_EMAIL } from '@/lib/site';

const links = [
  { href: '/situations', label: 'Questions' },
  { href: '/situations/new', label: 'Ask' },
  { href: '/polls', label: 'Polls' },
  { href: '/help', label: 'Private help' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/invite', label: 'Invite' },
  { href: '/support', label: 'Support' },
];

export function MemberNav() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { isAdmin } = useAuth();
  const items = isAdmin ? [...links, { href: '/admin/founder', label: 'Founder' }, { href: '/admin/waitlist', label: 'Waitlist' }, { href: '/admin/company-inquiries', label: 'Companies' }, { href: '/admin/investors', label: 'Investors' }] : links;
  return (
    <nav aria-label="Member navigation" className="sticky top-0 z-40 border-b border-[rgba(232,204,148,0.16)] bg-[rgba(7,4,5,0.72)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm sm:px-8">
        <Link href="/situations" aria-label="BTP home" className="mr-2 rounded-[9px] border border-[rgba(240,214,165,0.35)] bg-gradient-to-br from-white/10 to-white/[0.02] px-2.5 font-signet text-2xl leading-8 text-[#e8cc94]">BTP</Link>
        {items.map(l => {
          const active = pathname === l.href;
          return (
            <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined}
              className={`relative py-2 ${active ? 'text-[#fff6ea]' : 'text-[#d9ccbd] hover:text-[#fff6ea]'}`}>
              {l.label}
              {active && <span aria-hidden className="absolute inset-x-0 -bottom-3 h-0.5 bg-gradient-to-r from-transparent via-[#e8cc94] to-transparent" />}
            </Link>
          );
        })}
        <button type="button" onClick={() => void signOut({ redirectUrl: '/' })}
          className="ml-auto rounded-full border border-[rgba(232,204,148,0.38)] px-4 py-2 text-[#e8cc94] hover:bg-[rgba(201,166,107,0.08)]">Sign out</button>
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
        Questions? Email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </div>
  );
}
