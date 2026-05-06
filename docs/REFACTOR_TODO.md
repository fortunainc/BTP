# Signal System Refactor - Implementation Tasks

## Phase 1: Database Schema Migration
- [x] Add SignalScore fields to User model (signalScore, tier, internalBadges, signalCount, resolvedCount)
- [x] Create Signal model (rename Thread concept, add resolution fields)
- [x] Add minTierRequired to JobPosting model
- [x] Create SignalPattern model for pattern detection
- [x] Run Prisma migration (schema ready, requires DB URL)

## Phase 2: Signal Submission Engine
- [x] Transform thread creation form to Signal submission (10 required fields)
- [x] Add resolutionStatus and geographicScope fields
- [x] Create Signal API endpoints
- [ ] Update all "post"/"thread" language to "signal"

## Phase 3: Signal Scoring System
- [x] Implement scoring algorithm server-side
- [x] Calculate scores on submission
- [x] Update user aggregate scores
- [x] Create tier assignment logic

## Phase 4: Access Tier System
- [x] Implement tier thresholds (0-4)
- [x] Create tier update triggers
- [x] Add tier to user responses

## Phase 5: Marketplace Gating
- [x] Add minTierRequired to job posting form
- [x] Gate jobs by tier visibility in API
- [ ] Update job listing pages

## Phase 6: Opportunity Matching Engine
- [ ] Create matching algorithm
- [ ] Rank candidates by SS + relevance
- [ ] Surface top matches to buyers

## Phase 7: User Dashboard
- [x] Create signal score display
- [x] Show tier level & progress
- [x] Display contribution history

## Phase 8: Remove Social Features
- [ ] Replace Reply with structured Endorsement
- [ ] Remove likes/followers concepts
- [ ] Replace all social language