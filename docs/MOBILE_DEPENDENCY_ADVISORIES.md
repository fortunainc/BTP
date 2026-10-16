# Mobile dependency advisories - triage

Date: 2026-10-16. Source: `npm audit --package-lock-only` in `mobile/` against the committed lockfile.

## Result

39 advisories: 22 high, 17 moderate, 0 critical.

Every high advisory sits in **build, bundling or test tooling**, not in code shipped inside the iOS app:

| Package path | Role | Shipped in app? |
|---|---|---|
| `expo` -> `@expo/cli`, `@expo/config`, `@expo/metro-config`, `@expo/code-signing-certificates` -> `node-forge` | Expo CLI, config, update signing during build | No (developer and EAS build machines) |
| `metro`, `metro-config`, `metro-file-map`, `metro-transform-worker` -> `micromatch` -> `braces` | JavaScript bundler | No |
| `react-native` -> `@react-native/community-cli-plugin`, `babel-jest`, `@jest/*`, `jest-haste-map` | CLI and test runner | No |
| `image-size` | Asset dimension parsing at build time | No |

Exposure is limited to machines that build the app, processing project files we control. The advisories are denial-of-service and signature-verification issues in that tooling.

## What not to do

`npm audit fix --force` proposes `expo@44` (a downgrade of ten major SDK versions) and `react-native@0.88` (a major upgrade outside SDK 54). Both would break the app. Do not run it.

## Plan

1. Resolve with the next Expo SDK upgrade (SDK 55 or later), using `npx expo install --fix` and a full device regression.
2. Before then, only consider `overrides` for patch-level fixes (`braces`, `micromatch`, `image-size`) if a build host processes untrusted input, and only with an EAS build and device test.
3. Re-run this audit at each SDK upgrade and record the result here.
