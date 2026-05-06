# BTP Return Engine - 7-Day User Flows

## Overview

This document demonstrates how the Return Engine creates engagement loops for two key user types:
1. **Authors** - Users who contribute content to the platform
2. **Repliers** - Users who interact with and validate others' content

---

## 7-Day Author Flow

### User Profile
- **Role:** Operator (clinical research professional)
- **Tier:** TIER_3 (starting tier)
- **Domain:** Oncology trials
- **Goal:** Build reputation, access opportunities

---

### Day 1: Initial Contribution

**Morning (9:00 AM)**
- User posts a situation about enrollment challenges in oncology trials
- **System Action:** Creates contribution record
- **Notification:** None (state tracking only)

**Afternoon (2:00 PM)**
- First user marks "Seen this before" on the post
- **System Action:** 
  - Creates interaction record
  - Updates author's trust vector
  - Triggers `onSeenThisBefore` with `confirmationCount=1`, `isFirstConfirmation=true`
- **Notification Generated:** VAL-01 "Someone with experience confirmed your post"
  - **Priority:** P2 (2-4 hours batched)
  - **Delivery:** In-app notification center
  - **Timing:** Scheduled for 3:00 PM (1 hour delay for anonymity)

**Evening (6:00 PM)**
- User checks notification center
- **Experience:** Sees VAL-01 notification with "just_now" time bucket
- **Action:** Clicks to view contribution, marks as read
- **Psychological Impact:** Validation - "My contribution is being seen"

---

### Day 2: Building Momentum

**Morning (8:00 AM)**
- Second user marks "Seen this before" (unique confirmer)
- **System Action:**
  - Creates interaction record
  - Triggers `onSeenThisBefore` with `confirmationCount=2`, `isUniqueConfirmer=true`
- **Notification Generated:** VAL-02 "Another experienced operator confirmed your post"
  - **Priority:** P2
  - **Delivery:** In-app notification center
  - **Timing:** Scheduled for 10:00 AM (2-hour batch)

**Mid-Day (12:00 PM)**
- User receives VAL-02 notification
- **Experience:** "This is building into something"
- **Action:** Views contribution, sees 2 confirmations

**Afternoon (3:00 PM)**
- Third user marks "Seen this before"
- **System Action:**
  - Creates interaction record
  - Pattern detection triggers `onPatternForming`
- **Notifications Generated:**
  - VAL-03 "Your post is forming a pattern" (batched with VAL-02)
  - VAL-04 "Your contributions are forming a recognized pattern"
- **Delivery:** Both delivered together at 5:00 PM
- **Experience:** "I'm contributing to recognized knowledge"

**Evening (6:00 PM)**
- User checks notifications
- **Experience:** Sees 2 notifications grouped under "earlier today"
- **Psychological Impact:** Momentum - "I'm building something valuable"

---

### Day 3: Expansion and Context

**Morning (9:00 AM)**
- User adds context to someone else's post
- **System Action:**
  - Creates interaction record
  - Triggers `onAddContext` for original author
- **Notification Generated:** EXP-01 "Someone added context to your post" (for other author)
- **User's Experience:** No notification (they're the actor, not recipient)

**Afternoon (2:00 PM)**
- Someone adds context to user's Day 1 post
- **System Action:** Triggers `onAddContext` for user
- **Notification Generated:** EXP-01 "Someone added context to your post"
  - **Priority:** P2
  - **Delivery:** In-app notification center
  - **Timing:** Scheduled for 4:00 PM

**Evening (5:00 PM)**
- User receives EXP-01 notification
- **Experience:** "People are engaging with my content"
- **Action:** Views contribution, reads added context
- **Psychological Impact:** Expansion - "My contribution is growing"

---

### Day 4: Trust Score Movement

**Morning (8:00 AM)**
- System runs trust vector recalculation (scheduled job)
- **System Action:**
  - Calculates new trust score based on interactions
  - Detects 8% increase in reliability dimension
  - Triggers `onTrustIncreased`
- **Notification Generated:** MOM-01 "Your reliability score moved up"
  - **Priority:** P2
  - **Delivery:** In-app notification center
  - **Timing:** Scheduled for 10:00 AM

**Mid-Day (11:00 AM)**
- User receives MOM-01 notification
- **Experience:** "My contributions are being recognized"
- **Psychological Impact:** Progress - "I'm improving"

**Afternoon (3:00 PM)**
- System runs signal score calculation
- **System Action:**
  - Calculates new signal score
  - Detects tier improvement: TIER_3 → TIER_2
  - Triggers `onTierImproved`
- **Notification Generated:** MOM-02 "You've moved to a higher access tier"
  - **Priority:** P1 (immediate)
  - **Delivery:** In-app notification center + email
  - **Timing:** Sent immediately (0-15 min)

**Evening (4:00 PM)**
- User receives MOM-02 notification
- **Experience:** "I've unlocked new opportunities"
- **Action:** Views notification, checks opportunity dashboard
- **Psychological Impact:** Achievement - "I'm progressing"

---

### Day 5: Opportunity Access

**Morning (9:00 AM)**
- New opportunity posted in oncology domain
- **System Action:**
  - Matching algorithm finds high fit (85%)
  - User's TIER_2 status grants 48-hour early access
  - Triggers `onOpportunityReleased`
- **Notification Generated:** OPP-01 "A new opportunity matches your profile"
  - **Priority:** P1 (immediate)
  - **Delivery:** In-app notification center + push
  - **Timing:** Sent immediately

**Mid-Day (10:00 AM)**
- User receives OPP-01 notification
- **Experience:** "I can access this before others"
- **Action:** Views opportunity, expresses interest
- **Psychological Impact:** Exclusivity - "My tier gives me advantage"

**Afternoon (2:00 PM)**
- System registers interest
- **System Action:** Triggers `onInterestExpressed`
- **Notification Generated:** MOM-03 "Your interest was registered — the organization can now see your profile"
  - **Priority:** P2
  - **Delivery:** In-app notification center
  - **Timing:** Scheduled for 4:00 PM

**Evening (5:00 PM)**
- User receives MOM-03 notification
- **Experience:** "I'm in the running"
- **Psychological Impact:** Momentum - "I'm moving forward"

---

### Day 6: Domain Recognition

**Morning (8:00 AM)**
- System detects domain expertise strengthening
- **System Action:**
  - Calculates domain relevance score for oncology
  - Detects significant increase (15%)
  - Triggers `onDomainStrengthened`
- **Notification Generated:** MOM-05 "Your expertise in oncology is now recognized"
  - **Priority:** P2
  - **Delivery:** In-app notification center
  - **Timing:** Scheduled for 10:00 AM

**Mid-Day (11:00 AM)**
- User receives MOM-05 notification
- **Experience:** "My expertise is being recognized"
- **Psychological Impact:** Validation - "I'm an expert in my field"

**Afternoon (3:00 PM)**
- Another oncology opportunity posted
- **System Action:**
  - Matching finds domain match
  - Triggers `onOpportunityDomainMatch`
- **Notification Generated:** OPP-03 "An oncology opportunity just opened"
  - **Priority:** P1 (immediate)
  - **Delivery:** In-app notification center + push
  - **Timing:** Sent immediately

**Evening (4:00 PM)**
- User receives OPP-03 notification
- **Experience:** "More opportunities in my domain"
- **Action:** Views opportunity
- **Psychological Impact:** Relevance - "The platform knows my expertise"

---

### Day 7: Weekly Summary

**Morning (9:00 AM)**
- System generates weekly summary
- **System Action:**
  - Aggregates week's activity
  - Compiles trust changes, interactions, opportunities
  - Triggers weekly summary notification
- **Notification Generated:** Weekly digest (P3)
  - **Priority:** P3 (digest only)
  - **Delivery:** Email
  - **Content:**
    - 3 contributions validated
    - Trust score increased by 12%
    - Tier improved to TIER_2
    - 2 opportunities accessed
    - 1 interest expressed

**Mid-Day (12:00 PM)**
- User receives weekly summary email
- **Experience:** "I've made real progress this week"
- **Psychological Impact:** Accomplishment - "I'm building something"

**Afternoon (3:00 PM)**
- User reflects on week
- **Experience:** "The platform recognizes my contributions"
- **Psychological Impact:** Investment - "I should keep contributing"

---

## 7-Day Replier Flow

### User Profile
- **Role:** Operator (clinical research professional)
- **Tier:** TIER_2 (established tier)
- **Domain:** Multiple domains (oncology, cardiology)
- **Goal:** Learn from others, build reputation through validation

---

### Day 1: Discovery and Validation

**Morning (8:00 AM)**
- User browses contribution feed
- **Experience:** Sees new post about enrollment challenges
- **Action:** Reads post, recognizes similar experience

**Mid-Day (12:00 PM)**
- User marks "Seen this before" on post
- **System Action:**
  - Creates interaction record
  - Updates user's trust vector (pattern contribution dimension)
  - Triggers `onSeenThisBefore` for author
- **Notification Generated:** VAL-01 for author (not for user)
- **User's Experience:** No notification (they're the actor)
- **Psychological Impact:** Contribution - "I'm helping validate this"

**Afternoon (3:00 PM)**
- User marks "This is accurate" on another post
- **System Action:**
  - Creates interaction record
  - Updates user's trust vector (quality dimension)
  - Triggers `onThisIsAccurate` for author
- **Notification Generated:** VAL-05 for author
- **User's Experience:** No notification
- **Psychological Impact:** Validation - "I'm confirming quality"

---

### Day 2: Solution Feedback

**Morning (9:00 AM)**
- User finds a solution post that helped them
- **Action:** Marks "This worked"
- **System Action:**
  - Creates interaction record
  - Updates user's trust vector (solution utility dimension)
  - Triggers `onThisWorked` for author
- **Notification Generated:** EXP-03 for author
- **User's Experience:** No notification
- **Psychological Impact:** Gratitude - "I'm giving back"

**Afternoon (2:00 PM)**
- User tries a solution that didn't work
- **Action:** Marks "Didn't work" with context
- **System Action:**
  - Creates interaction record
  - Triggers `onDidntWork` for author
- **Notification Generated:** EXP-03 for author
- **User's Experience:** No notification
- **Psychological Impact:** Improvement - "I'm helping refine solutions"

**Evening (6:00 PM)**
- User receives notification (unrelated to their actions)
- **Notification:** VAL-01 "Someone with experience confirmed your post"
- **Experience:** "Someone validated my contribution"
- **Psychological Impact:** Reciprocity - "Validation goes both ways"

---

### Day 3: Context Contribution

**Morning (10:00 AM)**
- User adds context to a post
- **Action:** Submits additional context
- **System Action:**
  - Creates interaction record
  - Updates user's trust vector (pattern contribution dimension)
  - Triggers `onAddContext` for author
- **Notification Generated:** EXP-01 for author
- **User's Experience:** No notification
- **Psychological Impact:** Contribution - "I'm adding value"

**Afternoon (3:00 PM)**
- User identifies different cause on a post
- **Action:** Submits alternative cause
- **System Action:**
  - Creates interaction record
  - Triggers `onDifferentCause` for author
- **Notification Generated:** EXP-02 for author
- **User's Experience:** No notification
- **Psychological Impact:** Correction - "I'm improving accuracy"

**Evening (7:00 PM)**
- User receives notification
- **Notification:** EXP-01 "Someone added context to your post"
- **Experience:** "Someone is engaging with my content"
- **Psychological Impact:** Engagement - "My contributions matter"

---

### Day 4: Trust Building

**Morning (8:00 AM)**
- System runs trust vector recalculation
- **System Action:**
  - Calculates new trust score
  - Detects 5% increase in peer confidence dimension
  - Triggers `onTrustIncreased`
- **Notification Generated:** MOM-01 "Your reliability score moved up"
  - **Priority:** P2
  - **Delivery:** In-app notification center
  - **Timing:** Scheduled for 10:00 AM

**Mid-Day (11:00 AM)**
- User receives MOM-01 notification
- **Experience:** "My validations are building my reputation"
- **Psychological Impact:** Progress - "I'm becoming more trusted"

**Afternoon (2:00 PM)**
- User continues validating posts
- **Action:** Marks "Seen this before" on 3 more posts
- **System Action:**
  - Creates interaction records
  - Updates trust vector
  - Triggers notifications for authors
- **User's Experience:** No notifications
- **Psychological Impact:** Consistency - "I'm building a pattern of quality"

---

### Day 5: Domain Strengthening

**Morning (9:00 AM)**
- System detects domain expertise strengthening
- **System Action:**
  - Calculates domain relevance scores
  - Detects increase in oncology domain
  - Triggers `onDomainStrengthened`
- **Notification Generated:** MOM-05 "Your expertise in oncology is now recognized"
  - **Priority:** P2
  - **Delivery:** In-app notification center
  - **Timing:** Scheduled for 11:00 AM

**Mid-Day (12:00 PM)**
- User receives MOM-05 notification
- **Experience:** "My validations in oncology are recognized"
- **Psychological Impact:** Expertise - "I'm becoming known in this domain"

**Afternoon (3:00 PM)**
- Oncology opportunity posted
- **System Action:**
  - Matching finds domain match
  - Triggers `onOpportunityDomainMatch`
- **Notification Generated:** OPP-03 "An oncology opportunity just opened"
  - **Priority:** P1 (immediate)
  - **Delivery:** In-app notification center + push
  - **Timing:** Sent immediately

**Evening (4:00 PM)**
- User receives OPP-03 notification
- **Experience:** "Opportunities in my validated domain"
- **Action:** Views opportunity
- **Psychological Impact:** Relevance - "My validations unlock opportunities"

---

### Day 6: Opportunity Engagement

**Morning (8:00 AM)**
- User expresses interest in opportunity
- **System Action:**
  - Creates application record
  - Triggers `onInterestExpressed`
- **Notification Generated:** MOM-03 "Your interest was registered"
  - **Priority:** P2
  - **Delivery:** In-app notification center
  - **Timing:** Scheduled for 10:00 AM

**Mid-Day (11:00 AM)**
- User receives MOM-03 notification
- **Experience:** "I'm in consideration"
- **Psychological Impact:** Momentum - "My reputation is working"

**Afternoon (2:00 PM)**
- Organization requests interview
- **System Action:**
  - Updates application status
  - Triggers `onInterviewRequested`
- **Notification Generated:** OPP-05 "You've been invited to interview"
  - **Priority:** P1 (immediate)
  - **Delivery:** In-app notification center + email
  - **Timing:** Sent immediately

**Evening (3:00 PM)**
- User receives OPP-05 notification
- **Experience:** "My reputation led to an interview"
- **Psychological Impact:** Achievement - "My validations paid off"

---

### Day 7: Weekly Summary

**Morning (9:00 AM)**
- System generates weekly summary
- **System Action:**
  - Aggregates week's activity
  - Compiles trust changes, interactions, opportunities
  - Triggers weekly summary notification
- **Notification Generated:** Weekly digest (P3)
  - **Priority:** P3 (digest only)
  - **Delivery:** Email
  - **Content:**
    - 12 posts validated
    - Trust score increased by 8%
    - Domain expertise strengthened in oncology
    - 1 opportunity accessed
    - 1 interview requested

**Mid-Day (12:00 PM)**
- User receives weekly summary email
- **Experience:** "My validations are building real value"
- **Psychological Impact:** Investment - "I should keep validating"

**Afternoon (3:00 PM)**
- User reflects on week
- **Experience:** "Every validation builds my reputation"
- **Psychological Impact:** Loop - "I'll continue validating to grow"

---

## Key Engagement Patterns

### Author Loop
1. **Post** → Receive validation (VAL-01)
2. **Validation** → Feel recognized → Post more
3. **Multiple validations** → Pattern formation (VAL-03, VAL-04)
4. **Trust increases** → Tier improvement (MOM-02)
5. **Tier improvement** → Opportunity access (OPP-01)
6. **Opportunity access** → Express interest (MOM-03)
7. **Weekly summary** → See progress → Continue posting

### Replier Loop
1. **Validate** → Build trust (invisible)
2. **Trust increases** → Receive notification (MOM-01)
3. **Domain strengthens** → Receive notification (MOM-05)
4. **Domain match** → Opportunity notification (OPP-03)
5. **Express interest** → Receive confirmation (MOM-03)
6. **Interview requested** → Receive notification (OPP-05)
7. **Weekly summary** → See impact → Continue validating

---

## Remaining Dead Zones

### Identified Gaps

1. **Post-Submission Silence**
   - **Period:** After posting → before first interaction
   - **Duration:** Hours to days (or forever)
   - **Current:** No mechanism
   - **Potential:** "Your post is visible to X operators in your domain" (after 1 hour)

2. **Between Opportunities**
   - **Period:** After opportunity closes → before next match
   - **Duration:** Days to weeks
   - **Current:** No mechanism
   - **Potential:** "Your profile is being considered for opportunities" (weekly)

3. **Post-Interview Silence**
   - **Period:** After interview → before outcome
   - **Duration:** Days to weeks
   - **Current:** No mechanism
   - **Potential:** "Your interview is under review" (after 3 days)

4. **Trust Plateau**
   - **Period:** When trust score stabilizes
   - **Duration:** Weeks to months
   - **Current:** No mechanism
   - **Potential:** "You're in the top X% of operators in [domain]" (monthly)

---

## Notification Frequency Analysis

### Author (7 Days)
- **Total Notifications:** 12
- **P1 (Immediate):** 3 (25%)
- **P2 (Batched):** 7 (58%)
- **P3 (Digest):** 2 (17%)
- **Average per day:** 1.7

### Replier (7 Days)
- **Total Notifications:** 6
- **P1 (Immediate):** 2 (33%)
- **P2 (Batched):** 3 (50%)
- **P3 (Digest):** 1 (17%)
- **Average per day:** 0.9

### Conclusion
Both user types receive manageable notification volumes with appropriate prioritization. The system balances immediate feedback (P1) with batched updates (P2) and weekly summaries (P3).