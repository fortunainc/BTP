import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/site';


export const metadata = {
  title: 'BTP | Support',
  description: 'Help with BTP access, accounts, technical problems, safety concerns and account deletion.',
};

const TOPICS = [
  ['Access and invitations', 'Questions about your request, a referral, or verification.'],
  ['Account and sign in', 'Trouble with your password or email code.'],
  ['Technical problems', 'Include your device, browser, and what happened.'],
  ['Safety concerns', 'Report a post or a privacy worry. For urgent study safety issues, use your official channels.'],
];

export default function SupportPage() {
  return (
    <main className="min-h-screen px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">BTP beta</p>
        <h1 className="text-3xl font-bold">We’re here to help.</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Email BTP about access, your account, a technical problem, or a safety concern. Include the email address connected to your invitation so we can find your account quickly.
        </p>
        <a className="mt-6 inline-flex rounded-lg bg-amber-300 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-200" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {TOPICS.map(([title, body]) => (
            <div key={title} className="rounded-xl border border-slate-700 p-4">
              <h2 className="text-base font-semibold text-white">{title}</h2>
              <p className="mt-1 text-[15px] leading-6 text-slate-300">{body}</p>
            </div>
          ))}
        </div>
        <section className="mt-6 space-y-2 rounded-xl border border-slate-700 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Delete your BTP account</h2>
          <p className="leading-7 text-slate-300">
            Email <a className="text-amber-300 hover:text-amber-200" href={`mailto:${SUPPORT_EMAIL}?subject=BTP%20account%20deletion%20request`}>{SUPPORT_EMAIL}</a> with the subject “BTP account deletion request” from the email connected to your invitation. BTP will verify the request and delete your account and associated personal data. Community contributions may be kept only in de-identified form so shared discussions still make sense.
          </p>
        </section>
        <p className="mt-8 text-sm text-slate-400">
          Please do not email confidential study information, patient information, or protected health information.
        </p>
        <div className="mt-8 border-t border-slate-800 pt-5 text-sm">
          <Link className="text-amber-300 hover:text-amber-200" href="/privacy">Privacy policy</Link>
          <span className="text-slate-500"> · </span>
          <Link className="text-amber-300 hover:text-amber-200" href="/">BTP home</Link>
        </div>
      </div>
    </main>
  );
}
