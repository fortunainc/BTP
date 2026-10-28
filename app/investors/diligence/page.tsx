import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { INVESTOR_COOKIE } from '@/lib/investor-auth';
import { logInvestorActivity, roomViewer } from '@/lib/investor-access';
import { DILIGENCE_CATEGORIES } from '@/lib/diligence';
import { CONTACT, Gate } from '../ui';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata: Metadata = { title: 'BTP | Data room', robots: { index: false, follow: false, nocache: true } };

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
    <p className="sub">Documents for diligence. Access is personal to you.</p>
    <div className="gcard reveal in droom">
      {DILIGENCE_CATEGORIES.map((category) => {
        const files = docs.filter((d) => d.category === category);
        return <section key={category}>
          <h2>{category}</h2>
          {files.length ? <ul>{files.map((d) => <li key={d.id}><a href={`/investors/diligence/file/${d.id}`} target="_blank" rel="noopener">{d.title}</a><small>{kb(d.size)}</small></li>)}</ul>
            : <p className="none">Available on request.</p>}
        </section>;
      })}
      <p><Link href="/investors">← Back to the investor room</Link> · <a href={CONTACT}>Request a document</a></p>
    </div>
  </Gate>;
}
