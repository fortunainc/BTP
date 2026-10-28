import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import HomeReveal from '@/components/marketing/HomeReveal';
import { decryptInvestorBrief, INVESTOR_COOKIE, investorConfig } from '@/lib/investor-auth';
import { logInvestorActivity, roomViewer } from '@/lib/investor-access';
import envelope from '@/data/investor-brief.encrypted.json';
import { headers } from 'next/headers';
import { recordTraffic } from '@/lib/traffic';
import TrafficBeacon from '@/components/TrafficBeacon';
import { CONTACT, Gate, shell } from './ui';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata: Metadata = { title:'BTP | Private investor room', description:'Private investor briefing. Access by invitation.', robots:{index:false,follow:false,nocache:true} };

const ERRORS: Record<string, string> = { access: 'That password did not work. Please try again.', email: 'Please enter a valid email address.', link: 'That link has expired. Enter your email for a new one.' };

export default async function Investors({searchParams}: {searchParams:Promise<{error?:string; sent?:string}>}) {
  const token = (await cookies()).get(INVESTOR_COOKIE)?.value;
  const configured = !!investorConfig() && process.env.VERCEL_ENV !== 'preview';
  const viewer = configured ? await roomViewer(token) : null;
  if (!viewer) {
    const params = await searchParams;
    return <Gate>
      <TrafficBeacon path="/investors" />
      <div className="eyebrow">By invitation</div>
      <h1><span className="ln l1">The investor</span><span className="ln l2"><span className="g">room.</span></span></h1>
      <p className="sub">The business behind BTP: the problem, the model, the first product and where the company stands today. For prospective investors.</p>
      <div className="gcard reveal in">
        {params.error && <p role="alert" className="gerr">{ERRORS[params.error] ?? ERRORS.access}</p>}
        {!configured ? <p role="status">Private access is being prepared. Please contact BTP for an invitation.</p>
          : params.sent ? <p role="status" className="gsent">Thank you. If your email is approved, your private link is on its way. If not, BTP has your request and will be in touch.</p>
          : <>
            <form method="post" action="/investors/request">
              <label htmlFor="email">Your email</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
              <label htmlFor="name">Name and firm</label><input id="name" name="name" type="text" autoComplete="organization" maxLength={120} placeholder="Optional" />
              <button className="btn gold" type="submit">Request access <span aria-hidden>→</span></button>
            </form>
            <details className="gpw"><summary>Have an access password?</summary>
              <form method="post" action="/investors/access"><label htmlFor="password">Access password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} /><button className="btn gold" type="submit">Enter the room <span aria-hidden>→</span></button></form>
            </details>
          </>}
        <p>Access is personal and approved by BTP. Please do not forward links or briefing material. Questions? <a href={CONTACT}>Contact BTP</a>.</p>
      </div>
    </Gate>;
  }
  let brief;
  try { brief = decryptInvestorBrief(envelope); } catch {
    return <Gate><div className="eyebrow">Investor room</div><h1><span className="ln l1">Briefing temporarily unavailable.</span></h1><p className="sub">Please <a href={CONTACT} style={{color:'#e8cc94'}}>contact BTP</a>. Your password has not been displayed or logged.</p></Gate>;
  }
  await recordTraffic('investor_room_view', await headers(), '/investors');
  await logInvestorActivity(viewer, 'room');
  // Authored, encrypted briefing layout; only decrypted after a valid investor session.
  return <div className={shell} data-sentry-block data-sentry-mask>
    <div dangerouslySetInnerHTML={{ __html: brief.html ?? '' }} />
    <HomeReveal scope=".ir" />
    <Link className="droomLink" href="/investors/diligence">Data room <span aria-hidden>→</span></Link>
  </div>;
}
