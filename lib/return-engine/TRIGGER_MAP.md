# BTP Return Engine - Trigger Map

## Overview

This document maps every trigger event in the Return Engine to its source in the BTP codebase, showing exact integration points and data flow.

---

## Trigger Event Sources

### 1. CONTRIBUTION TRIGGERS

#### POST_CREATED
**Source:** `app/api/situations/route.ts` (POST handler)
**When:** User submits a new contribution
**Integration Point:** After `prisma.contribution.create()`

```typescript
// In app/api/situations/route.ts
import { onPostCreated } from '@/lib/return-engine/integration';

// After successful contribution creation:
await onPostCreated({
  contributionId: contribution.id,
  userId: user.id,
  contributionType: contribution.contributionType,
});
```

**Notification Generated:** None immediately (state tracking only)
**State Updated:** `PostStateRecord` tracks initial contribution state

---

### 2. INTERACTION TRIGGERS

#### SEEN_THIS_BEFORE
**Source:** `app/api/contributions/[id]/interactions/route.ts`
**When:** User marks a contribution as "Seen this before"
**Integration Point:** After `prisma.interaction.create()` with type `SEEN_TOO`

```typescript
import { onSeenThisBefore } from '@/lib/return-engine/integration';

// After interaction created:
await onSeenThisBefore({
  contributionId: contribution.id,
  authorId: contribution.userId,
  interactorId: user.id,
  interactorTrustWeight: trustWeight,
  confirmationCount: await getConfirmationCount(contribution.id),
});
```

**Notifications Generated:**
- VAL-01: "Someone with experience confirmed your post" (first confirmation)
- VAL-02: "Another experienced operator confirmed your post" (unique second)
- VAL-03: "Your post is forming a pattern" (3+ confirmations)
- VAL-05: "A highly trusted operator confirmed your post" (high trust weight)

---

#### THIS_IS_ACCURATE
**Source:** `app/api/contributions/[id]/interactions/route.ts`
**When:** User marks a contribution as "This is accurate"
**Integration Point:** After `prisma.interaction.create()` with type `ACCURATE`

```typescript
import { onThisIsAccurate } from '@/lib/return-engine/integration';

await onThisIsAccurate({
  contributionId: contribution.id,
  authorId: contribution.userId,
  confirmerId: user.id,
  confirmerTrustWeight: trustWeight,
});
```

**Notifications Generated:**
- VAL-05: "A highly trusted operator confirmed your post"

---

#### THIS_WORKED
**Source:** `app/api/contributions/[id]/interactions/route.ts`
**When:** User marks a solution as "This worked"
**Integration Point:** After `prisma.interaction.create()` with type `SOLUTION_WORKED`

```typescript
import { onThisWorked } from '@/lib/return-engine/integration';

await onThisWorked({
  contributionId: contribution.id,
  authorId: contribution.userId,
  confirmerId: user.id,
});
```

**Notifications Generated:**
- EXP-03: "Your solution helped someone resolve an issue"

---

#### DIDNT_WORK
**Source:** `app/api/contributions/[id]/interactions/route.ts`
**When:** User marks a solution as "Didn't work"
**Integration Point:** After `prisma.interaction.create()` with type `SOLUTION_FAILED`

```typescript
import { onDidntWork } from '@/lib/return-engine/integration';

await onDidntWork({
  contributionId: contribution.id,
  authorId: contribution.userId,
  reporterId: user.id,
  context: contextText,
});
```

**Notifications Generated:**
- EXP-03: "New feedback on your solution - come see what worked differently"

---

#### ADD_CONTEXT
**Source:** `app/api/contributions/[id]/interactions/route.ts`
**When:** User adds context to a contribution
**Integration Point:** After `prisma.interaction.create()` with type `ADD_CONTEXT`

```typescript
import { onAddContext } from '@/lib/return-engine/integration';

await onAddContext({
  contributionId: contribution.id,
  authorId: contribution.userId,
  contextAuthorId: user.id,
  contextSnippet: contextText,
});
```

**Notifications Generated:**
- EXP-01: "Someone added context to your post"

---

#### DIFFERENT_CAUSE
**Source:** `app/api/contributions/[id]/interactions/route.ts`
**When:** User indicates a different cause
**Integration Point:** After `prisma.interaction.create()` with type `DIFFERENT_CAUSE`

```typescript
import { onDifferentCause } from '@/lib/return-engine/integration';

await onDifferentCause({
  contributionId: contribution.id,
  authorId: contribution.userId,
  reporterId: user.id,
  alternativeCause: differentCauseText,
});
```

**Notifications Generated:**
- EXP-02: "New perspective on your post - another cause identified"

---

### 3. PATTERN STATE TRIGGERS

#### PATTERN_FORMING
**Source:** `lib/pattern-detection.ts` (pattern detection job)
**When:** Pattern detection identifies a forming pattern (3+ confirmations)
**Integration Point:** After pattern state update

```typescript
import { onPatternForming } from '@/lib/return-engine/integration';

// In pattern detection job
await onPatternForming({
  patternId: pattern.id,
  contributorIds: pattern.contributors,
  domain: pattern.domain,
  confirmationCount: pattern.confirmations,
});
```

**Notifications Generated:**
- VAL-04: "Your contributions are forming a recognized pattern"

---

#### PATTERN_CONNECTED
**Source:** `lib/pattern-detection.ts`
**When:** Two patterns are linked/connected
**Integration Point:** After pattern connection created

```typescript
import { onPatternConnected } from '@/lib/return-engine/integration';

await onPatternConnected({
  patternId: newPattern.id,
  connectedPatternId: existingPattern.id,
  contributorIds: overlappingContributors,
});
```

**Notifications Generated:**
- EXP-10: "Your pattern connected to a broader insight"

---

### 4. MOMENTUM TRIGGERS

#### TRUST_INCREASED
**Source:** `lib/trust-vector.ts` in `updateTrustVector()`
**When:** User's trust vector score increases significantly
**Integration Point:** After trust vector update with positive change

```typescript
import { onTrustIncreased } from '@/lib/return-engine/integration';

// In updateTrustVector() after successful update
if (newScore > previousScore + 0.05) { // 5% threshold
  await onTrustIncreased({
    userId: userId,
    previousScore: previousScore,
    newScore: newScore,
    dimension: dimensionName,
  });
}
```

**Notifications Generated:**
- MOM-01: "Your reliability score moved up"

---

#### TIER_IMPROVED
**Source:** `lib/signal-score.ts` in `calculateAccessTier()`
**When:** User's access tier improves (TIER_3 → TIER_2 → TIER_1)
**Integration Point:** After tier recalculation

```typescript
import { onTierImproved } from '@/lib/return-engine/integration';

// After tier calculation
if (newTier !== previousTier && isHigherTier(newTier, previousTier)) {
  await onTierImproved({
    userId: userId,
    previousTier: previousTier,
    newTier: newTier,
  });
}
```

**Notifications Generated:**
- MOM-02: "You've moved to a higher access tier"

---

#### ACCESS_PRIORITY_UP
**Source:** `lib/opportunity-scarcity.ts`
**When:** User gains priority access to opportunities
**Integration Point:** After priority change detected

```typescript
import { onAccessPriorityUp } from '@/lib/return-engine/integration';

await onAccessPriorityUp({
  userId: userId,
  domain: domain,
  newPriorityLevel: priorityLevel,
});
```

**Notifications Generated:**
- MOM-04: "You now have priority access to opportunities"

---

#### DOMAIN_STRENGTHENED
**Source:** `lib/trust-vector.ts`
**When:** User's domain expertise score increases
**Integration Point:** After domain relevance update

```typescript
import { onDomainStrengthened } from '@/lib/return-engine/integration';

await onDomainStrengthened({
  userId: userId,
  domain: domain,
  newScore: domainScore,
});
```

**Notifications Generated:**
- MOM-05: "Your expertise in [domain] is now recognized"

---

### 5. PRESSURE TRIGGERS

#### OPPORTUNITY_MISSED_CLOSE
**Source:** `lib/opportunity-scarcity.ts` in `checkMissedOpportunities()`
**When:** User missed an opportunity by small margin
**Integration Point:** During opportunity window close check

```typescript
import { onOpportunityMissedClose } from '@/lib/return-engine/integration';

await onOpportunityMissedClose({
  userId: userId,
  opportunityId: opportunity.id,
  opportunityTitle: opportunity.title,
  marginType: 'time', // or 'tier'
});
```

**Notifications Generated:**
- PRE-01: "An opportunity you watched was just filled"

---

#### OPPORTUNITY_MISSED_ACCESS
**Source:** `lib/opportunity-scarcity.ts`
**When:** User couldn't access opportunity due to tier
**Integration Point:** When opportunity expires before user could see it

```typescript
import { onOpportunityMissedAccess } from '@/lib/return-engine/integration';

await onOpportunityMissedAccess({
  userId: userId,
  opportunityId: opportunity.id,
  requiredTier: opportunity.requiredTier,
  currentTier: userTier,
});
```

**Notifications Generated:**
- PRE-03: "An opportunity opened up — but you didn't have access yet"

---

#### INACTIVITY_WARNING
**Source:** Scheduled job (cron)
**When:** User inactive for 14+ days
**Integration Point:** Inactivity check job

```typescript
import { onInactivityWarning } from '@/lib/return-engine/integration';

// In scheduled job
const inactiveUsers = await findInactiveUsers(14); // 14 days
for (const user of inactiveUsers) {
  await onInactivityWarning({
    userId: user.id,
    inactiveDays: 14,
  });
}
```

**Notifications Generated:**
- PRE-04: "You haven't been around in a while — things are changing"

---

#### TIER_PROXIMITY_BELOW
**Source:** `lib/signal-score.ts`
**When:** User close to dropping a tier
**Integration Point:** After tier calculation with proximity check

```typescript
import { onTierProximityBelow } from '@/lib/return-engine/integration';

// After tier calculation
if (isCloseToTierBoundary(userScore, currentTier, 'below')) {
  await onTierProximityBelow({
    userId: userId,
    currentTier: currentTier,
    proximityScore: distanceToBoundary,
  });
}
```

**Notifications Generated:**
- PRE-05: "You're close to losing your current access level"

---

### 6. OPPORTUNITY TRIGGERS

#### OPPORTUNITY_RELEASED
**Source:** `lib/opportunity-scarcity.ts` in `releaseOpportunity()`
**When:** New opportunity becomes visible to user's tier
**Integration Point:** After opportunity visibility calculation

```typescript
import { onOpportunityReleased } from '@/lib/return-engine/integration';

await onOpportunityReleased({
  opportunityId: opportunity.id,
  userId: userId,
  opportunityTitle: opportunity.title,
  fitScore: matchScore,
  exclusiveWindow: true,
});
```

**Notifications Generated:**
- OPP-01: "A new opportunity matches your profile"

---

#### OPPORTUNITY_MOVING_FAST
**Source:** `lib/matching.ts` or scheduled job
**When:** Opportunity has high interest/activity
**Integration Point:** Interest count threshold check

```typescript
import { onOpportunityMovingFast } from '@/lib/return-engine/integration';

await onOpportunityMovingFast({
  opportunityId: opportunity.id,
  userId: userId,
  interestCount: interestCount,
  timeSincePosted: hoursSincePosted,
});
```

**Notifications Generated:**
- OPP-02: "An opportunity you might like is moving fast"

---

#### OPPORTUNITY_DOMAIN_MATCH
**Source:** `lib/matching.ts`
**When:** Opportunity matches user's domain expertise
**Integration Point:** After match scoring

```typescript
import { onOpportunityDomainMatch } from '@/lib/return-engine/integration';

await onOpportunityDomainMatch({
  opportunityId: opportunity.id,
  userId: userId,
  domain: userDomain,
  matchScore: matchScore,
});
```

**Notifications Generated:**
- OPP-03: "A [domain] opportunity just opened"

---

### 7. HIRING TRIGGERS

#### MATCH_CREATED
**Source:** `lib/matching.ts` in `createMatch()`
**When:** New match created between operator and opportunity
**Integration Point:** After match creation

```typescript
import { onMatchCreated } from '@/lib/return-engine/integration';

await onMatchCreated({
  matchId: match.id,
  operatorId: operatorId,
  opportunityId: opportunityId,
  organizationId: organizationId,
});
```

**Notifications Generated:**
- OPP-04: "You've been matched to an opportunity"

---

#### INTEREST_EXPRESSED
**Source:** `app/api/applications/route.ts`
**When:** Operator expresses interest in opportunity
**Integration Point:** After application created

```typescript
import { onInterestExpressed } from '@/lib/return-engine/integration';

await onInterestExpressed({
  applicationId: application.id,
  operatorId: operatorId,
  opportunityId: opportunityId,
  organizationId: organizationId,
});
```

**Notifications Generated:**
- MOM-03: "Your interest was registered — the organization can now see your profile"

---

#### INTERVIEW_REQUESTED
**Source:** `app/api/applications/[id]/route.ts`
**When:** Organization requests interview
**Integration Point:** After application status update

```typescript
import { onInterviewRequested } from '@/lib/return-engine/integration';

await onInterviewRequested({
  applicationId: application.id,
  operatorId: operatorId,
  opportunityId: opportunityId,
  organizationId: organizationId,
});
```

**Notifications Generated:**
- OPP-05: "You've been invited to interview"

---

#### HIRED
**Source:** `lib/hiring-loop.ts` in `advanceHiringLoop()`
**When:** Hire is confirmed
**Integration Point:** After hire record creation

```typescript
import { onHired } from '@/lib/return-engine/integration';

await onHired({
  hireId: hire.id,
  operatorId: operatorId,
  opportunityId: opportunityId,
  organizationId: organizationId,
});
```

**Notifications Generated:**
- OPP-06: "You got the opportunity!"

---

#### HIRE_COMPLETED
**Source:** `lib/hiring-loop.ts` in `recordOutcome()`
**When:** Hire outcome recorded
**Integration Point:** After outcome recording

```typescript
import { onHireCompleted } from '@/lib/return-engine/integration';

await onHireCompleted({
  hireId: hire.id,
  operatorId: operatorId,
  outcome: outcome,
  wasSuccessful: wasSuccessful,
});
```

**Notifications Generated:**
- MOM-06: "Your completed work has been recorded"

---

## Notification Variants Reference

| ID | Class | Copy | Priority | Timing |
|----|-------|------|----------|--------|
| VAL-01 | VALIDATION | Someone with experience confirmed your post | P2 | 2-4 hours |
| VAL-02 | VALIDATION | Another experienced operator confirmed your post | P2 | 2-4 hours |
| VAL-03 | VALIDATION | Your post is forming a pattern | P2 | 2-4 hours |
| VAL-04 | VALIDATION | Your contributions are forming a recognized pattern | P2 | 2-4 hours |
| VAL-05 | VALIDATION | A highly trusted operator confirmed your post | P1 | 0-15 min |
| EXP-01 | EXPANSION | Someone added context to your post | P2 | 2-4 hours |
| EXP-02 | EXPANSION | New perspective on your post | P2 | 2-4 hours |
| EXP-03 | EXPANSION | Your solution helped someone resolve an issue | P2 | 2-4 hours |
| EXP-10 | EXPANSION | Your pattern connected to a broader insight | P2 | 2-4 hours |
| MOM-01 | MOMENTUM | Your reliability score moved up | P2 | 2-4 hours |
| MOM-02 | MOMENTUM | You've moved to a higher access tier | P1 | 0-15 min |
| MOM-03 | MOMENTUM | Your interest was registered | P2 | 2-4 hours |
| MOM-04 | MOMENTUM | You now have priority access to opportunities | P2 | 2-4 hours |
| MOM-05 | MOMENTUM | Your expertise in [domain] is now recognized | P2 | 2-4 hours |
| MOM-06 | MOMENTUM | Your completed work has been recorded | P3 | Digest |
| PRE-01 | PRESSURE | An opportunity you watched was just filled | P1 | 0-15 min |
| PRE-03 | PRESSURE | An opportunity opened up — but you didn't have access yet | P2 | 2-4 hours |
| PRE-04 | PRESSURE | You haven't been around in a while | P3 | Digest |
| PRE-05 | PRESSURE | You're close to losing your current access level | P1 | 0-15 min |
| OPP-01 | OPPORTUNITY | A new opportunity matches your profile | P1 | 0-15 min |
| OPP-02 | OPPORTUNITY | An opportunity you might like is moving fast | P1 | 0-15 min |
| OPP-03 | OPPORTUNITY | A [domain] opportunity just opened | P1 | 0-15 min |
| OPP-04 | OPPORTUNITY | You've been matched to an opportunity | P1 | 0-15 min |
| OPP-05 | OPPORTUNITY | You've been invited to interview | P1 | 0-15 min |
| OPP-06 | OPPORTUNITY | You got the opportunity! | P1 | 0-15 min |

---

## Implementation Checklist

### Immediate Wiring Required
1. **Interaction API** - Add trigger calls to `app/api/contributions/[id]/interactions/route.ts`
2. **Trust Vector** - Add trigger calls to `lib/trust-vector.ts`
3. **Signal Score** - Add trigger calls to `lib/signal-score.ts`
4. **Matching** - Add trigger calls to `lib/matching.ts`
5. **Hiring Loop** - Add trigger calls to `lib/hiring-loop.ts`

### Scheduled Jobs Required
1. **Inactivity Check** - Daily job to check for inactive users
2. **Opportunity Expiration** - Check for opportunities about to expire
3. **Tier Proximity** - Daily check for users close to tier boundaries

### Testing Required
1. Each trigger pathway end-to-end
2. Notification batching behavior
3. Time bucketing display
4. Quiet hours respect
5. Settings persistence

---

## File Locations

| Component | File Path |
|-----------|-----------|
| Types | `lib/return-engine/types.ts` |
| Engine | `lib/return-engine/engine.ts` |
| Integration | `lib/return-engine/integration.ts` |
| Database | `lib/return-engine/database.ts` |
| API Routes | `app/api/notifications/route.ts` |
| Notification Detail API | `app/api/notifications/[id]/route.ts` |
| Mark All Read API | `app/api/notifications/mark-all-read/route.ts` |
| Settings API | `app/api/notifications/settings/route.ts` |
| UI Component | `components/NotificationCenter.tsx` |
| Full Page | `app/notifications/page.tsx` |
| Settings Page | `app/notifications/settings/page.tsx` |
| Prisma Schema | `prisma/schema.prisma` (Notification, NotificationBatch, UserNotificationSettings) |