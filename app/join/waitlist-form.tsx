 'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { WAITLIST_ROLES } from '@/lib/waitlist-options';
export default function WaitlistForm() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [done, setDone] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        email: f.get('email'), role: f.get('role'), website: f.get('website'), code: params.get('ref') || '',
        source: params.get('utm_source') || 'direct', paidReviewInterest: f.get('paid') === 'on', contactConsent: f.get('consent') === 'on'
      }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Please try again.'); setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'We could not save your request. Your details are still here. Please try again.'); } finally { setBusy(false); }
  }
  return <div className="bw"><header><Link href="/" className="bw-brand"><span>BTP</span><small>BEHIND<br/>THE PROTOCOL</small></Link><Link href="/sign-in">Member sign in ↗</Link></header>
    <main className="bw-grid"><section><p className="bw-kicker">For clinical research professionals</p><h1>Bring your experience <em>into the room.</em></h1>
    <p className="bw-lead">Join the early community of clinical research professionals sharing candid questions, practical answers, and lessons from the work.</p>
    <p className="bw-small">BTP reviews every request before granting access. Professional verification, or a referral from a verified member, is part of that review. Your email is never displayed to members.</p></section>
    <section className="bw-card" aria-labelledby="join-title">{done ? <div role="status"><p className="bw-kicker">Request received</p><h2 id="join-title">Your request is in.</h2><p>BTP will contact you about access and any verification needed. Thank you for helping build a community around the people doing the work.</p><p>Already on the list? Your original request stays in place. Contact BTP if you need to update it.</p><Link href="/">Explore BTP →</Link></div> : <>
    <p className="bw-kicker">Reviewed access</p><h2 id="join-title">Request early access</h2><p>A few details, then we’ll be in touch.</p>
    <form onSubmit={submit}><label htmlFor="email">Your email</label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com"/><small>A personal email is welcome.</small>
    <label htmlFor="role">Your role</label><select id="role" name="role" required defaultValue=""><option value="" disabled>Choose your role</option>{WAITLIST_ROLES.map(r => <option key={r}>{r}</option>)}</select>
    <div className="bw-trap" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
    <label className="bw-check"><input type="checkbox" name="paid"/><span>I’m interested in paid product reviews matched to my experience.<small>Optional. Each opportunity has its own scope and consent.</small></span></label>
    <label className="bw-check"><input type="checkbox" name="consent" required/><span>BTP may contact me about my access request and interests. <Link href="/privacy">Privacy policy</Link>.</span></label>
    <p className="bw-small">BTP plans to use aggregated community insights to understand shared challenges and inform research and product evaluations. Companies do not receive your private conversations or identity. <Link href="/privacy#aggregated">Learn more</Link>.</p>
    {params.get('ref') && <p className="bw-small">You arrived through a member referral. We’ll check that it is active when you submit.</p>}
    {error && <p role="alert" className="bw-error">{error}</p>}<button disabled={busy}>{busy ? 'Saving…' : 'Request early access →'}</button>
    <p className="bw-small">No account needed to request access. Paid reviews are optional and separate from community membership.</p></form></>}</section></main>
    <footer><span>Behind the Protocol · Behind The Protocol Inc.</span><Link href="/support">Contact BTP</Link></footer></div>;
}
