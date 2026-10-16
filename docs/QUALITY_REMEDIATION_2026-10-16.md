# October 16 quality remediation

This record supersedes the original audit only where evidence below establishes a fix. Code, database deployment, web deployment, native build and device acceptance are separate release gates. The repository remains public; credentials and member data must remain outside it.

## Implemented in this change

- F02: Disabled the legacy public pattern endpoint. Member data must not be exported through it.
- F03–F04: Unified founder/admin/approved-member access policy. Either suspension field denies access. Administrative status changes update both fields. Founder controls now work in the web auth context as well as the API. Privacy requests are the explicit suspension exception.
- F05: Correction and incomplete outcomes no longer count as helpful or positive impact. Migration corrects existing records. Resolution and validation retain their separate meanings.
- F07: Authenticated writes use a shared PostgreSQL rate budget with an atomic increment and fail-closed behavior. Administrative wrappers also enforce a budget. No Redis credential is required. Read-only requests do not consume this budget.
- F08: Disabled legacy OTP endpoints which did not provide durable verification. Removed the associated work-email code step from onboarding. Clerk sign-in and professional membership approval remain separate.
- F09: Private help now permits standalone intake. Mobile includes interview preparation. The founder operations queue supports review, matching, mutually consented assignment, completion and closure, with a member-visible update and sequenced ledger event. Members can submit private feedback once a request is completed. Consent must be obtained externally before checking the confirmation; the UI does not obtain consent by itself.
- F10: Return Engine delivery persists in-app notifications rather than only logging them. This does not implement push/email delivery or make its in-memory batching durable.
- F11: Search runs server-side across question titles, descriptions and topics. Cursor pagination reaches beyond the first page. Search no longer promises professional-role filtering that the API does not supply.
- F12: Mobile supports email-code sign-in and authenticator, phone and backup-code challenges when enabled in Clerk. Unsupported factors receive an actionable error. Live Clerk/device testing remains necessary.
- F13: Authenticated, idempotent deletion-request submission replaces the mailto-only mobile action. Founder queue exposes pending requests. Actual fulfillment is manual and remains a release/operations requirement.
- F14: Public landing copy describes the actual invite-only beta, removes invented adoption counts and absolute anonymity guarantees, and does not present a protected API failure as an empty community.
- F15: History-refresh errors preserve previous results and expose retry instead of replacing history with an empty state.
- F16: Added CI for type checking, lint, isolated route/database tests, existing behavioral checks, web production dependency audit, and Expo compatibility. Tests exercise auth denial, suspension, fail-closed limiting, concurrent limits, migration behavior, help transitions and ledger sequencing.
- Predictive-model integrity: The unused ClinicalTrials.gov helper explicitly labels its phase estimates as unvalidated heuristics. Completion/results no longer imply success; no efficacy probability is returned. A validated prediction product is still unbuilt.

## Dependency and validation limits

The web production dependency audit was zero after updating Next/React and compatible dependencies. Mobile remains on Expo SDK 54 with the current compatible patch and PostCSS security override. Remaining advisories require separately reviewed upgrades or upstream patches; do not run `npm audit fix --force` (it suggested an Expo downgrade). An iOS bundle export is not a native build or a device test.

The newer lint preset introduces React Compiler migration diagnostics on legacy screens. They remain warnings, explicitly configured; React Compiler is not enabled. Existing hook rules remain active. A passing lint command does not mean all lint debt is resolved.

## Remaining gates, owners and acceptance evidence

| Finding | Remaining work | Acceptance evidence |
| --- | --- | --- |
| F01 | Review unresolved mobile tooling/runtime dependency chains; plan a tested SDK upgrade | Updated audit plus a clean native build and device regression test |
| F06/F12 | Expo CLI authorization, clean-source iOS build, TestFlight processing, member testing | Build ID linked to exact commit; successful password/email/MFA, question, answer, follow, outcome, report, help and sign-out tests on iPhone |
| F09 | Real operator ownership, consent evidence, response targets, and a completed-help feedback rehearsal | A consented request taken through completion and feedback without exposing identities publicly |
| F10 | Durable batching and optional push/email delivery, consent and preference enforcement | Restart-safe delivery tests and delivery receipts; no claim of push/email until then |
| F13 | Fulfill deletion requests across Clerk, database, logs and backups | Verified deletion/anonymization record following the operations runbook |
| F17 | Separate preview/development database, verify backup restoration and monitoring | Independent connection targets, recovery drill and received test alert |
| Prediction product | Define initial operational target, rights/consent, labels, evaluation and permissible uses | Time-split validation against a simple baseline, calibration and subgroup analysis, leakage audit, model/version provenance |

Preview API access now fails closed unless `BTP_PREVIEW_DATABASE_ISOLATED=true`. Set that flag only after independently verifying its database target; public static preview pages remain available. This prevents the shared database from being used by preview APIs while isolation is pending.

Production environment metadata shows database configuration shared across Production, Preview and Development. Production and restored local database URLs were compared privately and match. Some production secrets cannot be exported; their existence is not proof of working integration. A Sentry DSN is configured in Production/Preview; alert delivery and recovery are unverified.

## Deployment order

1. Run tests and a production build. Review this migration on an isolated PostgreSQL engine.
2. Apply `20261016_beta_quality_controls` to the verified production target before deploying code that uses its tables. The additive schema is backward compatible with the prior application.
3. Deploy the reviewed commit; check signed-out boundaries and an approved member flow. Do not seed test data into the shared database.
4. Build iOS from a clean checkout of the release commit. Record its exact SHA, EAS ID and TestFlight build number.
5. Use designated test members for the device acceptance matrix; do not use a founder session as evidence of member isolation.

Rollback: restore the prior application deployment if needed. Keep additive tables/columns intact; do not automatically reverse the migration or delete requests. Restrict new writes if incident triage requires it. Reconcile any post-deploy member submissions before another rollout.

## Verification recorded October 16

- Web and mobile TypeScript checks passed.
- Prisma schema validation and production build passed.
- 21 isolated quality tests passed; existing beta-critical and return-loop checks passed.
- Lint: zero errors, 381 warnings (including newly visible compiler diagnostics). Warning debt remains.
- Expo SDK dependency check passed; iOS Hermes bundle and assets exported successfully.
- Local HTTP checks: landing/privacy/support 200; signed-out situations/session/admin-help/deletion 401; legacy patterns 404.
- Production migration `20261016_beta_quality_controls` applied successfully. Pre-migration aggregate checks found zero help requests and zero outcomes; no existing member submissions were altered.
- Web production audit: zero advisories. Mobile production audit: 39 advisories (22 high, 17 moderate); several are build-tool transitive chains and some have no published patch. Native dependency findings remain tracked separately; a zero web audit is not a whole-product security certification.
