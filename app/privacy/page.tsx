import type { Metadata } from 'next';
import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = { title: 'BTP | Privacy and trust', description: 'How BTP verifies members, protects identity in discussions, and uses data.' };

const collected = [
  'Waitlist email, professional role, optional paid review interest, signup source and member referral. BTP uses these to manage access and contact you about your stated interests.',
  'Waitlist interest is not consent to research or commercial reuse. Contact support to correct or remove your request.',
  'Account email and sign in identifiers',
  'Your private verification method and status',
  'A handle you choose and a broad professional category',
  'Questions, answers, outcomes, reports, and private help requests you submit',
  'Limited security, session, and audit information needed to protect the service',
];
const neverPublic = [
  'Your account email, real name, or verification evidence',
  'Your exact employer or LinkedIn profile',
  'The identity of a member who reports content',
  'A direct public link between your account and community activity',
];
const prohibited = [
  'Information that identifies a patient',
  'Sponsor, CRO, site, vendor, or individual names',
  'Protocol numbers, confidential protocol language, or unpublished results',
  'Internal documents, screenshots, or urgent safety reports',
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#EFE6D8] text-[#3A1A1E]">
      <header className="border-b border-[#D8C7B8] bg-[#FFFDFC]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="text-xl font-bold">BTP</Link>
          <Link href="/support" className="text-sm font-semibold">Support</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl space-y-10 px-5 py-12">
        <section>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#9C7A3C]">Trust and privacy</p>
          <h1 className="text-4xl font-bold">Identity protected in discussions. Verified privately by BTP.</h1>
          <p className="mt-5 text-lg leading-8 text-[#715E5B]">BTP is a private community for clinical research professionals, with access reviewed by BTP. Other members see your handle and a general description of your professional background, not your account identity. BTP keeps limited confidential account information for verification, safety, sign in, and support.</p>
        </section>
        <Info title="What BTP keeps privately" items={collected} />
        <Info title="What members do not see" items={neverPublic} />
        <section className="rounded-2xl border border-[#D8C7B8] bg-[#FFFDFC] p-6">
          <h2 className="text-2xl font-bold">Professional verification</h2>
          <p className="mt-4 leading-7 text-[#715E5B]">BTP may verify a member through relevant LinkedIn history, a work email check, endorsement by an already verified member, or other evidence reviewed privately. Verification confirms credible clinical trial experience. It is not an endorsement of every answer a member gives.</p>
        </section>
        <section className="rounded-2xl border border-[#D8C7B8] bg-[#FFFDFC] p-6">
          <h2 className="text-2xl font-bold">Before you post</h2>
          <p className="mt-3 leading-7 text-[#715E5B]">BTP screens questions for identifying details before they are posted, but no automated safeguard is perfect. Please do not submit:</p>
          <ul className="mt-4 space-y-3 text-[#715E5B]">{prohibited.map((item) => <li key={item}>• {item}</li>)}</ul>
        </section>
        <section id="aggregated" className="scroll-mt-6 rounded-2xl border border-[#D8C7B8] bg-[#FFFDFC] p-6">
          <h2 className="text-2xl font-bold">How community information is used</h2>
          <h3 className="mt-5 text-lg font-bold">Aggregated community insights</h3>
          <p className="mt-2 leading-7 text-[#715E5B]">BTP plans to use aggregated insights from community discussions to identify common clinical research challenges and inform commercial research and product evaluations. Aggregated means we look for patterns across contributions, rather than sharing individual conversations.</p>
          <h3 className="mt-5 text-lg font-bold">Individual conversations and identities</h3>
          <p className="mt-2 leading-7 text-[#715E5B]">BTP does not sell identifiable member activity or community conversations, and companies do not receive private conversations or contributors’ identities. Confidential employer, sponsor, site, or vendor information does not belong in BTP and is not used in this work.</p>
          <h3 className="mt-5 text-lg font-bold">Paid product reviews</h3>
          <p className="mt-2 leading-7 text-[#715E5B]">Taking part in a paid product review is optional, separately authorized, and separate from community membership. Paid research or sponsored participation requires a separate, explicit opt in. You never need to join a review to ask questions, answer them, or stay a member.</p>
        </section>
        <section className="space-y-4 border-t border-[#D8C7B8] pt-8 text-sm leading-6 text-[#715E5B]">
          <p>BTP does not promise absolute anonymity. Content details, employer monitoring, legal process, or a security incident could create a risk of re-identification. We reduce that risk through general labels, access controls, redaction, and private moderation.</p>
          <p>To request access, correction, export, or deletion of your account data, email <a className="font-semibold underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
          <p>Last updated: October 30, 2026.</p>
        </section>
      </div>
    </main>
  );
}

function Info({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-2xl border border-[#D8C7B8] bg-[#FFFDFC] p-6"><h2 className="text-2xl font-bold">{title}</h2><ul className="mt-4 space-y-3 text-[#715E5B]">{items.map((item) => <li key={item}>• {item}</li>)}</ul></section>;
}
