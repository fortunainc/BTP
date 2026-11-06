import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { growthEnabled } from '@/lib/waitlist-growth';
import ExperienceFlow from '../experience/experience-flow';
export const metadata:Metadata={title:'Your early access | BTP',robots:{index:false,follow:false},referrer:'no-referrer'};
export const dynamic='force-dynamic';
export default function Page(){if(!growthEnabled())notFound();return <ExperienceFlow initialProgress/>;}
