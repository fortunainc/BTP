# State of the codebase

Updated 2026-10-17. Written for a prospective CTO: an honest account of what is solid, what is expedient, and what the role would own.

## Summary

BTP is a working beta: a Next.js web app and an Expo iOS app on one backend, with authentication, membership approval, moderation, private help, notifications and an engagement layer. It has strong privacy intent and reasonable test and CI discipline for its stage. It also carries history: the product pivoted several times, and dormant code and schema from earlier directions remain. There are no live members yet, so nothing has been tested under real load or real community behavior.

## Solid

| Area | Evidence |
|---|---|
| Access control | Approval gate on community APIs (the patterns endpoint was found open in the 17 Oct review and fixed); suspension checks; admin roles; tested in `tests/access-routes.test.ts` |
| New-member provisioning | Pending record on first request (`lib/member-provisioning.ts`), tested |
| Privacy design | Redaction, bucketed timestamps, handle plus broad role only, no reporting tasks, aggregate release rules in the vision |
| Private help | Intake, admin queue, matching requires written consent evidence, member feedback; tested |
| Investor room | Encrypted content, server-only key, scrypt password hash; tested |
| CI | Typecheck, lint, 47 Vitest tests, critical-path scripts, dependency audit, mobile checks on every change |
| Documentation | Controlling vision, backlog, architecture, contributor rules |

## Expedient (works now; revisit with scale)

| Item | Why it was done | Better long-term option |
|---|---|---|
| Answer reactions stored in `AuditLog` | Shipped without a schema migration | A dedicated `Reaction` table with indexes |
| Polls stored as `Contribution` rows; votes as `Interaction` rows | Same | Dedicated `Poll` / `PollVote` tables |
| Notifications created inline in API handlers | Simple | A queue / worker for delivery, retries and push |
| Push and email delivery | Notifications are created and batched; delivery channels not fully wired | Expo push + Resend email with preferences |
| Reactions lack a uniqueness constraint and `AuditLog` lacks indexes for reaction lookups | Counts are de-duplicated in code; fine at beta scale | Dedicated table with a unique index |
| Large legacy `lib/` (66 modules) | Earlier directions (matching, signal scoring, reflection engines) | Remove unused modules after usage audit |

## Known gaps and risks

| Gap | Status |
|---|---|
| Preview / development share the production database | Preview APIs blocked by middleware; needs a separate Neon branch in Vercel (founder setting) |
| End-to-end sign-up test with a brand-new account | Not yet run |
| Backup restore drill and alert delivery (Sentry) | Not yet verified |
| Deletion fulfillment across Clerk, database and vendors | Runbook exists (`docs/DELETION_FULFILLMENT.md`); not rehearsed |
| Dormant workforce / marketplace code and schema | Routes 404, pages redirect; should be removed or isolated |
| Mobile dependency advisories (build tooling only) | Documented in `docs/MOBILE_DEPENDENCY_ADVISORIES.md`; resolve with next Expo SDK |
| iOS app lacks reactions and polls | Next EAS build |
| Load, abuse and re-identification testing | Not done; required before scale |

## What a CTO would own (first 90 days)

1. **Reliability and safety baseline**: isolated preview database, restore drill, alerting, deletion rehearsal, end-to-end tests of the member journey.
2. **Simplify**: remove dormant modules and schema; replace expedient storage (reactions, polls) with proper tables.
3. **Delivery**: push and email notifications with preferences; the iOS build with engagement features.
4. **Data foundations**: the aggregate pipeline that enforces release rules (minimum group size, coarse categories, time lag, suppression) for the members brief, Site Operations Index and Enrollment Reality Report.
5. **Hiring and practices**: code review, release process, security review, privacy threat model.

## Ownership

Source code and documentation are owned by Fortuna Industries Inc. (see `LICENSE`). The repository is public by founder decision; it contains no credentials, member data or plaintext investor material.
