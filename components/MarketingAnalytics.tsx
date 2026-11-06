'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { getAttribution, internalBrowser, markInternalBrowser, publicPath } from '@/lib/acquisition';
import { marketingEvent, permitAnalytics } from '@/lib/marketing-analytics';
export default function MarketingAnalytics() {
  const path = usePathname(); const { loading, isAdmin } = useAuth(); const last = useRef('');
  useEffect(() => {
    if (isAdmin || path.startsWith('/admin')) markInternalBrowser();
    const enabled = !loading && !isAdmin && !internalBrowser() && (publicPath(path) || path === '/join/experience');
    permitAnalytics(enabled);
    if (!enabled || !publicPath(path) || last.current === path) return;
    last.current = path;
    const attribution = getAttribution();
    void marketingEvent('$pageview');
    const body = JSON.stringify({ path, referrer: attribution.referrer });
    if (!navigator.sendBeacon?.('/api/track', body)) void fetch('/api/track', { method: 'POST', body, keepalive: true }).catch(() => undefined);
    return () => permitAnalytics(false);
  }, [path, loading, isAdmin]);
  return null;
}
