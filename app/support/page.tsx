import Link from 'next/link';

const SUPPORT_EMAIL = 'fortunaindustriesinc@gmail.com';

export const metadata = {
  title: 'BTP | Support',
  description: 'Support for the BTP invite-only beta.',
};

export default function SupportPage() {
  return (
    <main className="min-h-screen px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">BTP beta</p>
        <h1 className="text-3xl font-bold">Support</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Need help with access, your account, a safety concern, or a technical issue? Email the BTP team and include the email address associated with your invitation.
        </p>
        <a className="mt-6 inline-flex rounded-lg bg-amber-300 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-200" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
        <section className="mt-8 space-y-2 rounded-xl border border-slate-700 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Delete your BTP account</h2>
          <p className="leading-7 text-slate-300">
            Email <a className="text-amber-300 hover:text-amber-200" href={`mailto:${SUPPORT_EMAIL}?subject=BTP%20account%20deletion%20request`}>{SUPPORT_EMAIL}</a> with the subject “BTP account deletion request” from the email associated with your invitation. BTP will verify the request and delete your account and associated personal data. Community contributions may be retained only in de-identified form to preserve the integrity of shared discussions.
          </p>
        </section>
        <p className="mt-8 text-sm text-slate-400">
          Do not email confidential study information, patient information, or protected health information.
        </p>
        <div className="mt-8 border-t border-slate-800 pt-5 text-sm">
          <Link className="text-amber-300 hover:text-amber-200" href="/privacy">Privacy policy</Link>
        </div>
      </div>
    </main>
  );
}
