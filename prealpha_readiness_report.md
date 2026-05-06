# BTP Final Pre-Alpha Readiness Report

## Verdict

**3–5 OPERATOR ALPHA READY**

Behind the Protocol’s core operator loop is ready for a controlled 3–5 operator alpha after the final hardening pass. The launch should remain limited, founder-supervised, and analytics-driven. It is not yet recommended for a wider alpha because legacy inactive components still contain older forum/social language and because the project has broad lint-warning debt that should be reduced before expanding beyond a small cohort.

## Scope of this hardening pass

This hardening pass focused on making the core loop launch-ready without expanding product scope. The reviewed alpha loop includes first situation submission, redaction review, immediate feedback, reflection, structured anonymous participation, outcome reporting, honest cold-start return prompts, founder/admin visibility, and alpha KPI instrumentation.

The active surfaces reviewed and hardened were:

- `app/page.tsx`
- `app/situations/new/page.tsx`
- `app/situations/[id]/page.tsx`
- `app/insights/reflection/[id]/page.tsx`
- `app/api/situations/route.ts`
- `app/api/admin/analytics/route.ts`
- `lib/analytics-tracker.ts`
- notification and reflection routes relevant to the return loop

## 1. Anti-forum posture

Status: **Pass for active alpha surfaces**

The active operator-facing loop no longer uses forum mechanics as product affordances. The situation page uses structured interaction buttons instead of replies or public discussion threads. The UI explicitly frames operator participation as anonymous context, not social posting. Public social mechanics such as usernames, likes, votes, karma, reply chains, public exact counts, and popularity sorting are absent from the active alpha loop.

A focused scan of `app/page.tsx`, `app/situations`, `app/insights`, and `app/notifications` found only negative/guardrail references such as “No replies, profiles, names, likes, or public counts” and implementation comments documenting prohibited mechanics. These are acceptable for the active alpha because they do not create forum behavior.

Remaining risk: inactive legacy components still contain older language and mechanics, especially `components/ExecutionSignals.tsx`, `components/TrendingExecutionSignals.tsx`, and `components/BehavioralSignals.tsx`. They are not currently imported into the active alpha routes, but they should be deleted, quarantined, or rewritten before any wider alpha.

## 2. Banned user-facing language

Status: **Pass for active alpha surfaces**

The hardening pass replaced user-facing banned phrasing in the core flow. Examples include:

- “execution signals” replaced with “similar anonymous context”
- “structured intelligence” replaced with “anonymous, structured context”
- “operator signal” replaced with “operator context”
- “Strong signal” replaced with “Strong pattern”
- “Early signals” replaced with “Early indications”
- “Downstream risk signal” replaced with “Downstream risk indication”
- “Micro-opportunity signal” replaced with “Possible paid consult fit”

Internal implementation names such as schema fields or imported types were not renamed when not user-facing, to avoid unnecessary risk during a hardening-only pass.

## 3. First 30-second UX and safe-to-submit moment

Status: **Pass**

The `/situations/new` page supports a fast first action. It uses a single required text field, optional chips, an anonymity reminder, and a redaction review step. The user must confirm the sanitized version before the API creates a situation. This satisfies the safe-to-submit requirement because the operator sees the protected version before posting.

Relevant evidence:

- `app/situations/new/page.tsx` requires only the description.
- `/api/situations/review` is called before final post.
- `app/api/situations/route.ts` rejects posts without `confirmedRedaction`.
- Confirmation copy emphasizes identity protection and anonymous structured context.

## 4. Immediate feedback

Status: **Pass**

The confirmation state displays immediate feedback under “What we're seeing.” The API records `immediate_feedback_viewed` after quick reflection generation. This gives the first-time operator a visible response without waiting for a large community or implying fake activity.

Relevant evidence:

- `generateQuickReflection` is used in `app/api/situations/route.ts`.
- `EVENT_TYPES.SITUATION.IMMEDIATE_FEEDBACK_VIEWED` is tracked.
- The confirmation UI renders reflection content when present.

## 5. Curiosity notifications and return loop

Status: **Pass for controlled alpha**

The system has notification infrastructure and the hardening pass added an honest cold-start check-in path. A new return prompt is scheduled at a randomized 24–72h window using `RET-COLD-START-CHECKIN`. Its copy asks whether the situation stayed manageable, got worse, or changed shape. It does not imply peer activity.

Relevant evidence:

- `scheduleColdStartReturnPrompt` exists in `app/api/situations/route.ts`.
- Metadata includes `honestColdStart: true`.
- Metadata includes `scheduledWindow: '24_to_72_hours'`.
- Notification analytics include sent/opened/clicked events.
- Admin analytics include return-loop event summaries.

Remaining risk: production scheduling/delivery should be monitored manually in the first alpha cohort to ensure notifications actually fire as expected under real infrastructure configuration.

## 6. Structured interaction layer

Status: **Pass**

The interaction layer uses structured response types instead of public replies. Operators can add anonymous context, with optional text capped at 200 characters. The page avoids public counts and public identity.

Relevant evidence:

- Structured response buttons are rendered on `/situations/[id]`.
- UI says: “Choose a structured response. No replies, profiles, names, likes, or public counts.”
- Reflection API recognizes structured context types including `WORKED_FOR_US`, `DIDNT_HOLD_UP`, `CAUSED_OTHER_ISSUES`, `GOT_WORSE_LATER`, and `STAYED_MANAGEABLE`.

## 7. Progressive reflection

Status: **Pass**

The reflection page and API can transform structured interactions into updated anonymous context. The copy now avoids banned terms while still describing what changed around the situation.

Relevant evidence:

- `app/insights/reflection/[id]/page.tsx` was patched to use context/indication/pattern language.
- Reflection route groups structured interaction types and produces user-safe summaries.
- Situation page links to updated reflection when available.

## 8. Soft identity feedback

Status: **Pass for alpha**

The flow provides soft identity reinforcement through anonymity, context translation, and reflection language rather than public status or reputation. It avoids public identity labels, public profiles, trust scores, tiers, reputation, and profile-code matching on the homepage.

Relevant evidence:

- Profile-code matching section was removed from `app/page.tsx`.
- The homepage now includes an anonymous-only notice.
- Confirmation copy says the operator said what they could not say elsewhere and that the situation is now anonymous structured context.

## 9. Micro-opportunity priming

Status: **Pass for controlled alpha**

Micro-opportunity scanning remains connected to the situation submission route, and admin/notification paths exist for opportunity handling. User-facing reflection copy was adjusted away from “micro-opportunity signal” to “Possible paid consult fit.”

Relevant evidence:

- `scanForAggressiveTriggers` remains in `app/api/situations/route.ts`.
- Admin translation/opportunity routes exist.
- User-facing banned phrasing was replaced.

Remaining risk: because alpha is small, micro-opportunities should remain founder-reviewed and should not be over-promoted until real signal-to-noise is observed.

## 10. Honest cold-start handling

Status: **Pass**

The platform no longer needs to imply peer activity for the return loop. Cold-start return prompts are honest and individually framed. Existing founder controls support seeded/test provenance and REAL-only analytics defaults.

Relevant evidence:

- `RET-COLD-START-CHECKIN` copy does not mention other operators.
- Metadata includes `honestColdStart: true`.
- Admin analytics default to REAL-only cohorts.
- Founder controls include seeded flags, founder notes, manual trigger paths, and audit logging based on prior audit.

## 11. Founder/admin controls

Status: **Pass for 3–5 operator alpha**

Founder/admin controls are sufficient for a supervised alpha. The admin analytics route supports REAL-only defaults and return-loop metrics. Founder controls and audit logging were confirmed during audit.

Relevant evidence:

- `app/api/admin/analytics/route.ts` includes return-loop analytics.
- Admin analytics now surfaces `alphaKpis`.
- Existing controls include `isSeeded`, `founderNote`, manual trigger handling, and audit logging.

## 12. Alpha KPI instrumentation

Status: **Pass**

The hardening pass added missing KPI coverage for the alpha loop. The platform now tracks submission, immediate feedback, second submission, reflection generation/scheduling, notifications, and return behavior.

Relevant evidence:

- Added `EVENT_TYPES.SITUATION.IMMEDIATE_FEEDBACK_VIEWED`.
- Added `EVENT_TYPES.SITUATION.SECOND_SITUATION_SUBMITTED`.
- `app/api/situations/route.ts` tracks `situation_submitted`, `second_situation_submitted`, `immediate_feedback_viewed`, `reflection_generated`, and `reflection_scheduled`.
- `app/api/admin/analytics/route.ts` returns `alphaKpis`, including `situationsSubmitted`, `immediateFeedbackViewed`, `secondSubmissions`, `returnsToInteractedSituation`, and `returnRate72h` guidance.

Primary alpha KPI: **percent of submitters who return within 72 hours**.

## 13. Operator A/B/C simulation

Status: **Pass**

A written simulation artifact was created at `prealpha_operator_abc_simulation.md`.

Simulation outcomes:

- Operator A, first-time submitter: pass. Safe submission, redaction review, immediate feedback, and anonymity confirmation are present.
- Operator B, context contributor / return participant: pass. Structured anonymous context and outcome reporting are present without forum mechanics.
- Operator C, cold-start / repeat submitter: pass. Honest 24–72h check-in and second-submission tracking are present.

## 14. Typecheck, lint, and build

Status: **Pass with warnings**

The QA sequence completed successfully:

- `npm run typecheck`: completed successfully.
- `npm run lint`: completed with 0 errors and 374 warnings.
- `npm run build`: completed successfully.

Build output included a successful Prisma client generation, successful Next.js production compile, successful TypeScript build step, and successful static generation for 72 pages.

Warnings noted:

- ESLint has broad existing warning debt, mostly unused variables, `any` usage, and anonymous default exports.
- Sentry configuration uses deprecated options.
- Next.js warns that the `middleware` file convention is deprecated in favor of `proxy`.
- Upstash Redis config warnings appeared during build because URL/token environment values are missing or undefined.

These warnings do not block a 3–5 operator alpha, but they should be resolved before a wider alpha.

## Launch recommendation

Proceed with a **controlled 3–5 operator alpha** under founder supervision.

Recommended operating constraints:

- Use invited operators only.
- Review early submissions and notifications manually.
- Keep analytics REAL-only when evaluating alpha behavior.
- Monitor the 72-hour return KPI daily.
- Manually inspect any micro-opportunity before surfacing it.
- Keep legacy inactive social/forum components out of active routes.
- Do not run a wider alpha until legacy components are removed or rewritten and lint-warning debt is reduced.

## Final readiness state

The core loop is launch-ready for a small supervised alpha because it now provides a safe first submission, immediate feedback, structured anonymous interaction, honest cold-start return prompts, founder oversight, and alpha KPI tracking without public forum mechanics or banned user-facing language on active alpha surfaces.