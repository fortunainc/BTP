# State of the codebase

Updated 2026-10-17. A short orientation for a technical partner.

## What exists

A working beta: a Next.js web app and an Expo iOS app on one backend (Vercel, PostgreSQL via Prisma, Clerk). Membership approval, moderation, questions and answers, outcomes, private help, notifications, reactions, polls and founder admin tools are live. CI runs typecheck, lint, 47 tests, critical-path scripts, a dependency audit and mobile checks on every change. Architecture: `docs/ARCHITECTURE.md`. Product direction: `docs/vision/BTP_FINAL_VISION.md`.

## Built for beta scale, upgrade as usage grows

| Today | Later |
|---|---|
| Reactions stored in the audit log; polls stored as contributions and interactions (no migration needed) | Dedicated reaction and poll tables |
| Notifications created in-app and batched | Push and email delivery with preferences |
| Legacy modules from earlier product directions (switched off) | Remove once usage confirms they're not needed |

## Next engineering priorities

1. iOS build with reactions and polls.
2. Push and email notifications.
3. The aggregate pipeline behind the members brief, Site Operations Index and Enrollment Reality Report, enforcing the release rules in the vision.
4. Separate preview database (Vercel setting).

Owned by Fortuna Industries Inc.
