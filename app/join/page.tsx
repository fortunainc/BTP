import { Suspense } from 'react';
import type { Metadata } from 'next';
import WaitlistForm from './waitlist-form';
import './waitlist.css';
export const metadata: Metadata = { alternates: { canonical: '/join' }, title: 'Connect with BTP | Behind the Protocol', description: 'Join the community, request product feedback, or explore investing in BTP.' };
export default function JoinPage() { return <Suspense fallback={<main>Loading the waitlist…</main>}><WaitlistForm /></Suspense>; }
