# BTP prioritized backlog

Owner: Claude (engineering, documentation, analysis) under founder direction. Updated 2026-10-16.
Controlling vision: `docs/vision/BTP_FINAL_VISION.md`. Status labels: **Done**, **In progress**, **Needs founder** (requires founder credentials, device or decision), **Ready**.

## P0 - Trust and safety

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Credentials in a historical archive | **Done** | Archive removed from `main` (PR #7). Founder confirmed the values are not live; no rotation needed. |
| 2 | Preview/local database isolation from production | **Needs founder** | Preview APIs already fail closed. Vercel Storage > btp-production > Projects > Update Project Connection: give Preview/Development their own branch (browser automation was blocked from changing this setting). |
| 3 | Backup restoration drill and alert delivery evidence | **Needs founder** | Requires database provider and Sentry access. |
| 4 | Deletion fulfillment rehearsal across Clerk, database and vendors | **Needs founder** | Follow `docs/DELETION_FULFILLMENT.md`; use a test account, never the founder account. |
| 5 | Check historical rows for stored pre-redaction text (`Contribution.originalContent`) | **Done** | Read-only check 2026-10-16: production has 0 contributions and 0 messages, so no stored originals. |

## P1 - Member value

| # | Item | Status | Notes |
|---|---|---|---|
| 6 | Physical iPhone acceptance of build 7 | **Needs founder** | Sign-in, onboarding, ask, answer, follow, search, outcome, report, private help, deletion request, sign-out. Fictional content only. |
| 7 | Private-help consent evidence and one completed-request rehearsal | **In progress** | Matching now requires a written note of how and when each party consented (PR #10). Rehearsal still needs a real request. |
| 8 | Durable notification batching (survives restart) | **Done** | Batch counts persisted in `NotificationBatch` (PR #9). Push/email delivery still not built. |
| 9 | Mobile dependency advisories | **Done (triage)** | See `docs/MOBILE_DEPENDENCY_ADVISORIES.md`; all high findings are build/test tooling. Resolve with the next Expo SDK upgrade. |
| 10 | Next iOS build to carry Trust Center copy fix | Ready (after #6) | Source updated in PR #6. |

## P2 - Commercial and data tracks

| # | Item | Status | Notes |
|---|---|---|---|
| 11 | First research sprint / independent evaluation offer | **Done (draft)** | `docs/commercial/RESEARCH_SPRINT_OFFER.md`. Pricing is a hypothesis. |
| 12 | Prediction data design and panel pilot protocol | **Done (draft)** | `docs/data/PREDICTION_DATA_DESIGN.md`. First target still a founder choice. |
| 13 | Choose first prediction target | **Needs founder** | Candidates: activation delay, amendment implementation lag, enrollment shortfall. |
| 14 | Implement prediction-ready event fields (timestamps + permission tags) | Ready after #13 | Additive migration; no change to member experience. |
| 15 | Panel consent language reviewed by counsel | **Needs founder** | Required before recruiting paid panelists. |

## Done (recent)

- PR #11: beta blockers fixed (new accounts now provisioned as pending; ask-page loop; dashboard crash; pending-review state; member navigation and sign-out; standalone private help; admin approval shows email/role); public site and investor room updated per the 16 Oct review. See `docs/BETA_TESTER_KIT.md`.

- PR #6: canonical vision published; public, investor and in-app copy aligned; verified live 2026-10-16.
- PR #7: credential-bearing archive and stray logs removed; `*.zip` and `*.log` ignored.
