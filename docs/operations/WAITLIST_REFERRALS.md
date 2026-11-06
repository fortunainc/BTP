# Waitlist experience and referrals

Approved flow, November 5, 2026: community signup, optional-to-complete experience questionnaire, then personal referral sharing. Founder and investor requests keep their existing separate paths. The questionnaire is offered to every community signup; paid review participation is optional.

## Credit and access

A new community signup attributed to a public `wl_` referral code earns its referrer one credit when the questionnaire is complete. Email confirmation and professional verification do not gate credit. Repeat submissions and edits do not add credits. Existing members and self referrals do not generate credit. BTP membership verification and invitations remain separate.

The admin queue sorts by completed referrals, then original signup time. Public progress shows counts, not invented queue positions or other people's identities. Admins can exclude or restore a suspicious referral with an audited reason without changing membership access.

## Tracking

Open `/admin/waitlist-growth` for priority, referral attribution and progress, private profiles, paid review interest, filters and CSV export. `/admin/waitlist` retains professional verification and invitations. `/admin/requests` retains the combined request inbox.

Experience data uses version 1 stable category IDs, up to five expertise areas, involvement and recency for each, product categories, required therapeutic experience and separate paid interest. Profiles are self reported. They are not credential verification or authorization for a paid engagement.

## Private access

Public referral links only attribute a signup. They do not open a private profile. New signups get a scoped HTTP-only seven-day session. Existing email submissions receive a private return email instead of a new browser session. Return tokens are hashed at rest, expire after 24 hours, travel in the URL fragment and require an explicit confirmation before exchange. They are single use. The email provider has a 15-minute send cooldown. Preview deployments do not send these emails.

## Rollout and recovery

The additive `20261105_waitlist_growth` migration is in the existing production build migration runner. It preserves previous waitlist records. `WAITLIST_GROWTH_ENABLED=false` disables the new public flow and uses the previous signup behavior without deleting collected data. No changes to member access or investor approval are included.

## Dummy tests

`npm run test:quality` covers schema constraints and an additive migration replay. `scripts/test-waitlist-growth.ts` exercises real route handlers and PostgreSQL with dummy example.com addresses. It refuses any database other than the isolated loopback fixture at port 55435 named `btp_growth_test` and disables email sends. It tests attribution, credit, duplicate and concurrent submissions, private access, token replay/expiry, audience separation and overview counts. Never point this script at production.
