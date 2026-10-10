# BTP Product Constitution

**Status:** Controlling source of truth for the BTP beta  
**Objective:** Ship a useful mobile beta as quickly as possible without rebuilding working infrastructure or drifting into a broader platform.

## 1. Mission

BTP is the trusted place where people across the clinical-trial ecosystem help each other safely.

## 2. Core promise

> Ask the clinical-trial question you cannot Google or comfortably ask at work. Get practical answers from verified people who have handled similar situations.

## 3. The beta has one job

Help a clinical-trial professional get a useful answer to a specific operational question.

The core loop is:

**Ask → Answer → Apply → Report what happened**

Everything built for beta must make that loop easier, safer, faster, or more likely to repeat.

## 4. Initial users

BTP serves the clinical-trial ecosystem across sites, CROs, sponsors, vendors, regulatory, quality, data, safety, and related functions.

The initial density wedge is:

- Clinical research coordinators and site regulatory staff
- Site managers and investigators
- CRAs and monitors
- CTMs, project managers, and clinical operations professionals

The prompt remains broad:

> **What question do you need help answering?**

It must not be restricted to “clinical operations,” because site and cross-functional questions may not use that label.

## 5. Beta product

BTP will be an invite-only mobile app for verified members. The existing web application remains the backend, founder/admin console, and public landing page.

### Mobile navigation

1. **Home** — questions needing the member's experience and meaningful updates
2. **Questions** — browse, search, filter, follow, and answer
3. **Ask BTP** — the primary action
4. **Activity** — answers, clarifications, followed-case updates, and outcomes
5. **You** — verification, expertise, privacy, and notification settings

### Required beta capabilities

- Invite-only account creation and professional verification
- Identity-protected participation using generalized role labels
- Question drafting, automatic redaction, and user approval
- Members-only question feed and case details
- Experience-based answers
- Safe clarification when an answer needs more context
- Follow a case
- Notifications for relevant questions and meaningful case changes
- “Did this help?” feedback on answers
- “What happened?” outcome from the asker
- Basic search and role/topic filtering
- Report content and founder moderation
- Private-help request
- Founder-mediated expert matching

## 6. Private help and monetization

The free community helps users understand and approach a problem. When a problem requires dedicated time or labor, a user may request private help.

Beta flow:

1. User selects **Get private help**.
2. User chooses consultation, written review, document/workflow review, or defined project help.
3. BTP reviews and sanitizes the request.
4. BTP invites one or two relevant, opted-in experts.
5. The expert accepts or declines privately.
6. BTP facilitates the introduction and agreed scope.
7. Completion and private feedback are recorded.

During beta, matching may be manual. Payment may also be handled manually or through a simple payment link. A fully automated marketplace is not required to validate demand.

BTP earns revenue from a transparent fee on paid assistance. Asking, answering, following cases, and reporting outcomes remain free.

## 7. Safety rules

BTP is a professional-help community, not a whistleblower, emergency-reporting, or study-document platform.

Members must not submit:

- Patient names, initials, dates of birth, records, images, or other patient-identifying information
- Sponsor, CRO, site, vendor, or individual names
- Protocol numbers or confidential protocol language
- Confidential documents, screenshots, or unpublished study results
- Urgent safety reports or named allegations of misconduct

BTP will:

- Warn users before submission
- Automatically flag and redact likely identifiers
- Let the user approve the safer version
- Allow members to report content
- Give the founder simple tools to hide, restore, or remove content
- Direct urgent safety, suspected misconduct, and mandatory-reporting matters to appropriate official channels

BTP verifies identity privately but does not promise absolute anonymity. Public-facing language should use **identity-protected**, **pseudonymous**, or **verified privately** where precision matters.

These safeguards should help members ask useful questions. They should not make ordinary participation burdensome.

## 8. Data principles

- Collect only what is needed to verify, route, answer, moderate, and improve cases.
- Keep verification identity separate from community activity wherever practical.
- Do not sell identifiable member activity or ordinary community conversations.
- Paid research or sponsored participation requires separate, explicit opt-in.
- Members must be able to correct or remove content when appropriate.
- The audit ledger may preserve proof that an event occurred, but must not permanently preserve readable sensitive content or direct user identifiers.
- Resolved cases may become reusable knowledge only in a generalized, privacy-safe form.

## 9. Engagement without gimmicks

BTP should give members reasons to return because something useful happened.

Approved return loops:

- **Needs your experience** — a relevant unanswered question
- **Someone answered your question**
- **A case you follow changed**
- **What happened?** — request the real outcome
- **Your answer helped** — private impact receipt
- **Across the table** — learn how another role approached the same situation

Avoid infinite scrolling, popularity contests, public leaderboards, follower counts, streak pressure, and engagement bait.

## 10. Use what is already built

### Reuse

- PostgreSQL and Prisma data layer
- Clerk authentication foundation
- User onboarding and verification infrastructure
- Question creation and sanitization preview
- Redaction and correlation-risk checks
- Written answers and structured context
- Outcomes and follow-up logic
- Notification infrastructure
- Private-help request model
- Moderation, verification, safety, and founder analytics tools
- Existing marketplace models as dormant future infrastructure

### Modify

- Convert member-facing language from situations/contributions to questions/cases
- Make question content available only to approved members
- Adapt authentication for mobile tokens
- Replace the dashboard with a personalized mobile home
- Add following, answer helpfulness, clarification, and outcome UX
- Redesign the ledger so sensitive content is not immutable
- Simplify verification during invite-only beta

### Hide, do not delete

- Generic job board and applications
- Public operator profiles
- Opportunity scores and capability dashboards
- Hiring fees and broad workforce exchange
- Enterprise intelligence and buyer-facing analytics

## 11. Explicitly deferred

These are not beta requirements:

- Biotech/pharma news feed
- Conference and event directory
- Training and certifications
- General networking or open direct messages
- Automated expert marketplace
- Public professional profiles
- Paid panels and sponsored questions
- Enterprise dashboards
- Aggregate industry intelligence products
- Public launch outside the invite-only cohort

They may be added only after the core help loop works and members demonstrate demand.

## 12. Beta success criteria

The initial validation cohort is approximately 25–50 verified professionals.

BTP shows meaningful validation when:

- At least 20 authentic questions are submitted
- At least 60% receive a useful answer within 48 hours
- At least 30% of askers return to report an outcome
- Members answer questions without repeated founder prompting
- At least 3–5 users request deeper private help

The primary metric is:

> **Percentage of questions receiving a useful answer within 48 hours.**

## 13. Anti-drift rule

Before adding a feature, answer:

1. Does it help someone ask safely?
2. Does it improve the likelihood or quality of an answer?
3. Does it help close the loop with a real outcome?
4. Does it create aligned revenue from additional work rather than exploiting trust?

If the answer is no to all four, it does not belong in the beta.

## 14. Build directive

- Build a new Expo/React Native member app.
- Preserve the existing web backend and admin tools.
- Fix only the backend issues required for a safe, functional beta.
- Prefer simple founder-operated workflows over premature automation.
- Deliver working builds to a real phone early and iterate from actual use.
- Do not rebuild functioning infrastructure for architectural neatness.

The beta is complete when a verified member can ask safely, receive and apply a useful answer, report what happened, and request deeper private help when needed.
