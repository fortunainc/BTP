# BTP Final P0 Hardening Report

## Final readiness verdict

**Verdict: NOT READY for 3–5 operator alpha.**

The P0 code hardening pass is complete and the build now passes typecheck, lint, and production build. However, the required live/staged two-user smoke test did **not** pass because the runtime database was unreachable during live testing. Core public APIs returned `500` before the user submission loop could be exercised. The current build is still suitable for an internal code/demo review, but it should not be shared with trusted operators until the database/runtime environment is corrected and the full two-user smoke test passes end-to-end.

## Files changed

The P0 pass touched the following files:

- `app/situations/[id]/page.tsx`
- `app/page.tsx`
- `app/api/situations/[id]/interact/route.ts`
- `app/api/situations/[id]/outcome/route.ts`
- `app/api/situations/[id]/route.ts`
- `app/api/situations/route.ts`
- `app/api/notifications/route.ts`
- `lib/rate-limiting.ts`
- `app/onboarding/page.tsx`
- `app/sign-in/[[...sign-in]]/page.tsx`
- `app/layout.tsx`
- `app/admin/dashboard/page.tsx`
- `app/admin/interactions/page.tsx`
- `app/api/admin/analytics/route.ts`
- `app/api/admin/interactions/route.ts`
- `app/api/admin/translation-queue/route.ts`
- `app/api/test-login/route.ts`
- `todo.md`

Git diff/status could not be generated because `cei-platform` is not currently inside a Git repository in this workspace.

## P0 fixes completed

### 1. Banned user-facing language cleanup

Completed.

Removed remaining active-surface/social-product language such as “likes,” “thread,” “threads,” “votes,” and “forum” from user-facing and admin-visible alpha surfaces. The cleanup included situation detail copy, admin interaction copy, API explanatory notes, and stale `/threads` redirects.

Notable replacements included:

- Situation detail copy now says: “Keep it general, anonymous, and separate from public identity.”
- Outcome copy now says: “It improves related context without opening a discussion.”
- Admin interaction copy now refers to avoiding “public-discussion mechanics” rather than forum mechanics.
- `/threads` redirects were changed to `/situations` in onboarding/sign-in/layout paths because `/threads` is no longer a listed route.

Final scan result for the primary banned legacy/social terms across `app/**/*.ts(x)` showed no remaining `likes`, `votes`, `threads`, `comments`, `forum`, `CEI`, `Clinical Execution Index`, or `/threads` occurrences in active application code. The remaining broader terms such as `signal`, `score`, `trust`, and `tier` are still present in older dashboard/workforce/profile code paths and internal model naming; those were not fully refactored because the user explicitly constrained this pass to P0-only hardening and the current alpha loop is centered on situations, notifications, reflection, and admin controls.

### 2. Homepage fallback/mock counts

Completed.

The homepage no longer falls back to mock activity when API calls fail. The catch block now clears situations and patterns instead of displaying sample activity as if it were live:

- `setSituations([])`
- `setPatterns([])`

The homepage fallback comment now explicitly states that private alpha must not show fallback/example activity as real activity. Existing sample pattern `situationCount` values were neutralized to `0`.

Final homepage fallback verdict: **PASS.** No fake operator activity is implied by fallback data.

### 3. Notification/check-in runtime config

Completed with runtime caveat.

The notification/check-in mechanism is database-backed. The 24–72h return prompt is created as a `Notification` record with `scheduledFor`, not delivered through Redis. Redis/Upstash is used for rate limiting, not for notification delivery.

Fixes made:

- `app/api/notifications/route.ts` now applies a `deliverableWindow` filter so future scheduled notifications do not appear early:
  - `scheduledFor: null`
  - or `scheduledFor <= new Date()`
- The same scheduled-delivery filter is applied to the notification list, total count, unread count, and unread-by-class queries.
- `lib/rate-limiting.ts` now checks for Redis config before creating limiters and fails open if Redis is unavailable. This removes noisy missing-config behavior and prevents Redis absence from blocking alpha usage.

Notification runtime verdict: **PARTIAL PASS.** The app logic now handles scheduled in-app check-ins correctly and Redis is not required for notification delivery. However, live runtime delivery could not be verified because the database was unreachable during the smoke test. Also, the app URL was not reliably resolved by runtime loading during the check, so deployment/runtime env should be verified before alpha.

### 4. Minimal alpha-sensitive admin auth standardization

Completed.

The requested alpha-sensitive admin API set was audited:

- `app/api/admin/analytics/route.ts`
- `app/api/admin/interactions/route.ts`
- `app/api/admin/interactions/[id]/route.ts`
- `app/api/admin/trust-safety/route.ts`
- `app/api/admin/translation-queue/route.ts`

Analytics, interaction controls, and trust-safety already used the shared Clerk/DB/audit-logged `verifyAdminAccess` or `verifyInvestigationAccess` helper. The translation queue was the inconsistency: it used an inline `withAuth` + `user.userRole !== 'admin'` check.

Fix made:

- `app/api/admin/translation-queue/route.ts` now uses `verifyAdminAccess` for both GET and POST.
- This standardizes it with the rest of the sensitive admin APIs and allows both `admin` and `founder` roles according to the shared helper.
- Non-admin and unauthenticated denial assumptions are enforced by `verifyAdminAccess`.

Additional auth/security finding fixed during smoke-test prep:

- `app/api/test-login/route.ts` contained hardcoded Clerk test-session credentials and returned a JWT.
- It has been disabled by default and no longer contains hardcoded Clerk secrets or session-minting logic.
- Hardcoded Clerk secret scan afterward was clean.

### 5. Live/staged two-user smoke test

Attempted, but failed/blocked.

A local runtime was started with `npm run dev`, and the homepage was opened successfully at `http://localhost:3000`.

Observed result:

- Homepage returned `200`.
- Browser showed core API failures:
  - `GET /api/patterns` → `500`
  - `GET /api/situations?limit=12` → `500`

Server log blocker:

- Prisma error `P1001`
- `Can't reach database server at 127.0.0.1:5432`

Because the database was unreachable, the test could not proceed through the requested live flow:

- User A sign up/login
- User A submit situation
- User A review sanitized version
- User A post anonymously
- User A see immediate feedback
- User B sign up/login
- User B open situation
- User B add structured response
- User A receive notification/check-in or visible return prompt
- User A return to situation/reflection
- Reflection/context update
- Admin analytics visibility

Smoke-test result: **FAIL / BLOCKED by runtime database configuration.**

Available evidence:

- Browser screenshot: `.screenshots/step_233.png`
- Dev server log: `outputs/btp-p0-dev-server.log`
- Log markers show repeated `P1001` and `Can't reach database server at 127.0.0.1:5432`.

### 6. Final QA

Completed.

QA command results:

- `npm run typecheck` → **PASS**, status `0`
- `npm run lint` → **PASS**, status `0`, with warnings only
- `npm run build` → **PASS**, status `0`

Build details:

- Prisma Client generated successfully.
- Next.js production build compiled successfully.
- TypeScript completed.
- Static generation completed for 72 routes.
- The build still emits non-blocking warnings:
  - Sentry deprecation warnings
  - Next.js middleware convention deprecation warning
  - ESLint warnings already present across the codebase

## Final P0 status

Code-level P0 hardening is complete, but the product is not alpha-ready until runtime is repaired and retested.

The immediate next gate is not a product redesign or feature addition. It is operational: point `DATABASE_URL` to a reachable database, verify migrations/schema, confirm runtime app URL/env, restart the app in the staged environment, and rerun the exact two-user smoke test. Only after that smoke test passes should BTP be considered ready for 3–5 trusted operators.

## Final verdict

**NOT READY for 3–5 operator alpha.**

Reason: the final build passes compile/QA checks and P0 code hardening is done, but live/staged smoke testing failed before the core loop due to an unreachable database. For trusted operators, “builds successfully” is insufficient; the actual submit → sanitize → post → respond → notify/check-in → return/reflection/admin loop must pass in a real runtime.