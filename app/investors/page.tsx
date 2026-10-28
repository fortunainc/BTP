import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Newsreader, Inter, Cormorant_Garamond } from 'next/font/google';
import HomeReveal from '@/components/marketing/HomeReveal';
import { decryptInvestorBrief, INVESTOR_COOKIE, investorConfig, validInvestorSession } from '@/lib/investor-auth';
import envelope from '@/data/investor-brief.encrypted.json';
import { headers } from 'next/headers';
import { recordTraffic } from '@/lib/traffic';
import TrafficBeacon from '@/components/TrafficBeacon';
import './room.css';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata: Metadata = { title:'BTP | Private investor room', description:'Private investor briefing. Access by invitation.', robots:{index:false,follow:false,nocache:true} };

const serif = Newsreader({ subsets: ['latin'], axes: ['opsz'], variable: '--font-newsreader', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const signet = Cormorant_Garamond({ subsets: ['latin'], weight: '500', style: 'italic', variable: '--font-cormorant', display: 'swap' });
const shell = `ir ${serif.variable} ${sans.variable} ${signet.variable}`;
const CONTACT = 'mailto:fortunaindustriesinc@gmail.com?subject=BTP%20investor%20room%20access';

// Fixed (not random) drifting particles so server output is stable.
const BOKEH = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  const s = 2 + r(1) * 7;
  return { width: s, height: s, left: `${50 + r(2) * 50}%`, top: `${r(3) * 100}%`, animationDuration: `${6 + r(4) * 10}s`, animationDelay: `${-r(5) * 12}s` };
});

function Gate({ children }: { children: React.ReactNode }) {
  return <div className={shell} data-sentry-block data-sentry-mask>
    <header className="hero gate">
      <div className="bokeh" aria-hidden="true">{BOKEH.map((st, i) => <i key={i} style={st} />)}</div>
      <div className="grain" aria-hidden="true" /><div className="vignette" aria-hidden="true" />
      <div className="wrap">
        <nav><Link className="logo" href="/"><span className="mono">BTP</span><span>BEHIND<br />THE PROTOCOL</span></Link>
          <div className="navlinks"><Link href="/">Home</Link><Link className="pill" href="/sign-in">Member sign in ↗</Link></div></nav>
        <div className="heroBody">{children}</div>
      </div>
    </header>
    <footer><div className="wrap">Behind the Protocol · Fortuna Industries Inc. · <Link href="/privacy" style={{color:'inherit'}}>Privacy</Link> · <Link href="/support" style={{color:'inherit'}}>Support</Link></div></footer>
  </div>;
}

export default async function Investors({searchParams}: {searchParams:Promise<{error?:string}>}) {
  const token = (await cookies()).get(INVESTOR_COOKIE)?.value;
  const configured = !!investorConfig() && process.env.VERCEL_ENV !== 'preview';
  if (!configured || !validInvestorSession(token)) {
    const params = await searchParams;
    return <Gate>
      <TrafficBeacon path="/investors" />
      <div className="eyebrow">By invitation</div>
      <h1><span className="ln l1">The investor</span><span className="ln l2"><span className="g">room.</span></span></h1>
      <p className="sub">The business behind BTP: the problem, the model, the first product and where the company stands today. For prospective investors.</p>
      <div className="gcard reveal in">
        {params.error && <p role="alert" className="gerr">Access could not be verified. Check your password and try again.</p>}
        {configured
          ? <form method="post" action="/investors/access"><label htmlFor="password">Investor access password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} /><button className="btn gold" type="submit">Enter the room <span aria-hidden>→</span></button></form>
          : <p role="status">Private access is being prepared. Please contact BTP for an invitation.</p>}
        <p>Need access? <a href={CONTACT}>Contact BTP</a>. Access expires after eight hours. Please do not forward your password or briefing material.</p>
      </div>
    </Gate>;
  }
  let brief;
  try { brief = decryptInvestorBrief(envelope); } catch {
    return <Gate><div className="eyebrow">Investor room</div><h1><span className="ln l1">Briefing temporarily unavailable.</span></h1><p className="sub">Please <a href={CONTACT} style={{color:'#e8cc94'}}>contact BTP</a>. Your password has not been displayed or logged.</p></Gate>;
  }
  await recordTraffic('investor_room_view', await headers(), '/investors');
  // Authored, encrypted briefing layout; only decrypted after a valid investor session.
  return <div className={shell} data-sentry-block data-sentry-mask>
    <div dangerouslySetInnerHTML={{ __html: brief.html ?? '' }} />
    <HomeReveal scope=".ir" />
  </div>;
}
