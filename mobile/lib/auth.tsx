import { ClerkProvider, getClerkInstance, useAuth, useSignIn } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BookQuote } from "@/components/BookQuote";
import { colors, spacing } from "@/constants/theme";
import { api, ApiError, liveApiConfigured } from "@/lib/api";
import { CLERK_PROXY_URL, CLERK_PUBLISHABLE_KEY, configurationIssues, devAuthToken, localPreviewEnabled } from "@/lib/config";

export type BtpMember = { id: string; handle: string; roleCategory?: string | null; companyCategory?: string | null; verificationStatus?: string | null; approved: boolean };
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
  useEffect(() => { if (isLoaded) return; const t = setTimeout(() => setSlow(true), 15000); return () => clearTimeout(t); }, [isLoaded]);
  useEffect(() => { if (isLoaded && isSignedIn && userId) void checkMembership(); }, [checkMembership, isLoaded, isSignedIn, userId]);
  useEffect(() => { if (isLoaded && !isSignedIn) { setMember(null); setError(""); setNotFound(false); setChecking(true); } }, [isLoaded, isSignedIn]);
  const value = useMemo<AuthState>(() => ({ configured: true, ready: true, signedIn: true, member, getToken: () => getTokenRef.current(), signOut: stableSignOut }), [member, stableSignOut]);
  if (!isLoaded) return <View style={styles.center}><ActivityIndicator color={colors.accent}/>{slow ? <Text style={styles.checking}>Can’t reach BTP. Check your connection, then close and reopen the app.</Text> : null}</View>;
  if (!isSignedIn) return <SignInScreen/>;
  if (!liveApiConfigured) return <AccessScreen title="App setup needed" copy="This build is not connected to the BTP service." onRetry={checkMembership} onSignOut={stableSignOut} retryLabel="Try again" />;
  if (checking) return <View style={styles.center}><ActivityIndicator color={colors.accent}/><Text style={styles.checking}>Checking your BTP membership…</Text></View>;
  if (error) return <AccessScreen title="Could not verify access" copy={error} onRetry={checkMembership} onSignOut={stableSignOut} retryLabel="Retry" />;
  if (notFound) return <AccessScreen title="Account not ready" copy="BTP could not set up your member account. Try again, or contact BTP support." onRetry={checkMembership} onSignOut={stableSignOut} retryLabel="Check again" />;
  if (!member?.approved) {
    const rejected = member?.verificationStatus?.toLowerCase() === "rejected";
    return <AccessScreen title={rejected ? "Access not approved" : "Verification pending"} copy={rejected ? "This account is not approved for the BTP beta. Contact BTP if you think this is an error." : "BTP is reviewing your invitation and professional verification. You’ll be able to enter once it is approved."} onRetry={checkMembership} onSignOut={stableSignOut} retryLabel="Check status" />;
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function AccessScreen({ title, copy, onRetry, onSignOut, retryLabel }: { title: string; copy: string; onRetry: () => Promise<void>; onSignOut: () => Promise<void>; retryLabel: string }) {
  return <View style={styles.access}><Text style={styles.brand}>BTP</Text><Text style={styles.title}>{title}</Text><Text style={styles.copy}>{copy}</Text><Pressable onPress={() => void onRetry()} style={styles.button}><Text style={styles.buttonText}>{retryLabel}</Text></Pressable><Pressable onPress={() => void onSignOut()} style={styles.secondary}><Text style={styles.secondaryText}>Sign out</Text></Pressable></View>;
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
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.signIn} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"><Text style={styles.brand}>BTP</Text><Text style={styles.title}>{step === "password" ? "Welcome back" : "Verify your sign-in"}</Text><Text style={styles.copy}>Invite-only access for verified clinical-trial professionals.</Text>
    {step === "password" && <BookQuote compact />}
    {step === "password"
      ? <><TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" autoCorrect={false} keyboardType="email-address" onChangeText={setEmail} onSubmitEditing={() => passwordRef.current?.focus()} placeholder="Email address" placeholderTextColor={colors.muted} returnKeyType="next" submitBehavior="submit" style={styles.input} textContentType="emailAddress" value={email}/>
         <TextInput ref={passwordRef} accessibilityLabel="Password" autoCapitalize="none" autoComplete="password" onChangeText={setPassword} onSubmitEditing={() => { if (canSubmit) void submit(); else Keyboard.dismiss(); }} placeholder="Password (or use an email code below)" placeholderTextColor={colors.muted} returnKeyType="go" secureTextEntry style={styles.input} textContentType="password" value={password}/></>
      : <><Text style={styles.copy}>{codeHint}</Text><TextInput accessibilityLabel="Verification code" autoCapitalize="none" autoComplete="one-time-code" autoFocus keyboardType={step === "backup" ? "default" : "number-pad"} onChangeText={setCode} placeholder="Verification code" placeholderTextColor={colors.muted} style={styles.input} textContentType="oneTimeCode" value={code}/></>}
    <Pressable disabled={!canSubmit} onPress={() => void submit()} style={[styles.button, !canSubmit && styles.disabled]}><Text style={styles.buttonText}>{busy ? "Please wait…" : "Continue"}</Text></Pressable>
    {step === "password"
      ? <Pressable disabled={!canEmail} onPress={() => void run(sendEmailCode)} style={[styles.secondary, !canEmail && styles.disabled]}><Text style={styles.secondaryText}>Email me a sign-in code</Text></Pressable>
      : <>{(step === "email" || step === "email2") && <Pressable disabled={busy} onPress={() => void resend()} style={styles.secondary}><Text style={styles.secondaryText}>Resend code</Text></Pressable>}
          <Pressable disabled={busy} onPress={() => goTo("password")} style={styles.secondary}><Text style={styles.secondaryText}>Start again</Text></Pressable>
          {(step === "totp" || step === "phone") && <Pressable onPress={() => goTo("backup")}><Text style={styles.secondaryText}>Use a backup code</Text></Pressable>}</>}
    <Text style={styles.note}>No password? Enter your email and tap “Email me a sign-in code”. New here? Request access at the BTP website.</Text></ScrollView></KeyboardAvoidingView>;
}

export function BtpAuthProvider({ children }: PropsWithChildren) {
  if (localPreviewEnabled) {
    return <View style={styles.previewShell}><View style={styles.previewBanner}><Text style={styles.previewBannerText}>LOCAL PREVIEW · MEMBERSHIP CHECKS DISABLED</Text></View><View style={styles.previewContent}>{children}</View></View>;
  }
  if (!CLERK_PUBLISHABLE_KEY || !liveApiConfigured) {
    return <View style={styles.access}><Text style={styles.brand}>BTP</Text><Text style={styles.title}>App setup required</Text><Text style={styles.copy}>This build cannot connect securely because {configurationIssues.join(" and ")} {configurationIssues.length === 1 ? "is" : "are"} not configured. Install a correctly configured build or contact BTP.</Text></View>;
  }
  return <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}><ClerkBridge>{children}</ClerkBridge></ClerkProvider>;
}
export function useBtpAuth() { return useContext(AuthContext); }

const styles=StyleSheet.create({center: { alignItems:"center",backgroundColor:colors.background,flex:1,gap:spacing.md,justifyContent:"center",padding:spacing.lg},checking: { fontFamily: "Geist", color:colors.muted,fontSize:14},access: { backgroundColor:colors.background,flex:1,gap:spacing.md,justifyContent:"center",padding:spacing.lg},flex: { flex:1, backgroundColor:colors.background },signIn: { backgroundColor:colors.background,flexGrow:1,gap:spacing.md,justifyContent:"center",padding:spacing.lg},brand: {fontFamily: "CormorantGaramond-Italic", color:colors.accent,fontSize:28,letterSpacing:1},title: { fontFamily: "Geist", color:colors.ink,fontSize:32,fontWeight:"700"},copy: { fontFamily: "Geist", color:colors.muted,fontSize:15,lineHeight:22,marginBottom:spacing.sm},input: { fontFamily: "Geist", backgroundColor:colors.surface,borderColor:colors.border,borderRadius:14,borderWidth:1,color:colors.ink,fontSize:16,padding:15},button: { alignItems:"center",backgroundColor:colors.accent,borderRadius:14,padding:16},buttonText: { fontFamily: "Geist", color:colors.white,fontSize:16,fontWeight:"700"},secondary: { alignItems:"center",borderColor:colors.border,borderRadius:14,borderWidth:1,padding:15},secondaryText: { fontFamily: "Geist", color:colors.ink,fontSize:15,fontWeight:"700"},disabled: { opacity:.45},note: { fontFamily: "Geist", color:colors.muted,fontSize:12,lineHeight:18,textAlign:"center"},previewShell: { flex:1},previewContent: { flex:1},previewBanner: { alignItems:"center",backgroundColor:"#7C2D12",paddingHorizontal:spacing.sm,paddingVertical:6},previewBannerText: { fontFamily: "Geist", color:colors.white,fontSize:10,fontWeight:"900",letterSpacing:.5}});
