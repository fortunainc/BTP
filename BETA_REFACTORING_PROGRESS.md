# Behind the Protocol - Beta Refactoring Progress Report

**Date:** March 10, 2026
**Status:** In Progress - Phase 1-2 Complete, Database Schema Complete

---

## Executive Summary

This document tracks the comprehensive refactoring of the Behind the Protocol platform to align with the official beta MVP requirements. The platform is being simplified from a 3-layer multi-feature system to a focused 2-module MVP.

**Current Progress: ~35% Complete**
- ✅ Database schema refactored (100%)
- ✅ Core API routes created (100%)
- ✅ Homepage updated (100%)
- ⏳ Frontend pages cleanup (0%)
- ⏳ User verification workflow (0%)
- ⏳ Messaging system UI (0%)
- ⏳ Admin tools (0%)
- ⏳ QA sweep (0%)

---

## Completed Work

### 1. Database Schema Refactoring ✅

**Status:** Complete
**File:** cei-platform/prisma/schema.prisma

**Changes Made:**
- Removed 13 non-MVP tables: WarRoom, WarRoomMessage, WarRoomParticipant, IndustrySignal, OperatorPlaybook, TrialConfession, CareerDiscussion, CaseArchive, CaseDrop, TrialTypeRoom, PatternSignal, Poll, PollVote
- Renamed WorkRequest → JobPosting
- Renamed WorkMatch → Application
- Added User verification fields: verificationStatus, verificationMethod, linkedinUrl, verifiedBy, verifiedAt, rejectionReason
- Added Hire model for tracking successful hires
- Added FeeRecord model for 25% platform fee tracking
- Added Conversation and Message models for anonymous messaging
- Added AuditLog model for comprehensive tracking
- Added FlaggedContent model for moderation
- Updated User model to support both organizations and operators

**Tables Remaining (16 total):**
1. User
2. Thread
3. Reply
4. ThreadFollow
5. OperatorProfile
6. JobPosting
7. Application
8. Conversation
9. Message
10. Hire
11. FeeRecord
12. AuditLog
13. FlaggedContent

**Migration Status:** Schema validated, migration SQL ready to apply when database is accessible.

---

### 2. API Routes Creation ✅

**Status:** Complete
**New API Routes Created:**

#### Operator Network Module
- /api/threads - GET/POST (list/create threads)
- /api/threads/[id] - GET/PATCH/DELETE (thread operations)
- /api/threads/[id]/replies - GET/POST (reply operations)

#### Workforce Exchange Module
- /api/job-postings - GET/POST (list/create job postings)
- /api/job-postings/[id] - GET/PATCH/DELETE (job posting operations)
- /api/applications - GET/POST (list/submit applications)
- /api/applications/[id] - GET/PATCH/DELETE (application operations)

#### Messaging Module
- /api/conversations/[id]/messages - GET/POST (messaging)

#### Hiring and Fee Tracking
- /api/hires - GET (hire records)
- /api/fee-records - GET (fee records)
- /api/fee-records/[id] - GET/PATCH (fee record operations)

#### Disabled Features (Return 503)
- /api/war-rooms/*
- /api/industry-signals
- /api/operator-playbooks
- /api/trial-confessions
- /api/career-discussions
- /api/case-archive
- /api/polls/*

**Key Features Implemented:**
- ✅ Authentication on all routes (except public job posting viewing)
- ✅ Rate limiting on sensitive operations
- ✅ Audit logging for all critical actions
- ✅ Input sanitization and XSS prevention
- ✅ Automatic hire and fee record creation when applicant is marked as Hired
- ✅ 25% platform fee calculation

---

### 3. Homepage Refactoring ✅

**Status:** Complete
**File:** cei-platform/app/page.tsx

**Changes Made:**
- Removed "3-Layer Integrated Platform" concept
- Removed War Rooms from homepage
- Removed Industry Signals, Polls, Playbooks references
- Updated to show only 2 core modules: Operator Network and Workforce Exchange
- Updated branding to "Behind the Protocol"
- Updated messaging to reflect verified but anonymous professional network
- Added clear value propositions for each module
- Updated CTA buttons for sign-up and browsing

---

## Remaining Work

### 4. Frontend Pages Cleanup ⏳

**Non-MVP Pages to Remove/Disable:**
- /war-rooms
- /war-rooms/new
- /war-rooms/[id]
- /industry-signals
- /playbooks
- /confessions
- /career
- /case-archive
- /cases
- /rooms
- /polls
- /polls/new

**MVP Pages to Update:**
- /workforce → Update terminology from "Work Requests" to "Job Postings"
- /workforce/requests → /workforce/job-postings
- /workforce/matches → /workforce/applications
- /threads → Keep and enhance
- /onboarding → Update for verification workflow

---

### 5. User Verification Workflow ⏳

**Required Implementation:**
- Update signup form to collect:
  - LinkedIn URL (required)
  - Role/company type selection
  - Work email verification
- Create verification pending state
- Build admin verification approval interface
- Add verification gates to protected routes
- Update onboarding flow

---

### 6. Messaging System UI ⏳

**Required Implementation:**
- Build conversation list view
- Build message thread view
- Create message input component
- Implement real-time messaging (or polling for beta)
- Add contact detail redaction warning
- Integrate with job applications

---

### 7. Admin Tools ⏳

**Required Admin Dashboards:**

#### Verification Admin
- List pending verifications
- Show LinkedIn URL, work email, role, company type
- Approve/reject functionality
- Notes field

#### Moderation Admin
- List flagged content
- Remove content functionality
- View audit logs

#### Hiring/Fee Admin
- View job postings
- View applications
- View hire records
- View fee records
- Update fee status (Fee Pending, Invoiced, Collected, Waived)

#### User Oversight
- View users list
- View verification states
- Suspend/restrict access

---

### 8. QA Sweep ⏳

**Functional QA Checklist:**
- [ ] Signup/login flows
- [ ] Email verification
- [ ] LinkedIn URL capture
- [ ] Admin verification workflow
- [ ] Thread creation
- [ ] Reply creation
- [ ] Voting/helpful logic
- [ ] Job posting creation
- [ ] Application submission
- [ ] Applicant review
- [ ] Direct messaging
- [ ] Hire marking
- [ ] Fee record creation
- [ ] Admin fee status updates

**Security/Privacy QA Checklist:**
- [ ] Anonymity maintained in all public views
- [ ] No private identity leaks
- [ ] Contact detail redaction works
- [ ] Role-restricted access works
- [ ] Verification gates protect routes
- [ ] Audit logging functional

---

## Known Issues and Blockers

### Database Connection
- **Issue:** Remote database not accessible from sandbox environment
- **Impact:** Cannot run Prisma migration
- **Workaround:** Schema is valid and ready; migration will be applied when database is accessible

### Remaining Frontend Work
- Multiple non-MVP pages still exist in the app directory
- Need to remove or redirect these pages
- Need to update navigation components

---

## Next Steps

1. Remove non-MVP frontend pages
2. Update navigation to show only MVP modules
3. Implement verification workflow UI
4. Build messaging UI components
5. Create admin dashboard
6. Run comprehensive QA sweep
7. Document all changes for deployment

---

## Estimated Completion

- Frontend cleanup: 2-3 hours
- Verification workflow: 2-3 hours
- Messaging UI: 2-3 hours
- Admin tools: 3-4 hours
- QA sweep: 2-3 hours

**Total Remaining:** 11-16 hours of development work