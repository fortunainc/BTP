# P0 Launch-Blocking Fixes for BTP Live Deployment

## P0 Issue 1: Homepage Context ✅ COMPLETE
- [x] Rewrite homepage with proper context sections
  - Hero section with clear headline
  - "What this is" section
  - "How it works" section
  - Cold-start empty state
  - Trust strip
- [x] Review and verify homepage content matches requirements

## P0 Issue 2: Auth Flow Gating ✅ COMPLETE
- [x] Check current /situations/new page structure
- [x] Implement proper auth gating logic
  - Not authenticated: Show account gate
  - Authenticated but no onboarding: Show profile completion gate
  - Authenticated + onboarding complete: Show submission form
- [x] Create /api/user/status endpoint to check onboarding
- [x] Update /situations/new page with gating logic

## P0 Issue 3: Middleware Invocation Error ⚠️ PENDING VERIFICATION
- [x] Simplify middleware to remove auth() calls (previously done)
- [ ] Verify middleware invocation error is resolved
- [ ] Test live URL to confirm no MIDDLEWARE_INVOCATION_FAILED errors

## QA & Deployment
- [x] Install dependencies
- [x] Run build: npm run build ✅ BUILD SUCCESSFUL
- [ ] Deploy to Vercel
- [ ] Test all three P0 fixes on live URL
- [ ] Verify end-to-end auth flow works correctly