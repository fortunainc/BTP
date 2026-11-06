'use client';
import { getAttribution, internalBrowser, publicPath } from '@/lib/acquisition';
import type { PostHog } from 'posthog-js';
// Public, write-only project token. It grants no read or administrative access.
const TOKEN = 'phc_ym42wPCvpAReu7yVYTT3UCcpvNc6JsmMVP2GwoURiPU4';
let client: Promise<PostHog> | undefined;
let permitted = false;
export function permitAnalytics(value: boolean) { permitted = value; }
function allowed() { return permitted && location.hostname === 'behindtheprotocol.ai' && !internalBrowser() && (publicPath(location.pathname) || location.pathname === '/join/experience'); }
const eventNames = new Set(['$pageview', 'community_signup', 'founder_request', 'investor_request', 'experience_completed']);
// Rebuild the property bag from an allowlist: SDK defaults can otherwise contain private URL queries.
const safeKeys = new Set(['token','distinct_id','$lib','$lib_version','$browser','$browser_version','$os','$os_version','$device_type','$screen_height','$screen_width','$viewport_height','$viewport_width','$process_person_profile','$cookieless_mode','$current_url','$pathname','$host','$referrer','$referring_domain','utm_source','utm_medium','utm_campaign','utm_content','audience']);
async function sdk() {
  client ??= import('posthog-js').then(({ default: ph }) => {
    ph.init(TOKEN, {
      api_host: 'https://us.i.posthog.com', ui_host: 'https://us.posthog.com',
      cookieless_mode: 'always', person_profiles: 'never',
      autocapture: false, capture_pageview: false, capture_pageleave: false,
      disable_session_recording: true, disable_surveys: true, capture_heatmaps: false,
      capture_performance: false, advanced_disable_flags: true,
      before_send: event => {
        if (!event || !allowed() || !eventNames.has(event.event)) return null;
        const properties = Object.fromEntries(Object.entries(event.properties).filter(([key]) => safeKeys.has(key)));
        return { ...event, properties };
      },
    });
    return ph;
  });
  return client;
}
export async function marketingEvent(event: string, audience?: 'professional' | 'founder' | 'investor') {
  if (!allowed() || !eventNames.has(event)) return;
  const path = publicPath(location.pathname) ? location.pathname : '/join';
  if (event === '$pageview' && !publicPath(location.pathname)) return;
  const a = getAttribution();
  try {
    const ph = await sdk();
    if (!allowed()) return;
    ph.capture(event, {
      $current_url: 'https://behindtheprotocol.ai' + path, $pathname: path, $host: 'behindtheprotocol.ai',
      $referrer: a.referrer ? 'https://' + a.referrer : '', $referring_domain: a.referrer || '$direct',
      utm_source: a.source, utm_medium: a.medium, utm_campaign: a.campaign, utm_content: a.content,
      ...(audience ? { audience } : {}),
    }, { transport: 'sendBeacon', send_instantly: true });
  } catch { /* Analytics must never block signup or navigation. */ }
}
