import Link from 'next/link';
import { Newsreader, Inter, Cormorant_Garamond } from 'next/font/google';
import './room.css';

const serif = Newsreader({ subsets: ['latin'], axes: ['opsz'], variable: '--font-newsreader', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const signet = Cormorant_Garamond({ subsets: ['latin'], weight: '500', style: 'italic', variable: '--font-cormorant', display: 'swap' });
export const shell = `ir ${serif.variable} ${sans.variable} ${signet.variable}`;
export const CONTACT = 'mailto:fortunaindustriesinc@gmail.com?subject=BTP%20investor%20room%20access';

// Fixed (not random) drifting particles so server output is stable.
const BOKEH = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  const s = 2 + r(1) * 7;
  return { width: s, height: s, left: `${50 + r(2) * 50}%`, top: `${r(3) * 100}%`, animationDuration: `${6 + r(4) * 10}s`, animationDelay: `${-r(5) * 12}s` };
});

export function Gate({ children }: { children: React.ReactNode }) {
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

