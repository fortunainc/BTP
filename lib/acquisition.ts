/** Public campaign metadata only. Never accept signup fields, referral codes or arbitrary URLs. */
export const PUBLIC_PATHS = ['/', '/companies', '/join', '/privacy', '/support'] as const;
export const ANALYTICS_DASHBOARD = 'https://us.posthog.com/project/714460/web';
export function publicPath(path: string) { return (PUBLIC_PATHS as readonly string[]).includes(path); }
export function campaignValue(value: unknown): string | undefined {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9 _-]{0,79}$/.test(value) ? value : undefined;
}
export function externalReferrer(value: string): string | undefined {
  try { const u = new URL(value); return /^https?:$/.test(u.protocol) && !/(^|\.)(behindtheprotocol\.ai|btp-rho-seven\.vercel\.app)$/.test(u.hostname) ? u.hostname : undefined; } catch { return undefined; }
}
export type Attribution = { source: string; medium?: string; campaign?: string; content?: string; landing: string; referrer?: string };
export function attributionFrom(url: string, referrer = ''): Attribution {
  const u = new URL(url); const ref = externalReferrer(referrer);
  // Old internal CTA tags describe placement, not acquisition channels.
  const source = campaignValue(u.searchParams.get('utm_source'));
  return { source: source && !['startups', 'companies', 'investors', 'homepage'].includes(source) ? source : ref || 'direct', medium: campaignValue(u.searchParams.get('utm_medium')), campaign: campaignValue(u.searchParams.get('utm_campaign')), content: campaignValue(u.searchParams.get('utm_content')), landing: publicPath(u.pathname) ? u.pathname : '/join', referrer: ref };
}
export function internalBrowser() {
  if (typeof window === 'undefined') return true;
  return document.cookie.split(';').some(c => c.trim() === 'btp_internal=1') || navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}
export function markInternalBrowser() { document.cookie = 'btp_internal=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure'; }
export function getAttribution(): Attribution {
  const current = attributionFrom(location.href, document.referrer);
  try {
    const saved = sessionStorage.getItem('btp_acquisition');
    if (saved) {
      const prior = JSON.parse(saved) as Attribution;
      if (campaignValue(prior.source) || prior.source === externalReferrer('https://' + prior.source)) return prior;
    }
    sessionStorage.setItem('btp_acquisition', JSON.stringify(current));
  } catch { /* Storage is optional; forms continue to work. */ }
  return current;
}
