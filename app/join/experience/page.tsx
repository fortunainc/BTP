import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { growthEnabled } from '@/lib/waitlist-growth';
import ExperienceFlow from './experience-flow';
export const metadata:Metadata={title:'Your experience | BTP',robots:{index:false,follow:false},referrer:'no-referrer'};
export const dynamic='force-dynamic';
export default function Page(){if(!growthEnabled())notFound();return <ExperienceFlow/>;}
