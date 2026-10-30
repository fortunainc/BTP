import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { INVESTOR_COOKIE } from '@/lib/investor-auth';
import { logInvestorActivity, roomViewer } from '@/lib/investor-access';
import { DILIGENCE_CATEGORIES } from '@/lib/diligence';
import { Gate } from '../ui';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata: Metadata = { title: 'BTP | Data room', description: 'Diligence materials for BTP investors.', robots: { index: false, follow: false, nocache: true } };

const DILIGENCE_CONTACT = 'mailto:fortunaindustriesinc@gmail.com?subject=BTP%20diligence%20materials%20request';
const DESCRIPTIONS: Record<string, string> = {
  'Company and legal': 'Formation and ownership documents and key agreements.',
  Financials: 'Financial position, model and assumptions.',
  'Product and technology': 'Architecture, security approach and roadmap.',
  Traction: 'Waitlist, community activity and pilot progress.',
  Market: 'Market sizing, landscape and sources.',
};
const kb = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`);

/** Private data room: files the founder has added, grouped by section. Same access as the investor room. */
export default async function DataRoom() {
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
      <p className="dreq"><a className="btn gold" href={DILIGENCE_CONTACT}>Request diligence materials <span aria-hidden>→</span></a></p>
      <p><Link href="/investors">← Back to the investor room</Link></p>
    </div>
  </Gate>;
}
