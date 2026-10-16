import Link from 'next/link';

const collected = [
  'Account email and authentication identifiers',
  'Your private verification method and status',
  'A member-chosen handle and broad professional category',
  'Questions, answers, outcomes, reports, and private-help requests you submit',
  'Limited security, session, and audit information needed to protect the service',
];
const neverPublic = [
  'Your account email, real name, or verification evidence',
  'Your exact employer or LinkedIn profile',
  'The identity of a member who reports content',
  'A direct public link between your account and community activity',
];
const prohibited = [
  'Patient-identifying information',
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
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#9C7A3C]">Trust &amp; privacy</p>
          <h1 className="text-4xl font-bold">Identity protected in discussions. Verified privately by BTP.</h1>
          <p className="mt-5 text-lg leading-8 text-[#715E5B]">BTP is an invite-only professional-help community. Other members see your handle and generalized professional perspective—not your account identity. BTP retains limited confidential account information for verification, safety, authentication, and support.</p>
        </section>
        <Info title="What BTP keeps privately" items={collected} />
        <Info title="What members do not see" items={neverPublic} />
        <section className="rounded-2xl border border-[#D8C7B8] bg-[#FFFDFC] p-6">
          <h2 className="text-2xl font-bold">Professional verification</h2>
          <p className="mt-4 leading-7 text-[#715E5B]">A member may be verified through relevant LinkedIn history, a work-email check, endorsement by an already verified member, or other evidence reviewed privately by BTP. Verification confirms credible clinical-trial experience; it is not an endorsement of every answer the member provides.</p>
        </section>
        <section className="rounded-2xl border border-[#D8C7B8] bg-[#FFFDFC] p-6">
          <h2 className="text-2xl font-bold">Before you post</h2>
          <p className="mt-3 leading-7 text-[#715E5B]">BTP scans contributions for identifying details, but no automated safeguard is perfect. Members must not submit:</p>
          <ul className="mt-4 space-y-3 text-[#715E5B]">{prohibited.map((item) => <li key={item}>• {item}</li>)}</ul>
        </section>
        <section className="space-y-4 border-t border-[#D8C7B8] pt-8 text-sm leading-6 text-[#715E5B]">
          <p>BTP does not promise absolute anonymity. Content details, employer monitoring, legal process, or a security incident could create re-identification risk. We minimize that risk through generalized labels, access controls, redaction, and private moderation.</p>
          <p>BTP does not sell identifiable member activity or ordinary community conversations. Paid research or sponsored participation requires separate, explicit opt-in.</p>
          <p>To request access, correction, export, or deletion of account data, email <a className="font-semibold underline" href="mailto:fortunaindustriesinc@gmail.com">fortunaindustriesinc@gmail.com</a>.</p>
          <p>Last updated: October 16, 2026.</p>
        </section>
      </div>
    </main>
  );
}

function Info({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-2xl border border-[#D8C7B8] bg-[#FFFDFC] p-6"><h2 className="text-2xl font-bold">{title}</h2><ul className="mt-4 space-y-3 text-[#715E5B]">{items.map((item) => <li key={item}>• {item}</li>)}</ul></section>;
}
