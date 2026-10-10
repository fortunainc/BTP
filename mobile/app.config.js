const buildProfile = process.env.EAS_BUILD_PROFILE;

if (buildProfile) {
  const missing = [
    ["EXPO_PUBLIC_API_URL", process.env.EXPO_PUBLIC_API_URL],
    ["EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY", process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY],
  ].filter(([, value]) => !value || !value.trim()).map(([name]) => name);

  if (missing.length) {
    throw new Error(`BTP ${buildProfile} device build refused: missing ${missing.join(", ")}.`);
  }

  if (process.env.EXPO_PUBLIC_DEV_AUTH_TOKEN) {
    throw new Error("BTP device build refused: EXPO_PUBLIC_DEV_AUTH_TOKEN is local-preview-only and must not be present in EAS.");
  }

  if (process.env.EXPO_PUBLIC_ENABLE_LOCAL_PREVIEW === "true") {
    throw new Error("BTP device build refused: local preview must not be enabled in EAS.");
  }

  if (!/^https:\/\//i.test(process.env.EXPO_PUBLIC_API_URL)) {
    throw new Error("BTP device build refused: EXPO_PUBLIC_API_URL must use HTTPS.");
  }
}

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    infoPlist: {
      ...config.ios?.infoPlist,
      NSAppTransportSecurity: {
        ...config.ios?.infoPlist?.NSAppTransportSecurity,
        NSAllowsArbitraryLoads: false,
      },
    },
  },
});
