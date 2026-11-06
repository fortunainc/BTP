# Public acquisition analytics

PostHog project 714460 uses the capped Free plan, no card. Its public write-only project token is intentionally shipped in the browser; it does not read data or administer the account.

Public traffic dashboard: https://us.posthog.com/project/714460/web
BTP requests and conversion counts: https://behindtheprotocol.ai/admin/traffic
Private signup records: https://behindtheprotocol.ai/admin/requests

## Boundaries

Only public homepage, startups, join, support and privacy page views are sent. Community, admin, investor room and authentication pages are excluded. Experience questionnaire sends only a completion event, represented as /join, never answers or private URLs. Names, emails, referral codes, tokens and form text are not sent. Session replay, autocapture, heatmaps, surveys and feature flag requests are off. PostHog cookieless tracking is enabled in both project settings and code. IP storage is disabled in project settings. Unique visitors are estimates; cookieless identities do not provide a permanent person history or geographic breakdown.

Visiting an admin route or authenticating as an admin marks that browser internal using btp_internal=1. Other devices, incognito windows and cleared browsers are not automatically known to be internal. Visit the admin dashboard on each testing device before browsing marketing pages. Browser DNT/GPC also suppresses events. Historic counters cannot be accurately separated into real versus internal traffic retroactively and remain labeled historical.

Campaign attribution keeps the first landing source for the current tab session. Use links such as:
https://behindtheprotocol.ai/?utm_source=linkedin&utm_medium=social&utm_campaign=operator_launch
https://behindtheprotocol.ai/companies?utm_source=linkedin&utm_medium=outreach&utm_campaign=founder_pilots
Never put personal names, emails or confidential information into campaign tags.

Conversions: community_signup, founder_request, investor_request, experience_completed. Server acquisition events are deduplicated by event and request key; existing signup retries do not become new conversions. Private database signup records remain authoritative. Analytics can be blocked by browsers or lost on network failure and is not a census. No historical signups are backfilled as new traction. No database schema changes.

## Search foundations

Public sitemap: /sitemap.xml. Public robots rules: /robots.txt. Explicit canonical links on the five public pages. Organization/WebSite structured data on homepage; Service on startups page. Private areas have noindex headers in addition to their existing access checks. robots.txt is not an access control.

Google verification token on homepage is public. Search Console setup must be verified after deployment and the sitemap submitted. Indexing, rankings and citations by AI systems are not guaranteed. Next growth work is original, useful public educational material; private community conversations must never become search content automatically.
