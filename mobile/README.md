# BTP Mobile

Expo/React Native member app for the invite-only BTP beta. The existing Next.js application remains the backend, public landing page, and founder/admin console.

## Beta scope

The shell follows the five surfaces in `../BTP_PRODUCT_CONSTITUTION.md`:

- Home
- Questions
- Ask BTP
- Activity
- You

The app is wired to the authenticated BTP APIs for questions, safe review and posting, answers, following, outcomes, activity, and private-help requests. Without environment configuration it remains usable as a read-only visual preview.

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

5. Start Expo:

   ```bash
   npm start
   ```

## Before a device beta

- Replace the placeholder EAS project ID in `app.json`.
- Confirm the final iOS bundle identifier and Android package name.
- Add app icons, splash assets, push notifications, and error/empty/loading states.
- Run `npx expo-doctor` and `npm run typecheck`.

## Architecture rule

Do not duplicate business logic or direct database access in this app. All questions, answers, moderation, verification, outcomes, and private-help data flow through the existing BTP backend APIs.
