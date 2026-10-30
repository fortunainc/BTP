import { Suspense } from 'react';
import type { Metadata } from 'next';
import WaitlistForm from './waitlist-form';
import './waitlist.css';
export const metadata: Metadata = { title: 'Join the waiting list | Behind the Protocol', description: 'Join BTP as a clinical research professional or register founder interest in product reviews.' };
export default function JoinPage() { return <Suspense fallback={<main>Loading the waitlist…</main>}><WaitlistForm /></Suspense>; }
