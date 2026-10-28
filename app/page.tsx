import type { Metadata } from 'next';
import { Newsreader, Inter, Cormorant_Garamond } from 'next/font/google';
import HomeReveal from '@/components/marketing/HomeReveal';
import TrafficBeacon from '@/components/TrafficBeacon';
import { HOME_HTML } from '@/components/marketing/home-markup';
import './home.css';

export const metadata: Metadata = { title: 'BTP | Clinical trial experience, connected.', description: 'Behind the Protocol connects clinical-trial professionals to practical peer experience, operational discussions, and private help.' };

const serif = Newsreader({ subsets: ['latin'], axes: ['opsz'], variable: '--font-newsreader', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const signet = Cormorant_Garamond({ subsets: ['latin'], weight: '500', style: 'italic', variable: '--font-cormorant', display: 'swap' });

export default function HomePage() {
  return (
    <div className={`bh ${serif.variable} ${sans.variable} ${signet.variable}`}>
      {/* Approved static design; content is authored in home-markup.ts, never user supplied. */}
      <div dangerouslySetInnerHTML={{ __html: HOME_HTML }} />
      <HomeReveal /><TrafficBeacon path="/" />
    </div>
  );
}
