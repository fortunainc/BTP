'use client';
import { useEffect } from 'react';

/** Sends one cookie-free page-view count for this page. */
export default function TrafficBeacon({ path }: { path: string }) {
  useEffect(() => {
    const body = JSON.stringify({ path });
    if (!navigator.sendBeacon?.('/api/track', body)) void fetch('/api/track', { method: 'POST', body, keepalive: true }).catch(() => undefined);
  }, [path]);
  return null;
}
