 'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { WAITLIST_ROLES } from '@/lib/waitlist-options';
import type { Audience } from '@/lib/signup';
const copy = {
 professional: { kicker: 'For clinical research professionals', title: 'Bring your experience into the room.', intro: 'Ask candid questions. Get practical answers from people who understand the work.', action: 'Request early access', success: 'BTP will contact you about access and any verification needed.' },
 founder: { kicker: 'For founders and product teams', title: 'Build what clinical trial teams actually need.', intro: 'Get product feedback from verified professionals who understand the work your product supports.', action: 'Discuss your product', success: 'BTP will contact you to discuss your product, reviewer fit, and next steps. No review is booked or payment due.' },
 investor: { kicker: 'For investors', title: 'Explore the business behind BTP.', intro: 'Connect with the founder and request access to the private investor room.', action: 'Request investor access', success: 'BTP will review your request and contact you about next steps. Investor room access is approved separately.' },
};
export default function WaitlistForm() {
 const params = useSearchParams();
 const initial = params.get('audience');
 const [audience, setAudience] = useState<Audience>(initial === 'founder' || initial === 'investor' ? initial : 'professional');
 const [busy, setBusy] = useState(false), [error, setError] = useState(''), [done, setDone] = useState(false);
 const [checkEmail,setCheckEmail]=useState(false);
 const c = copy[audience];
 async function submit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault(); setBusy(true); setError(''); const f = new FormData(e.currentTarget);
  try {
   const res = await fetch('/api/interest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audience, email: f.get('email'), name: f.get('name'), company: f.get('company'), request: f.get('request'), role: f.get('role'), website: f.get('website'), code: params.get('ref') || '', source: params.get('utm_source') || 'direct', paidReviewInterest: f.get('paid') === 'on', contactConsent: f.get('consent') === 'on' }) });
   const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Please try again.'); if(data.next === '/join/experience'){window.location.assign(data.next);return;} setDone(true); setCheckEmail(data.checkEmail === true);
  } catch(e) { setError(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
 }
 return <div className="bw"><header><Link href="/" className="bw-brand"><span>BTP</span><small>BEHIND<br/>THE PROTOCOL</small></Link><Link href="/sign-in">Member sign in ↗</Link></header>
 <main className="bw-grid"><section><p className="bw-kicker">{c.kicker}</p><h1>{c.title}</h1><p className="bw-lead">{c.intro}</p><p className="bw-small">{audience === 'professional' ? 'Membership is free. BTP reviews every request. Professional verification or a referral from a verified professional is required before access.' : 'No account needed. A few details, then we’ll be in touch.'}</p></section>
 <section className="bw-card" aria-labelledby="join-title">{done ? <div role="status"><p className="bw-kicker">Request received</p><h2 id="join-title">You’re on our list.</h2><p>{checkEmail ? 'Check your email for your private link to finish your profile and get your referral link.' : c.success}</p><p className="bw-small">Already submitted? Your earlier details stay saved. Need to update them? <a href="mailto:sasha@behindtheprotocol.ai">Contact Sasha</a>.</p><button onClick={() => { setDone(false); setError(''); }}>Have another interest?</button><Link href="/">Back to BTP →</Link></div> : <>
 <h2 id="join-title">Let’s connect.</h2><form onSubmit={submit}>
 <label htmlFor="audience">What brings you to BTP?</label><select id="audience" disabled={busy} value={audience} onChange={e => {setAudience(e.target.value as Audience);setError('');}}><option value="professional">Join the community</option><option value="founder">Get feedback on my product</option><option value="investor">Explore investing</option></select>
 {audience !== 'professional' && <><label htmlFor="name">Your name</label><input id="name" name="name" autoComplete="name" maxLength={120} required/></>}
 <label htmlFor="email">Your email</label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com"/>
 {audience === 'professional' ? <><small>A personal email is welcome. It is never displayed to members.</small><label htmlFor="role">Your role</label><select id="role" name="role" required defaultValue=""><option value="" disabled>Choose your role</option>{WAITLIST_ROLES.map(r => <option key={r}>{r}</option>)}</select><label className="bw-check"><input type="checkbox" name="paid"/><span>I’m interested in paid product reviews.<small>Optional. Matched to your experience, with separate consent for each opportunity.</small></span></label></> : <><label htmlFor="company">{audience === 'founder' ? 'Company or product name' : 'Firm (optional)'}</label><input id="company" name="company" autoComplete="organization" maxLength={160} required={audience === 'founder'}/></>}
 {audience === 'founder' && <><label htmlFor="request">What are you building, and what feedback would help?</label><textarea id="request" name="request" rows={3} maxLength={1200} required/><small>A sentence or two is enough. No patient information or confidential documents.</small></>}
 <div className="bw-trap" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
 <label className="bw-check"><input key={audience} type="checkbox" name="consent" required/><span>BTP may contact me about this request. <Link href="/privacy">Privacy policy</Link>.</span></label>
 {audience === 'professional' && <p className="bw-small">BTP plans to use aggregated community insights to understand shared challenges and inform research and product evaluations. Companies do not receive your private conversations or identity. <Link href="/privacy#aggregated">Learn more</Link>.</p>}
 {params.get('ref') && <p className="bw-small">Your member referral will be recorded with your request.</p>}
 {error && <p role="alert" className="bw-error">{error}</p>}<button disabled={busy}>{busy ? 'Saving…' : c.action + ' →'}</button>
 </form></>}</section></main><footer><span>Behind the Protocol · Behind The Protocol Inc.</span><Link href="/support">Contact BTP</Link></footer></div>;
}
