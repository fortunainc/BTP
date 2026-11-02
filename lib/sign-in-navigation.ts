/** Keep requested destinations on BTP. Clerk's decorated recovery URL is handled separately. */
export function safeSignInDestination(destination: string | null, origin: string) {
  if (!destination) return '/situations';
  try {
    const url = new URL(destination, origin);
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : '/situations';
  } catch { return '/situations'; }
}
export function navigateAfterSignIn(url: string, navigation: { replace: (url: string) => void; assign: (url: string) => void }) {
  // Hard navigation interrupts normal Clerk session activation. Only Clerk's
  // absolute recovery URL (e.g. Safari ITP) needs a document navigation.
  if (/^https?:\/\//.test(url)) navigation.assign(url);
  else navigation.replace(url);
}
