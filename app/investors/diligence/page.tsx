import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { INVESTOR_COOKIE } from '@/lib/investor-auth';
import { logInvestorActivity, roomViewer } from '@/lib/investor-access';
import { DILIGENCE_CATEGORIES } from '@/lib/diligence';
import { Gate } from '../ui';
import { SUPPORT_EMAIL } from '@/lib/site';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata: Metadata = { title: 'BTP | Data room', description: 'Diligence materials for BTP investors.', robots: { index: false, follow: false, nocache: true } };

const DESCRIPTIONS: Record<string, string> = {
  'Company and legal': 'Formation and ownership documents and key agreements.',
  Financials: 'Financial position, model and assumptions.',
  'Product and technology': 'Architecture, security approach and roadmap.',
  Traction: 'Waitlist, community activity and pilot progress.',
  Market: 'Market sizing, landscape and sources.',
};
const kb = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`);

/** Private data room: files the founder has added, grouped by section. Same access as the investor room. */
const ERRORS: Record<string, string> = { empty: 'Choose at least one section or add a note.', email: 'Enter your email so BTP can reply.', unavailable: 'Your request could not be sent. Please try again, or email BTP directly.' };

export default async function DataRoom({ searchParams }: { searchParams: Promise<{ requested?: string; error?: string }> }) {
  const { requested, error } = await searchParams;
  const viewer = await roomViewer((await cookies()).get(INVESTOR_COOKIE)?.value);
  if (!viewer) redirect('/investors');
  await logInvestorActivity(viewer, 'data_room');
  const docs = await prisma.diligenceDoc.findMany({ select: { id: true, title: true, category: true, fileName: true, size: true, createdAt: true }, orderBy: { createdAt: 'asc' } }).catch(() => []);
  return <Gate>
    <div className="eyebrow">Private</div>
    <h1><span className="ln l1">The data <span className="g">room.</span></span></h1>
    <p className="sub">Request the materials relevant to your review. BTP will confirm what is available and coordinate access.</p>
    <div className="gcard reveal in droom">
      {DILIGENCE_CATEGORIES.map((category) => {
        const files = docs.filter((d) => d.category === category);
        return <section key={category}>
          <h2>{category}</h2>
          <p className="desc">{DESCRIPTIONS[category]}</p>
          {files.length > 0 && <ul>{files.map((d) => <li key={d.id}><a href={`/investors/diligence/file/${d.id}`} target="_blank" rel="noopener">{d.title}</a><small>{kb(d.size)}</small></li>)}</ul>}
        </section>;
      })}
      <form id="request" className="dreq" method="post" action="/investors/diligence/request">
        <h2>Request materials</h2>
        {requested ? <p className="ok" role="status">Request received. BTP will confirm what is available and follow up by email.</p> : <>
          <fieldset><legend className="sr">Sections</legend>{DILIGENCE_CATEGORIES.map((c) => <label key={c} className="chk"><input type="checkbox" name="section" value={c} /> {c}</label>)}</fieldset>
          {viewer.kind === 'shared' && <><label htmlFor="dr-email">Your email</label><input id="dr-email" name="email" type="email" autoComplete="email" required /><label htmlFor="dr-name">Name and firm</label><input id="dr-name" name="name" autoComplete="organization" /></>}
          <label htmlFor="dr-note">Anything specific (optional)</label>
          <textarea id="dr-note" name="note" rows={3} maxLength={2000} />
          {error && ERRORS[error] && <p className="err" role="alert">{ERRORS[error]}</p>}
          <button className="btn gold" type="submit">Request diligence materials <span aria-hidden>→</span></button>
        </>}
        <p className="alt">Prefer email? <a href={`mailto:${SUPPORT_EMAIL}?subject=BTP%20diligence%20materials%20request`}>{SUPPORT_EMAIL}</a></p>
      </form>
      <p><Link href="/investors">← Back to the investor room</Link></p>
    </div>
  </Gate>;
}
