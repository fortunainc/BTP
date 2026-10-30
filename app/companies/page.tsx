import type { Metadata } from 'next';
import Link from 'next/link';
import InquiryForm from './inquiry-form';
import SectionReveal from '@/components/marketing/SectionReveal';
import '../join/waitlist.css';
import './companies.css';

export const metadata: Metadata = {
  title: 'For startups | Behind the Protocol',
  description: 'Product reviews from verified clinical research professionals matched to the work your product supports.',
};

const STEPS = [
  ['Bring your product and the questions that matter', 'A product, workflow, or usable prototype, and what you most need to learn.'],
  ['We match the experience your review needs', 'We match reviewers to the specific work your product supports, using their verified role and relevant recent experience.'],
  ['Reviewers examine the work your product supports', 'Reviewers use a demo, sandbox, or usable prototype with mock data, never real patient information. If only a recording or live demonstration is available, they observe it. The review clearly distinguishes what they used from what they only viewed.'],
  ['Leave with a clear view of what to improve', 'Receive one prioritized product review.'],
];
const COVERS = ['What works well', 'Where users struggle or run into extra work', 'What is missing', 'Why the findings matter', 'What to improve first', 'The evidence behind each finding'];
const idx = (i: number) => ({ ['--i' as string]: i }) as React.CSSProperties;

export default function CompaniesPage() {
  return <div className="bw co">
    <SectionReveal />
    <header><Link href="/" className="bw-brand"><span>BTP</span><small>BEHIND<br />THE PROTOCOL</small></Link>
      <nav className="co-nav" aria-label="Main"><Link href="/">For professionals</Link><a href="#inquire" className="co-pill">Discuss your product</a></nav></header>
    <main>
      <section className="co-hero">
        <p className="bw-kicker">BTP Product Review · For founders and product teams</p>
        <h1>Build what clinical trial teams <em>actually need.</em></h1>
        <p className="bw-lead">Get your product in front of professionals matched to the work it needs to support. Leave knowing what to improve and why.</p>
        <div className="co-ctas"><a className="co-btn" href="#inquire">Discuss your product →</a></div>
      </section>

      <section className="co-sec" aria-labelledby="how">
        <p className="bw-kicker">How it works</p><h2 id="how">Does your product help clinical trial teams, or give them more work?</h2>
        <ol className="tl" data-tl>
          {STEPS.map(([t, d], i) => <li key={t} className="tl-step" style={idx(i)}><span className="tl-node" aria-hidden="true">{i + 1}</span><div className="tl-body"><h3>{t}</h3><p>{d}</p></div></li>)}
          <span className="tl-rail" aria-hidden="true"><span className="tl-fill" /></span>
        </ol>
      </section>

      <section className="co-sec" aria-labelledby="covers">
        <p className="bw-kicker">What you receive</p><h2 id="covers">Know what works. See what needs to change.</h2>
        <div className="dv" data-reveal>
          <div className="dv-head" aria-hidden="true"><span className="dv-mark">BTP</span><span>One prioritized product review</span></div>
          <ol className="dv-grid">{COVERS.map((c, i) => <li key={c} className="dv-panel" style={idx(i)}><span className="dv-n">{String(i + 1).padStart(2, '0')}</span><span className="dv-t">{c}</span></li>)}</ol>
        </div>
        <p className="co-note">The optional 30 minute debrief with BTP helps you understand the findings and consider your next steps. It does not require a live session with the reviewers, whose identities stay private.</p>
      </section>

      <section className="co-sec" aria-labelledby="why">
        <p className="bw-kicker">Why BTP</p><h2 id="why">Feedback you can act on.</h2>
        <div className="wb" data-reveal>
          <div className="wb-lead" style={idx(0)}><h3>See what repeats, and what stands alone</h3><p>Every finding shows how many reviewers ran into it and where. Issues several reviewers share stand out, and a problem only one reviewer hit is still reported with its context.</p></div>
          <div className="wb-notes">
            <p className="wb-note" style={idx(1)}>A review shows how your product works for the people who use it. It is product feedback, not clinical, regulatory, or purchasing validation.</p>
            <p className="wb-note" style={idx(2)}>Planned aggregated community insights may add context about recurring challenges. The evidence in your review comes only from the reviewers who examined your product. Companies do not receive private conversations or contributors’ identities.</p>
          </div>
        </div>
      </section>

      <section className="co-sec co-form" id="inquire" aria-labelledby="inq">
        <div><p className="bw-kicker">Start a conversation</p><h2 id="inq">Discuss your product.</h2>
          <p>Tell us what you are building and what you need to learn. We’ll discuss reviewer fit, scope, and timing with you.</p>
          <p><b>A paid service.</b> Scope, timing, and fees agreed before work begins.</p>
          <p className="bw-small">Please do not include patient information or confidential documents.</p></div>
        <div className="bw-card"><InquiryForm /></div>
      </section>
    </main>
    <footer><span>Behind the Protocol · Behind The Protocol Inc. · <Link href="/privacy">Privacy</Link></span><Link href="/support">Contact BTP</Link></footer>
  </div>;
}
