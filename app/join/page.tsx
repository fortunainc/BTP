import { Suspense } from 'react';
import type { Metadata } from 'next';
import WaitlistForm from './waitlist-form';
import './waitlist.css';
export const metadata: Metadata = { title: 'Request early access | Behind the Protocol', description: 'Request early access to BTP, the private community for clinical research professionals. Access reviewed by BTP.' };
export default function JoinPage() { return <Suspense fallback={<main>Loading the waitlist…</main>}><WaitlistForm /></Suspense>; }
