# Operator waitlist

The public entry point is `/join`. The homepage links there. The form asks for email and role, with separate optional interest in paid product reviews. Joining is not professional verification, research consent, or community access.

Verified members get their existing personal link at `/invite`. `/join/<code>` opens the same form with referral attribution. The server checks the referrer on submission and again before an invitation. First submission retains its attribution and preferences; public duplicate submissions cannot overwrite another person's data.

The founder uses `/admin/waitlist` to see requests, filter paid review interest, record professional verification, send account invitations, inspect referral totals and export CSV. Direct requests need a recorded professional verification before invitation. Active approved member referrals are the alternative route. Existing account approval remains in place; referral is visible to the founder during member approval and can support the existing member endorsement method. Members see only their own referral totals.

Invitations are sent only when the founder presses Send invitation and confirms the recipient. The invitation action is disabled in previews. No messages are sent merely by joining the list. The form confirmation says the request was received, not that an email was sent.

## Deployment

Production builds apply the additive, repeatable migration in `20261030_operator_waitlist` through the existing production migration script. Previews continue to block API data access unless an isolated preview database is configured. No additional vendor or environment variable is required.

## Validation

Production build and TypeScript pass. The quality suite covers waitlist validation, consent preservation, origin checks, inactive referrals, protected export, invitation eligibility, rate limits, and CSV escaping. A PGlite test applies the migration twice and verifies existing referral records remain intact. The public page was visually inspected locally. Local checks do not send invitations or write to production.

## Tracking boundaries

Signup, invitation and account creation are distinct. Account creation is not a verified member count. Referral tables measure attributed signups, not link clicks. The source field accepts short campaign labels via `utm_source`; do not put personal information in campaign links. Existing signups are preserved, with missing role shown honestly.

## Founder interest (October 30)
`/join?audience=founder&utm_source=sinclair` opens the founder/product-team waiting list. `/join` also exposes the audience selector. Founder requests use the existing role field and store explicit contact permission under the existing first-submission-wins rules. They do not create accounts, confer membership, retain a member referral or opt into being a paid reviewer. Admin filters identify founder interest and the API blocks membership verification/invitations for these entries. The companies page offers this shorter route alongside its detailed inquiry. No schema migration or new credential is needed. Existing requests remain unchanged; a repeat public submission does not change the original audience.
