const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
const requestedDevAuthToken = process.env.EXPO_PUBLIC_DEV_AUTH_TOKEN?.trim();

/**
 * Local preview is deliberately a two-part opt in. `__DEV__` is compiled to
 * false in release bundles, so a token left in an EAS environment cannot turn
 * into a membership bypass.
 */
export const localPreviewEnabled = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_LOCAL_PREVIEW === "true";
export const devAuthToken = localPreviewEnabled ? requestedDevAuthToken : undefined;
export const API_URL = apiUrl;
/**
 * The production Clerk instance is served through the web app's /__clerk proxy
 * (its own Clerk subdomain has no DNS on vercel.app). Native must use it too,
 * otherwise Clerk never loads and the app spins forever.
 */
export const CLERK_PROXY_URL = apiUrl ? `${apiUrl.replace(/\/+$/, "")}/__clerk` : undefined;
export const CLERK_PUBLISHABLE_KEY = clerkPublishableKey;
export const liveApiConfigured = Boolean(API_URL);
export const liveAuthConfigured = Boolean(CLERK_PUBLISHABLE_KEY && API_URL);

export const configurationIssues = [
  !API_URL ? "BTP service URL" : null,
  !CLERK_PUBLISHABLE_KEY ? "Clerk publishable key" : null,
].filter((issue): issue is string => Boolean(issue));

