import type { Metadata } from 'next';
import { Newsreader, Inter, Cormorant_Garamond } from 'next/font/google';
import HomeReveal from '@/components/marketing/HomeReveal';
import { HOME_HTML } from '@/components/marketing/home-markup';
import './home.css';

export const metadata: Metadata = { verification: { google: 'Z85_jWDrV20eKAhf-CewHfEgnOzLl39VeYZxF7p9L4w', other: { 'msvalidate.01': '266440768EC647164F26D19C9A279366' } }, alternates: { canonical: '/' }, title: 'BTP | Clinical trial experience, connected.', description: 'A private, verified community for coordinators, CRAs and clinical research teams. Access reviewed by BTP.' };

const serif = Newsreader({ subsets: ['latin'], axes: ['opsz'], variable: '--font-newsreader', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const signet = Cormorant_Garamond({ subsets: ['latin'], weight: '500', style: 'italic', variable: '--font-cormorant', display: 'swap' });

export default function HomePage() {
  return (
    <div className={`bh ${serif.variable} ${sans.variable} ${signet.variable}`}>
      {/* Approved static design; content is authored in home-markup.ts, never user supplied. */}
      <div dangerouslySetInnerHTML={{ __html: HOME_HTML }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', '@id': 'https://behindtheprotocol.ai/#organization', name: 'Behind The Protocol Inc.', url: 'https://behindtheprotocol.ai', email: 'sasha@behindtheprotocol.ai' }, { '@type': 'WebSite', name: 'Behind The Protocol', url: 'https://behindtheprotocol.ai', publisher: { '@id': 'https://behindtheprotocol.ai/#organization' } }] }) }} />
      <HomeReveal />
    </div>
  );
}
