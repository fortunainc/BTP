# BTP Mobile

Expo/React Native member app for the invite-only BTP beta. The existing Next.js application remains the backend, public landing page, and founder/admin console.

## Beta scope

The shell follows the five surfaces in `../BTP_PRODUCT_CONSTITUTION.md`:

- Home
- Questions
- Ask BTP
- Activity
- You

The app is wired to the authenticated BTP APIs for questions, safe review and posting, answers, following, outcomes, activity, and private-help requests. Missing configuration fails closed. A read-only local preview is available only when a developer explicitly sets `EXPO_PUBLIC_ENABLE_LOCAL_PREVIEW=true`; the app displays a persistent warning banner in that mode.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file:

   ```bash
   cp env.example .env
   ```

3. Set `EXPO_PUBLIC_API_URL` to a URL reachable from the device. `localhost` works in the iOS simulator; a physical phone generally needs the Mac's LAN address or a secure development tunnel.

4. Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` from the existing BTP Clerk application. Clerk session tokens are cached with Expo Secure Store.

   For UI work without live services, explicitly set `EXPO_PUBLIC_ENABLE_LOCAL_PREVIEW=true`. `EXPO_PUBLIC_DEV_AUTH_TOKEN` is honored only in that local development mode. Both values are rejected from EAS device builds, and release bundles compile the bypass out.

5. Start Expo:

   ```bash
   npm start
   ```

## TestFlight readiness

The repository contains a store-distribution `production` EAS profile with automatic build-number increments. No Apple, Clerk, API, or EAS credentials belong in git.

Before the first EAS build:

1. Confirm that `com.btp.mobile` is the permanent App Store bundle identifier. Changing it after creating the App Store Connect record creates a different app.
2. From this directory, authenticate to the intended Expo account and run `eas init`. This safely writes the real EAS project ID into the Expo config; the repository intentionally contains no fake project ID.
3. Configure `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` for the EAS `production` environment. The API URL must be the deployed HTTPS backend, not `localhost`.
4. Confirm the deployed backend accepts the mobile app's Clerk bearer tokens and that the Clerk application allows the app's native redirect scheme, `btp://`.
5. Add final App Store icon and splash artwork before external testing. Expo defaults are sufficient only for local functional checks.
6. Run the checks below, then use `eas build --platform ios --profile production`. Building or submitting requires explicit authorization and the appropriate Expo/Apple credentials.

Validation commands:

```bash
npm run typecheck
npx expo-doctor
npx expo config --type public
```

Submission is deliberately separate from building. Do not run `eas submit` until the build has been tested and submission is explicitly authorized.

## Remaining beta setup

- Confirm the final iOS bundle identifier and Android package name.
- Complete `eas init` and set the two production environment values.
- Add final app icons and splash assets.
- Add push notifications after the core question-and-answer loop is stable; they are not required to install the first TestFlight build.

## Architecture rule

Do not duplicate business logic or direct database access in this app. All questions, answers, moderation, verification, outcomes, and private-help data flow through the existing BTP backend APIs.
