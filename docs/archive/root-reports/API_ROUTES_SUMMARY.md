# Behind the Protocol - API Routes Summary (Beta MVP)

## Operator Network Module

### Threads
- **GET /api/threads** - List all threads (authenticated)
- **POST /api/threads** - Create a new thread (authenticated, verified users only)
- **GET /api/threads/[id]** - Get a specific thread (authenticated)
- **PATCH /api/threads/[id]** - Update a thread (authenticated, owner only)
- **DELETE /api/threads/[id]** - Delete a thread (authenticated, owner only)

### Replies
- **GET /api/threads/[id]/replies** - List replies for a thread (authenticated)
- **POST /api/threads/[id]/replies** - Create a reply (authenticated, verified users only)

## Workforce Exchange Module

### Job Postings (formerly Work Requests)
- **GET /api/job-postings** - List all job postings (no auth required for browsing)
- **POST /api/job-postings** - Create a new job posting (authenticated, verified organizations only)
- **GET /api/job-postings/[id]** - Get a specific job posting (no auth required)
- **PATCH /api/job-postings/[id]** - Update a job posting (authenticated, owner only)
- **DELETE /api/job-postings/[id]** - Delete a job posting (authenticated, owner only)

### Applications (formerly Work Matches)
- **GET /api/applications** - Get applications for current user (authenticated, operators only)
- **POST /api/applications** - Apply to a job posting (authenticated, verified operators only)
- **GET /api/applications/[id]** - Get a specific application (authenticated)
- **PATCH /api/applications/[id]** - Update application status (authenticated, job creator only)
- **DELETE /api/applications/[id]** - Delete an application (authenticated, operator only)

### Messaging
- **GET /api/conversations/[id]/messages** - Get messages for a conversation (authenticated, participants only)
- **POST /api/conversations/[id]/messages** - Send a message (authenticated, participants only)

### Hires & Fee Tracking
- **GET /api/hires** - Get all hire records (authenticated)
- **GET /api/fee-records** - Get all fee records (authenticated)
- **GET /api/fee-records/[id]** - Get a specific fee record (authenticated)
- **PATCH /api/fee-records/[id]** - Update fee record status (authenticated)

## Authentication & User Management

### User Accounts
- **GET /api/users** - Get current user info (authenticated)
- **POST /api/user/create** - Create a new user account
- **GET /api/operator-profiles** - List operator profiles (authenticated)
- **POST /api/operator-profiles** - Create/update operator profile (authenticated)

### Email Verification
- **POST /api/auth/send-verification-code** - Send verification code to work email
- **POST /api/auth/verify-code** - Verify email with code

## Disabled Features (Return 503)

The following API routes are disabled for beta MVP and return HTTP 503:
- /api/war-rooms/*
- /api/industry-signals
- /api/operator-playbooks
- /api/trial-confessions
- /api/career-discussions
- /api/case-archive
- /api/polls/*

## Key Features

### Authentication
- All routes (except job posting viewing) require authentication via Clerk
- Rate limiting implemented on sensitive operations
- Audit logging for all critical actions

### Verification System
- Users must be verified (Approved status) to post threads, job postings, or apply
- Work email verification required
- LinkedIn URL required for verification
- Manual admin approval workflow

### Anonymity
- All public content uses anonymous handles
- Real identities hidden from public view
- Contact information auto-redacted in messages

### Fee Tracking
- 25% platform fee on all hires
- Fee statuses: Fee Pending, Invoiced, Collected, Waived
- Separate from application statuses
- Admin tools for fee management

### Moderation
- Flagging system for content
- Admin tools for content removal
- Audit logs for all actions