import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/marketing/SiteChrome';
import s from '@/components/marketing/site.module.css';
import './home.css';
export const metadata: Metadata = { title: 'BTP | Clinical trial experience, connected.', description: 'Behind the Protocol connects clinical-trial professionals to practical peer experience, operational discussions, and private help.' };
const contact = 'mailto:fortunaindustriesinc@gmail.com?subject=BTP%20beta%20access&body=Role%3A%0AYears%20in%20clinical%20research%3A%0AWhat%20you%20hope%20to%20use%20BTP%20for%3A%0A';

const steps = [
  ['1 · ASK', 'Bring the situation', 'Describe the problem. No patient data, no site or study names.'],
  ['2 · LEARN', 'Hear from peers', 'Verified professionals share what they did and what to watch for.'],
  ['3 · CLOSE THE LOOP', 'Share what worked', 'Mark the answer that helped, so the next person finds it fast.'],
  ['4 · GO DEEPER', 'Get private help', 'One-on-one help, including interview prep. Scope agreed first.'],
];
const gets = [
  ['💬', 'Answers from people who’ve been there', 'Practical experience from verified coordinators, CRAs and trial teams, not generic advice.'],
  ['✓', 'Proof of what worked', 'Members come back to report what helped, so the best answers rise to the top.'],
  ['🔒', 'A safe place to ask', 'Ask the questions you can’t ask your manager or your pharma/biotech contact.'],
  ['💰', 'Get paid for what you know', 'Opt in to paid research and private expert sessions. You choose what to join, and your identity stays protected.'],
];
const roles = [
  ['Doing the work', ['Study coordinators', 'Research nurses', 'Site teams']],
  ['Connecting the work', ['CRAs', 'Study and clinical operations managers', 'CRO professionals']],
  ['Supporting the work', ['Site and research managers', 'Pharma/biotech clinical teams', 'Research leads']],
] as const;
const protects = ['Your name and employer never appear next to your posts', 'Every member is verified privately before joining', 'Identifying details are automatically removed', 'Content is moderated, and anyone can report a post'];
const never = ['Patient information', 'Site, study, protocol or company names', 'Confidential documents or screenshots', 'Urgent safety reports (use your official channels)'];
const faqs = [
  ['Is it free?', 'Yes. Asking, answering and sharing what worked is free. Private one-on-one help may have a fee, always agreed before you start. Paid research and expert sessions are coming soon, always opt-in.'],
  ['How does verification work?', 'BTP confirms your experience privately, for example through LinkedIn or a reference from a member. You don’t need a work email, and other members never see your details.'],
  ['Can I ask without naming my site or study?', 'Yes, and you should. Describe the workflow and the challenge, not the people or places.'],
  ['Will my employer know?', 'No. BTP never contacts your employer, and your name and employer are never shown with your posts.'],
  ['How is this different from LinkedIn groups?', 'Every member is verified, posts are identity-protected, and members report back on what actually worked.'],
];

export default function HomePage() {
  return <div className={s.site}><a className={s.skip} href="#main">Skip to content</a><SiteHeader/>
  <main id="main" className="home">
    <section className="hero"><div className="wrap">
      <p className="label">For clinical research professionals · Invitation-only beta</p>
      <h1 className="bookline">The people running clinical trials see the failures first, and the system was never built to hear them. <em>BTP is the system built to hear them.</em></h1>
      <p className="bookcite">From <span className="citeTitle">Behind the Protocol</span></p>
      <p className="sub"><b>Real answers from the people who actually run clinical trials.</b> A private, verified community where coordinators, CRAs and trial teams ask what they can’t ask at work, and learn what actually worked.</p>
      <div className="ctas"><a className="btn" href={contact}>Request beta access <span aria-hidden>↗</span></a><Link className="btn ghost" href="#how">See how it works <span aria-hidden>↓</span></Link></div>
      <div className="chips"><span className="chip"><b>✓</b> Free to join</span><span className="chip"><b>✓</b> Your name and employer stay hidden</span><span className="chip"><b>✓</b> Every member verified</span><span className="chip"><b>✓</b> Web, plus iPhone by beta invite</span></div>
    </div></section>

    <section><div className="wrap">
      <p className="label">The reality at sites</p>
      <h2>You’re carrying more than the protocol shows.</h2>
      <div className="grid3">
        <div className="stat"><div className="n">11%</div><div className="t">of trial sites never enroll a single patient, and 37% under-enroll</div></div>
        <div className="stat"><div className="n">35 to 61%</div><div className="t">yearly turnover of patient-facing site staff</div></div>
        <div className="stat"><div className="n">6 to 12 mo</div><div className="t">for a study to recover after a coordinator leaves</div></div>
      </div>
      <div className="callout">When the person who knew how to fix it leaves, the answer leaves too. <b>BTP keeps that know-how where the next coordinator can find it.</b></div>
      <p className="fine">Sources: SCRS 2023 site workforce report; Tufts CSDD, 2013.</p>
    </div></section>

    <section id="how"><div className="wrap">
      <p className="label">How it works</p>
      <h2>From “has anyone seen this?” to “here’s what helped.”</h2>
      <div className="grid4">{steps.map(([k, h, p]) => <div className="step" key={k}><div className="k">{k}</div><h4>{h}</h4><p>{p}</p></div>)}</div>
    </div></section>

    <section><div className="wrap">
      <p className="label">What you get</p>
      <h2>Help that actually fits the work.</h2>
      <div className="grid2">{gets.map(([ic, h, p]) => <div className="card" key={h}><div className="ic" aria-hidden>{ic}</div><h3>{h}{h === 'Get paid for what you know' && <span className="soon">Coming soon</span>}</h3><p>{p}</p></div>)}</div>
    </div></section>

    <section id="who"><div className="wrap roles">
      <p className="label">Who it’s for</p>
      <h2>Different roles. The same friction.</h2>
      <div className="grid3">{roles.map(([h, items]) => <div className="card" key={h}><h3>{h}</h3><ul>{items.map(i => <li key={i}>{i}</li>)}</ul></div>)}</div>
    </div></section>

    <section id="trust"><div className="wrap">
      <p className="label">Privacy and trust</p>
      <h2>Candid questions. Real protection.</h2>
      <div className="trust">
        <div className="card"><h3 className="h3tight">How BTP protects you</h3><ul className="list">{protects.map(t => <li key={t}><span className="yes" aria-hidden>✓</span>{t}</li>)}</ul></div>
        <div className="card"><h3 className="h3tight">Never post</h3><ul className="list">{never.map(t => <li key={t}><span className="no" aria-hidden>✕</span>{t}</li>)}</ul></div>
      </div>
      <p className="fine">BTP separates the identity used for verification from the identity shown in discussions. That supports candid participation; it is not a promise of absolute anonymity. Peer experience does not replace medical advice or your site’s procedures. <Link href="/privacy">Read the privacy policy</Link>.</p>
    </div></section>

    <section><div className="wrap faq">
      <p className="label">Questions</p>
      <h2>Know what you’re joining.</h2>
      {faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </div></section>

    <section className="cta"><div className="wrap">
      <h2>Bring the experience that doesn’t fit in a dashboard.</h2>
      <p>Join clinical research professionals who understand the work behind every visit and milestone. Membership is free.</p>
      <div className="ctas"><a className="btn gold" href={contact}>Request beta access <span aria-hidden>↗</span></a><Link className="btn ghost ghostLight" href="/sign-in">Member sign in</Link></div>
    </div></section>
  </main>
  <SiteFooter/></div>;
}
