import { Suspense } from 'react';
import type { Metadata } from 'next';
import WaitlistForm from './waitlist-form';
import './waitlist.css';
export const metadata: Metadata = { title: 'Join BTP | Behind the Protocol', description: 'Join the BTP waitlist for clinical research professionals. Ask peers, share what works, and optionally hear about paid product reviews.' };
export default function JoinPage() { return <Suspense fallback={<main>Loading the waitlist…</main>}><WaitlistForm /></Suspense>; }
