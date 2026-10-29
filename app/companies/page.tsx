import type { Metadata } from 'next';
import Link from 'next/link';
import InquiryForm from './inquiry-form';
import '../join/waitlist.css';
import './companies.css';

export const metadata: Metadata = {
  title: 'For companies | Behind the Protocol',
  description: 'Practical product reviews from verified clinical research professionals who do the work your product is meant to support.',
};

const STEPS = [
  ['You bring the product and your questions', 'A product, workflow, or usable prototype, and the questions you want answered.'],
  ['We match reviewers to the work', 'Reviewers are chosen for relevant, recent experience with the work being evaluated. Professional verification alone does not make someone right for every review.'],
  ['Reviewers use your product', 'They work in your demo or sandbox, with synthetic data where available. If hands on access is not possible, we assess a walkthrough or prototype and explain the limits of that assessment.'],
  ['You receive one organized review', 'Every finding comes with its evidence and a recommended change, in priority order. An optional 30 minute debrief led by BTP walks you through it.'],
];
const COVERS = ['What works well', 'Where users struggle or run into extra work', 'What is missing', 'Why the findings matter', 'What to improve first', 'The evidence behind each finding'];
const WHY = [
  ['The right people', 'Reviewers have recently done the work your product supports, and they judge it in the context of that work.'],
  ['Patterns, not opinions', 'Structured feedback from several reviewers shows which problems recur and which are one person’s preference.'],
  ['A clear next step', 'Each finding is tied to its evidence and ranked, so you know what to improve first.'],
  ['Handled for you', 'BTP manages reviewer matching, the review itself, and the synthesis.'],
];

export default function CompaniesPage() {
  return <div className="bw co">
    <header><Link href="/" className="bw-brand"><span>BTP</span><small>BEHIND<br />THE PROTOCOL</small></Link>
      <nav className="co-nav" aria-label="Main"><Link href="/">For professionals</Link><a href="#inquire" className="co-pill">Discuss a product review</a></nav></header>
    <main>
      <section className="co-hero">
        <p className="bw-kicker">For founders and product teams</p>
        <h1>Does your product help clinical trial teams, <em>or give them more work?</em></h1>
        <p className="bw-lead">Get practical feedback from verified clinical research professionals who do the work your product is meant to support. Understand what helps, what gets in the way, what is missing, and what to improve.</p>
        <div className="co-ctas"><a className="co-btn" href="#inquire">Discuss a product review →</a><a className="co-ghost" href="#example">See an example</a></div>
      </section>

      <section className="co-sec" aria-labelledby="how">
        <p className="bw-kicker">How it works</p><h2 id="how">One clear product review.</h2>
        <ol className="co-steps">{STEPS.map(([t, d], i) => <li key={t}><span className="co-n">{i + 1}</span><div><h3>{t}</h3><p>{d}</p></div></li>)}</ol>
      </section>

      <section className="co-sec" aria-labelledby="covers">
        <p className="bw-kicker">What you receive</p><h2 id="covers">Your review covers six things.</h2>
        <ol className="co-covers">{COVERS.map(c => <li key={c}>{c}</li>)}</ol>
        <p className="co-note">BTP leads the debrief and speaks for the review. Reviewers’ identities stay private, and the review does not include direct access to individual reviewers.</p>
      </section>

      <section className="co-sec" id="example" aria-labelledby="ex">
        <p className="bw-kicker">What a finding looks like</p><h2 id="ex">An example from a patient recruitment product.</h2>
        <p className="co-label">Illustrative example, not a completed BTP client review.</p>
        <div className="co-finding">
          <h3>Referral information must be entered again in the site’s existing system.</h3>
          <dl>
            <div><dt>What we saw</dt><dd>Reviewers who handle referrals had to copy each referral’s details from the product into the system their site already uses to track candidates.</dd></div>
            <div><dt>Why it matters</dt><dd>The same information is typed twice for every referral. That is duplicate work for a busy coordinator, and every retyped field is a chance for an error.</dd></div>
            <div><dt>What to change first</dt><dd>Let sites export referrals in a format their existing system accepts, or connect to the systems sites commonly use, so details are entered once.</dd></div>
            <div><dt>Evidence</dt><dd>In a real review, this shows how many reviewers ran into the issue, at which step, and what they said, so you can tell a recurring problem from a single preference.</dd></div>
          </dl>
        </div>
      </section>

      <section className="co-sec" aria-labelledby="why">
        <p className="bw-kicker">Why BTP</p><h2 id="why">Feedback you can act on.</h2>
        <div className="co-why">{WHY.map(([t, d]) => <div key={t}><h3>{t}</h3><p>{d}</p></div>)}</div>
        <p className="co-note">A product review shows how your product works for the people who use it. It does not prove market demand, purchasing intent, clinical effectiveness, regulatory compliance, or adoption.</p>
        <p className="co-note">BTP also hosts a private community for clinical research professionals. BTP plans to use aggregated themes about recurring challenges as added context for reviews. That context is kept separate from the evidence gathered in your review. Companies never see community conversations or who said what, and nobody is presented as having reviewed a product they did not use.</p>
      </section>

      <section className="co-sec co-form" id="inquire" aria-labelledby="inq">
        <div><p className="bw-kicker">Start a conversation</p><h2 id="inq">Discuss a product review.</h2>
          <p>Tell us a little about your product. BTP will review your inquiry and contact you to discuss scope.</p>
          <p className="bw-small">Sending an inquiry does not guarantee a review, reviewer availability, or a timeline. Please do not include patient information or confidential documents.</p></div>
        <div className="bw-card"><InquiryForm /></div>
      </section>
    </main>
    <footer><span>Behind the Protocol · Fortuna Industries Inc. · <Link href="/privacy">Privacy</Link></span><Link href="/support">Contact BTP</Link></footer>
  </div>;
}
