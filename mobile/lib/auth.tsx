import { ClerkProvider, getClerkInstance, useAuth, useSignIn } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Mark } from "@/components/ui";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { api, ApiError, liveApiConfigured } from "@/lib/api";
import { SITE_URL } from "@/lib/links";
import { CLERK_PROXY_URL, CLERK_PUBLISHABLE_KEY, configurationIssues, devAuthToken, localPreviewEnabled } from "@/lib/config";

export type BtpMember = { id: string; handle: string; roleCategory?: string | null; roleLabel?: string | null; companyCategory?: string | null; verificationStatus?: string | null; approved: boolean };
type AuthState = { configured: boolean; ready: boolean; signedIn: boolean; member: BtpMember | null; getToken: () => Promise<string | null>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState>({ configured: Boolean(devAuthToken), ready: true, signedIn: Boolean(devAuthToken), member: null, getToken: async () => devAuthToken ?? null, signOut: async () => undefined });
const tokenCache = { getToken: (key: string) => SecureStore.getItemAsync(key), saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value) };

/**
 * Native Clerk ignores `proxyUrl`, and the production Clerk subdomain has no DNS,
 * so rewrite every Clerk API request to the web app's /__clerk proxy. The instance
 * is a singleton, so ClerkProvider reuses this one.
 */
type ClerkRequest = { url?: URL };
if (!localPreviewEnabled && CLERK_PUBLISHABLE_KEY && CLERK_PROXY_URL) {
  const proxy = CLERK_PROXY_URL;
  const clerk = getClerkInstance({ publishableKey: CLERK_PUBLISHABLE_KEY, tokenCache }) as unknown as { __unstable__onBeforeRequest: (cb: (req: ClerkRequest) => void | Promise<void>) => void };
  clerk.__unstable__onBeforeRequest((req) => {
    if (req.url && !req.url.href.startsWith(proxy)) req.url = new URL(`${proxy}${req.url.pathname}${req.url.search}`);
  });
}

function ClerkBridge({ children }: PropsWithChildren) {
  const { getToken, isLoaded, isSignedIn, signOut, userId } = useAuth();
  // Clerk hands back new getToken/signOut functions on every render. Keep the latest in
  // refs so the membership check runs once per signed-in user instead of on every render
  // (which looped: check -> re-render -> check, and the app never left "Checking").
  const getTokenRef = useRef(getToken);
  const signOutRef = useRef(signOut);
  useEffect(() => { getTokenRef.current = getToken; signOutRef.current = signOut; }, [getToken, signOut]);
  const [member, setMember] = useState<BtpMember | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const checkMembership = useCallback(async () => {
    if (!liveApiConfigured) return;
    setChecking(true); setError(""); setNotFound(false);
    try {
      const result = await api.session(await getTokenRef.current());
      setMember(result.member);
    } catch (e) {
      setMember(null);
      if (e instanceof ApiError && e.status === 404) setNotFound(true);
      else setError(e instanceof Error ? e.message : "Could not verify your BTP membership.");
    } finally { setChecking(false); }
  }, []);
  const stableSignOut = useCallback(() => signOutRef.current(), []);
  const [slow, setSlow] = useState(false);
  useEffect(() => { if (isLoaded) return; const t = setTimeout(() => setSlow(true), 10000); return () => clearTimeout(t); }, [isLoaded]);
  useEffect(() => { if (isLoaded && isSignedIn && userId) void checkMembership(); }, [checkMembership, isLoaded, isSignedIn, userId]);
  useEffect(() => { if (isLoaded && !isSignedIn) { setMember(null); setError(""); setNotFound(false); setChecking(true); } }, [isLoaded, isSignedIn]);
  const value = useMemo<AuthState>(() => ({ configured: true, ready: true, signedIn: true, member, getToken: () => getTokenRef.current(), signOut: stableSignOut }), [member, stableSignOut]);
  if (!isLoaded) return <View style={styles.center}><Mark size={30} /><ActivityIndicator color={colors.accent}/>{slow ? <Text style={styles.checking}>Can’t reach BTP. Check your connection, then close and reopen the app.</Text> : null}</View>;
  if (!isSignedIn) return <SignInScreen/>;
  if (!liveApiConfigured) return <AccessScreen title="App setup needed" copy="This build is not connected to the BTP service." onRetry={checkMembership} onSignOut={stableSignOut} retryLabel="Try again" />;
  if (checking) return <View style={styles.center}><ActivityIndicator color={colors.accent}/><Text style={styles.checking}>Checking your access…</Text></View>;
  if (error) return <AccessScreen title="Could not verify access" copy={error} onRetry={checkMembership} onSignOut={stableSignOut} retryLabel="Retry" />;
  if (notFound) return <AccessScreen title="Account not ready" copy="BTP could not set up your member account. Try again, or contact BTP support." onRetry={checkMembership} onSignOut={stableSignOut} retryLabel="Check again" />;
  if (!member?.approved) {
    const rejected = member?.verificationStatus?.toLowerCase() === "rejected";
    return rejected
      ? <AccessScreen status="Not approved" tone="error" title="Access was not approved." copy="If you think this is a mistake, contact BTP support." onRetry={() => Linking.openURL(`${SITE_URL}/support`)} onSignOut={stableSignOut} retryLabel="Contact support" />
      : <AccessScreen status="Access review in progress" title="Your request is with BTP." copy="BTP reviews every account before granting access. You’ll get an email when it is approved." privacy onRetry={checkMembership} onSignOut={stableSignOut} retryLabel="Check status" secondary={{ label: "Finish verification on the website", onPress: () => void Linking.openURL(`${SITE_URL}/onboarding`) }} />;
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function AccessScreen({ title, copy, onRetry, onSignOut, retryLabel, status, tone, privacy, secondary }: { title: string; copy: string; onRetry: () => Promise<unknown> | void; onSignOut: () => Promise<void>; retryLabel: string; status?: string; tone?: "error"; privacy?: boolean; secondary?: { label: string; onPress: () => void } }) {
  return <SafeAreaView style={styles.flex}><ScrollView contentContainerStyle={styles.access}>
    <Mark size={24} />
    {status ? <View style={[styles.status, tone === "error" && styles.statusError]}><Text style={[styles.statusText, tone === "error" && { color: colors.danger }]}>{status}</Text></View> : null}
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.copy}>{copy}</Text>
    {privacy ? <View style={styles.split}>
      <View style={styles.splitCol}><Text style={styles.splitHead}>Kept private by BTP</Text><Text style={styles.splitItem}>Email and name</Text><Text style={styles.splitItem}>Employer</Text><Text style={styles.splitItem}>Verification evidence</Text></View>
      <View style={styles.splitCol}><Text style={styles.splitHead}>Members see</Text><Text style={styles.splitItem}>Your handle</Text><Text style={styles.splitItem}>A general role</Text><Text style={styles.splitItem}>What you post</Text></View>
    </View> : null}
    <Button label={retryLabel} onPress={() => void onRetry()} />
    {secondary ? <Button label={secondary.label} onPress={secondary.onPress} variant="ghost" /> : null}
    <Pressable accessibilityRole="button" onPress={() => void onSignOut()} style={styles.textButton}><Text style={styles.note}>Wrong account? <Text style={styles.link}>Sign out</Text></Text></Pressable>
  </ScrollView></SafeAreaView>;
}

type Step = "password" | "email" | "email2" | "totp" | "phone" | "backup";

function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [code, setCode] = useState(""); const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>("password");
  const [emailAddressId, setEmailAddressId] = useState("");
  const passwordRef = useRef<TextInput>(null);
  const showError = (e: unknown) => Alert.alert("Could not sign in", (e as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0]?.longMessage || (e as { errors?: Array<{ message?: string }> }).errors?.[0]?.message || (e instanceof Error ? e.message : "Please retry."));
  const goTo = (next: Step) => { setStep(next); setCode(""); };
  async function advance(result: NonNullable<typeof signIn>) {
    if (result.status === "complete") { await setActive!({ session: result.createdSessionId }); return; }
    if (result.status === "needs_second_factor") {
      const factors = result.supportedSecondFactors || [];
      if (factors.some(f => f.strategy === "totp")) { goTo("totp"); return; }
      const phone = factors.find(f => f.strategy === "phone_code");
      if (phone?.strategy === "phone_code") { await result.prepareSecondFactor({ strategy: "phone_code", phoneNumberId: phone.phoneNumberId }); goTo("phone"); return; }
      // New-device check (Client Trust) asks for a code sent to the account email.
      const emailFactor = factors.find(f => f.strategy === "email_code");
      if (emailFactor?.strategy === "email_code") { await result.prepareSecondFactor({ strategy: "email_code", emailAddressId: emailFactor.emailAddressId }); setEmailAddressId(emailFactor.emailAddressId); goTo("email2"); return; }
      if (factors.some(f => f.strategy === "backup_code")) { goTo("backup"); return; }
    }
    throw new Error("This account requires another sign-in method. Contact BTP support for help.");
  }
  async function sendEmailCode() {
    if (!signIn) return;
    const result = await signIn.create({ identifier: email.trim() });
    const factor = result.supportedFirstFactors?.find(f => f.strategy === "email_code");
    if (factor?.strategy !== "email_code") throw new Error("Email-code sign-in is unavailable for this account. Contact BTP support to recover access.");
    await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId: factor.emailAddressId });
    setEmailAddressId(factor.emailAddressId); goTo("email");
  }
  async function run(action: () => Promise<void>) {
    if (!isLoaded || !signIn || busy) return;
    Keyboard.dismiss(); setBusy(true);
    try { await action(); } catch (e) { showError(e); } finally { setBusy(false); }
  }
  const submit = () => run(async () => {
    if (!signIn) return;
    if (step === "password") await advance(await signIn.create({ identifier: email.trim(), password }));
    else if (step === "email") await advance(await signIn.attemptFirstFactor({ strategy: "email_code", code: code.trim() }));
    else if (step === "email2") await advance(await signIn.attemptSecondFactor({ strategy: "email_code", code: code.trim() }));
    else await advance(await signIn.attemptSecondFactor({ strategy: step === "phone" ? "phone_code" : step === "backup" ? "backup_code" : "totp", code: code.trim() }));
  });
  const resend = () => run(async () => {
    if (!signIn) return;
    if (step === "email") await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId });
    else if (step === "email2") await signIn.prepareSecondFactor({ strategy: "email_code", emailAddressId });
    Alert.alert("Code sent", "Check your email for a new code.");
  });
  const canSubmit = !busy && (step === "password" ? Boolean(email.trim() && password) : Boolean(code.trim()));
  const canEmail = !busy && Boolean(email.trim());
  const codeHint = step === "totp" ? "Enter the code from your authenticator." : step === "backup" ? "Enter a backup code." : step === "phone" ? "Enter the code sent to your phone." : `Enter the code sent to ${email.trim() || "your email"}.`;
  return <SafeAreaView style={styles.flex}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.signIn} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
    <Mark size={26} />
    {step === "password"
      ? <Text accessibilityRole="header" style={styles.line}>Hard questions. Practical answers. <Text style={styles.lineAccent}>Experience you won’t find in a protocol.</Text></Text>
      : <Text accessibilityRole="header" style={styles.title}>Verify your sign in</Text>}
    <Text style={styles.copy}>{step === "password" ? "Welcome back. Sign in with your password, or have a sign-in code sent to your email." : codeHint}</Text>
    {step === "password"
      ? <><Text style={styles.label}>Email</Text><TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" autoCorrect={false} keyboardType="email-address" onChangeText={setEmail} onSubmitEditing={() => passwordRef.current?.focus()} placeholder="you@example.com" placeholderTextColor={colors.faint} returnKeyType="next" submitBehavior="submit" style={styles.input} textContentType="emailAddress" value={email}/>
         <Text style={styles.label}>Password</Text><TextInput ref={passwordRef} accessibilityLabel="Password" autoCapitalize="none" autoComplete="password" onChangeText={setPassword} onSubmitEditing={() => { if (canSubmit) void submit(); else Keyboard.dismiss(); }} placeholder="Password" placeholderTextColor={colors.faint} returnKeyType="go" secureTextEntry style={styles.input} textContentType="password" value={password}/></>
      : <TextInput accessibilityLabel="Verification code" autoCapitalize="none" autoComplete="one-time-code" autoFocus keyboardType={step === "backup" ? "default" : "number-pad"} onChangeText={setCode} placeholder="Verification code" placeholderTextColor={colors.faint} style={styles.input} textContentType="oneTimeCode" value={code}/>}
    <Button busy={busy} disabled={!canSubmit} label={step === "password" ? "Sign in" : "Continue"} onPress={() => void submit()} />
    {step === "password"
      ? <Button disabled={!canEmail} label="Email me a sign-in code" onPress={() => void run(sendEmailCode)} variant="ghost" />
      : <>{(step === "email" || step === "email2") && <Button disabled={busy} label="Resend code" onPress={() => void resend()} variant="ghost" />}
          <Button disabled={busy} label="Start again" onPress={() => goTo("password")} variant="ghost" />
          {(step === "totp" || step === "phone") && <Pressable accessibilityRole="button" onPress={() => goTo("backup")} style={styles.textButton}><Text style={styles.link}>Use a backup code</Text></Pressable>}</>}
    <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`${SITE_URL}/join`)} style={styles.textButton}><Text style={styles.note}>New to BTP? <Text style={styles.link}>Request early access</Text></Text></Pressable>
    <Text style={[styles.note, styles.footer]}>Behind The Protocol Inc. · <Text onPress={() => void Linking.openURL(`${SITE_URL}/privacy`)} style={styles.footLink}>Privacy</Text> · <Text onPress={() => void Linking.openURL(`${SITE_URL}/support`)} style={styles.footLink}>Support</Text></Text>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

export function BtpAuthProvider({ children }: PropsWithChildren) {
  // Inline condition so release builds strip the preview shell and its sample member.
  if (__DEV__ && process.env.EXPO_PUBLIC_ENABLE_LOCAL_PREVIEW === "true") {
    const previewAuth: AuthState = { configured: true, ready: true, signedIn: true, member: { id: "preview", handle: "quietpine", roleCategory: "Site coordinator", roleLabel: "Site coordinator", verificationStatus: "Approved", approved: true }, getToken: async () => devAuthToken ?? null, signOut: async () => undefined };
    return <View style={styles.previewShell}><View style={styles.previewBanner}><Text style={styles.previewBannerText}>LOCAL PREVIEW · SAMPLE CONTENT · NOT THE LIVE COMMUNITY</Text></View><View style={styles.previewContent}><AuthContext.Provider value={previewAuth}>{children}</AuthContext.Provider></View></View>;
  }
  if (!CLERK_PUBLISHABLE_KEY || !liveApiConfigured) {
    return <View style={styles.access}><Mark size={24} /><Text style={styles.title}>App setup required</Text><Text style={styles.copy}>This build cannot connect securely because {configurationIssues.join(" and ")} {configurationIssues.length === 1 ? "is" : "are"} not configured. Install a correctly configured build or contact BTP.</Text></View>;
  }
  return <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}><ClerkBridge>{children}</ClerkBridge></ClerkProvider>;
}
export function useBtpAuth() { return useContext(AuthContext); }

const styles = StyleSheet.create({
  center: { alignItems: "center", backgroundColor: colors.background, flex: 1, gap: spacing.md, justifyContent: "center", padding: spacing.lg },
  checking: { ...type.small, textAlign: "center" },
  flex: { backgroundColor: colors.background, flex: 1 },
  access: { backgroundColor: colors.background, flexGrow: 1, gap: spacing.md, justifyContent: "center", padding: spacing.lg },
  signIn: { backgroundColor: colors.background, flexGrow: 1, gap: 12, justifyContent: "center", padding: spacing.lg },
  line: { color: colors.inkStrong, fontFamily: fonts.serif, fontSize: 27, lineHeight: 34, marginTop: spacing.sm },
  lineAccent: { color: colors.accentBright, fontFamily: fonts.serifItalic },
  title: { ...type.display, marginTop: spacing.xs },
  copy: { ...type.body, color: colors.muted, marginBottom: spacing.xs },
  label: { color: colors.ink, fontFamily: fonts.sansMedium, fontSize: 13.5, marginBottom: -4 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.inkStrong, fontFamily: fonts.sans, fontSize: 16, minHeight: 50, paddingHorizontal: 15, paddingVertical: 13 },
  textButton: { alignItems: "center", minHeight: 40, justifyContent: "center" },
  note: { ...type.small, textAlign: "center" },
  link: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, textDecorationLine: "underline" },
  footer: { fontSize: 12.5, marginTop: spacing.md },
  footLink: { textDecorationLine: "underline" },
  status: { alignSelf: "flex-start", backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 5 },
  statusError: { backgroundColor: colors.dangerSoft },
  statusText: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 12 },
  split: { flexDirection: "row", gap: spacing.sm },
  splitCol: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flex: 1, gap: 4, padding: 12 },
  splitHead: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 12.5, marginBottom: 2 },
  splitItem: { color: colors.ink, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
  previewShell: { flex: 1 },
  previewContent: { flex: 1 },
  previewBanner: { alignItems: "center", backgroundColor: "#5A3A12", paddingHorizontal: spacing.sm, paddingVertical: 5 },
  previewBannerText: { color: colors.inkStrong, fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.5 },
});
