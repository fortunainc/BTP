# Non-MVP Features Removal Audit

## Identified Non-MVP Routes to Remove

### Frontend Pages (to be removed or disabled)
1. `/war-rooms` - Main war rooms page
2. `/war-rooms/new` - Create war room
3. `/war-rooms/[id]` - War room detail
4. `/industry-signals` - Industry signals page
5. `/operator-playbooks` - Operator playbooks page
6. `/trial-confessions` - Confessions page (note: route is `/confessions`)
7. `/career` - Career discussions page
8. `/case-archive` - Case archive page
9. `/cases` - Cases page (duplicate of case archive?)
10. `/rooms` - Rooms page (war rooms alternative?)
11. `/polls` - Polls page
12. `/polls/new` - Create polls page

### API Routes (already disabled in previous work, verify)
- `/api/war-rooms/*` - War rooms endpoints
- `/api/industry-signals` - Industry signals endpoint
- `/api/operator-playbooks` - Operator playbooks endpoint
- `/api/trial-confessions` - Trial confessions endpoint
- `/api/career-discussions` - Career discussions endpoint
- `/api/case-archive` - Case archive endpoint

### MVP Routes to Keep
1. `/` - Homepage (needs cleanup)
2. `/threads` - Operator network
3. `/threads/new` - Create thread
4. `/threads/[id]` - Thread detail
5. `/workforce` - Workforce exchange (needs terminology update)
6. `/workforce/profile` - Profile
7. `/workforce/requests/new` - Create job posting (rename to job-postings)
8. `/workforce/requests/[id]` - Job posting detail (rename to job-postings)
9. `/workforce/matches` - Applications (rename to applications)
10. `/onboarding` - Onboarding
11. `/sign-in` - Sign in
12. `/sign-up` - Sign up
13. `/privacy` - Privacy policy
14. `/admin/dashboard` - Admin dashboard (needs rebuild)

### API Routes to Keep (with terminology updates)
- `/api/threads/*` - Operator network endpoints
- `/api/users/*` - User management
- `/api/auth/*` - Authentication
- `/api/user/create` - User creation
- `/api/operator-profiles/*` - Operator profiles
- `/api/work-requests/*` → Rename to `/api/job-postings/*`
- `/api/work-matches/*` → Rename to `/api/applications/*`

## Database Tables to Review
Current schema has 25 tables. Need to identify which are non-MVP:

### Likely Non-MVP Tables (verify)
- WarRoom
- WarRoomMessage
- WarRoomParticipant
- IndustrySignal
- OperatorPlaybook
- TrialConfession
- CareerDiscussion
- CaseArchive
- CaseDrop
- TrialTypeRoom
- PatternSignal
- Poll
- PollVote

### MVP Tables to Keep
- User (with updates)
- Thread
- Reply
- WorkRequest → Rename to JobPosting
- WorkMatch → Rename to Application
- OperatorProfile
- ThreadFollow

### New Tables to Add
- UserVerification (or extend User)
- Hire
- FeeRecord
- Conversation
- Message

## Navigation Elements to Update
- Remove War Rooms from nav
- Remove Industry Signals from nav
- Remove Playbooks from nav
- Remove Confessions from nav
- Remove Career from nav
- Remove Case Archive from nav
- Remove Polls from nav
- Keep Operator Network
- Keep Workforce Exchange