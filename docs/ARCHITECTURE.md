# BTP architecture

Updated 2026-10-17. One shared backend serves the web app and the iOS app.

```
 iOS app (Expo / React Native)        Web app (Next.js App Router)
        |  Clerk session, Bearer token        |  Clerk session cookie
        +---------------+---------------------+
                        v
          Next.js API routes (app/api/*), deployed on Vercel
          - middleware.ts: Clerk, dormant-route redirects, preview API guard
          - lib/api-auth.ts withAuth(): identity -> member record -> suspension
            check -> write rate limit -> route handler
                        v
          PostgreSQL (Neon) via Prisma 7
```

## Identity and access

| Layer | Implementation |
|---|---|
| Sign-in | Clerk (web cookie; mobile bearer token via `/api/mobile/session`) |
| Member record | Created on first authenticated request as **Pending** (`lib/member-provisioning.ts`) with a random handle and the Clerk email (admin-only) |
| Approval | Separate admin step at `/admin/verifications`; `isApprovedMember()` gates community APIs (`lib/access-policy.ts`) |
| Roles | `userRole` (operator, admin, founder); founding responders flagged by `isFoundingOperator` |
| Display identity | Handle plus broad verified role label (`lib/role-label.ts`); real name, employer and email are never shown to members |
| Writes | Per-user write budget stored in Postgres (`ApiRateLimit`, `lib/write-rate-limit.ts`) |

## Core data model (Prisma)

| Model | Holds |
|---|---|
| `User` | Account, role, verification status, handle, email (admin-only) |
| `Contribution` | Questions (`question`, `situation`) and polls (`poll`, options in `relatedContext`) with tumor area, phase, issue category; auto-redacted text |
| `Interaction` | Answers (`ANSWER`), structured context, poll votes (`POLL_VOTE`); one per user per type per contribution |
| `ContributionOutcome` / `ContributionFollowUp` | What happened later |
| `AuditLog` | Admin and security audit trail; also stores answer reactions (helpful, same here, saved, it worked) |
| `Notification`, `NotificationBatch` | In-app and push notifications; batching survives restarts |
| `PrivateHelpRequest` | Private help intake, matching with recorded consent evidence, feedback |
| `KnowledgeLedgerEvent` | Content-free, append-only, hash-sequenced record of events |
| `AccountDeletionRequest` | Deletion requests |

Dormant workforce and marketplace models (`JobPosting`, `Application`, `Hire`, `FeeRecord`, `MicroOpportunity`, etc.) remain in the schema; their routes return 404 and their pages redirect (see `middleware.ts`).

## Privacy and safety mechanisms

- **Redaction** of identifying details on every post and answer (`lib/redaction.ts`); high-risk posts go to review instead of publishing.
- **Bucketed timestamps** in member-facing views (`lib/anti-correlation.ts`).
- **No reporting tasks**; aggregate release rules (minimum group size, coarse categories, time lag, suppression) apply before any external use (vision section 3).
- **Moderation and reports**: `/admin/moderation`, `/api/reports`.
- **Investor room**: AES-256-GCM ciphertext in `data/investor-brief.encrypted.json`; server-only key `BTP_INVESTOR_KEY`; password checked against a scrypt hash; session cookie (`lib/investor-auth.ts`).

## Engagement layer (`lib/engagement.ts`)

- Answer reactions with counts; only the asker can mark "it worked", which notifies the helper.
- Faster, role-labelled answer alerts (`lib/operator-return-loop.ts`).
- Founding responders alerted on new visible questions.
- Instant-reveal polls (breakdown shown only after at least 5 votes); newest poll is the daily question.
- Admin metrics at `/admin/engagement` (`lib/engagement-metrics.ts`).

## Key routes

| Area | Web pages | APIs |
|---|---|---|
| Community | `/situations`, `/situations/new`, `/situations/[id]`, `/polls`, `/help`, `/notifications` | `/api/situations*`, `/api/answers/[id]/*`, `/api/polls*`, `/api/help-requests`, `/api/notifications*` |
| Onboarding | `/sign-up`, `/onboarding` | `/api/user/*` |
| Admin | `/admin/verifications`, `/admin/moderation`, `/admin/help-requests`, `/admin/engagement`, `/admin/polls`, `/admin/analytics` | `/api/admin/*` |
| Public | `/`, `/privacy`, `/support`, `/investors` | `/investors/*` |

## Mobile (`mobile/`)

Expo Router app; API client in `mobile/lib/api.ts` calls the same API routes with a Clerk bearer token. Released through EAS to TestFlight (invitation only).

## Delivery

- **CI** (`.github/workflows/quality.yml`): Prisma validate, typecheck, lint, Vitest, beta-critical and return-loop scripts, production dependency audit; mobile typecheck and Expo dependency check.
- **Deploy**: Vercel; merges to `main` go to production. Preview builds block API access until an isolated preview database exists.
- **Migrations**: Prisma migrations in `prisma/migrations`; applied with `prisma migrate deploy`. Never `db push` or seed against production.
- **Monitoring**: Sentry configuration present; live alert delivery not yet verified.
