import { ClerkProvider, useAuth, useSignIn } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, spacing } from "@/constants/theme";
import { api, ApiError, liveApiConfigured } from "@/lib/api";
import { CLERK_PUBLISHABLE_KEY, configurationIssues, devAuthToken, localPreviewEnabled } from "@/lib/config";

export type BtpMember = { id: string; handle: string; roleCategory?: string | null; companyCategory?: string | null; verificationStatus?: string | null; approved: boolean };
type AuthState = { configured: boolean; ready: boolean; signedIn: boolean; member: BtpMember | null; getToken: () => Promise<string | null>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState>({ configured: Boolean(devAuthToken), ready: true, signedIn: Boolean(devAuthToken), member: null, getToken: async () => devAuthToken ?? null, signOut: async () => undefined });
const tokenCache = { getToken: (key: string) => SecureStore.getItemAsync(key), saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value) };

function ClerkBridge({ children }: PropsWithChildren) {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();
  const [member, setMember] = useState<BtpMember | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const checkMembership = useCallback(async () => {
    if (!isSignedIn || !liveApiConfigured) return;
    setChecking(true); setError(""); setNotFound(false);
    try {
      const result = await api.session(await getToken());
      setMember(result.member);
    } catch (e) {
      setMember(null);
      if (e instanceof ApiError && e.status === 404) setNotFound(true);
      else setError(e instanceof Error ? e.message : "Could not verify your BTP membership.");
    } finally { setChecking(false); }
  }, [getToken, isSignedIn]);
  useEffect(() => { if (isLoaded && isSignedIn) void checkMembership(); }, [checkMembership, isLoaded, isSignedIn]);
  if (!isLoaded) return <View style={styles.center}><ActivityIndicator color={colors.accent}/></View>;
  if (!isSignedIn) return <SignInScreen/>;
  if (!liveApiConfigured) return <AccessScreen title="App setup needed" copy="This build is not connected to the BTP service." onRetry={checkMembership} onSignOut={signOut} retryLabel="Try again" />;
  if (checking) return <View style={styles.center}><ActivityIndicator color={colors.accent}/><Text style={styles.checking}>Checking your BTP membership…</Text></View>;
  if (error) return <AccessScreen title="Could not verify access" copy={error} onRetry={checkMembership} onSignOut={signOut} retryLabel="Retry" />;
  if (notFound) return <AccessScreen title="Invitation setup incomplete" copy="This sign-in is not connected to a BTP member account yet. Contact BTP to finish your invitation." onRetry={checkMembership} onSignOut={signOut} retryLabel="Check again" />;
  if (!member?.approved) {
    const rejected = member?.verificationStatus?.toLowerCase() === "rejected";
    return <AccessScreen title={rejected ? "Access not approved" : "Verification pending"} copy={rejected ? "This account is not approved for the BTP beta. Contact BTP if you think this is an error." : "BTP is reviewing your invitation and professional verification. You’ll be able to enter once it is approved."} onRetry={checkMembership} onSignOut={signOut} retryLabel="Check status" />;
  }
  return <AuthContext.Provider value={{ configured: true, ready: true, signedIn: true, member, getToken: async () => getToken(), signOut }}>{children}</AuthContext.Provider>;
}

function AccessScreen({ title, copy, onRetry, onSignOut, retryLabel }: { title: string; copy: string; onRetry: () => Promise<void>; onSignOut: () => Promise<void>; retryLabel: string }) {
  return <View style={styles.access}><Text style={styles.brand}>BTP</Text><Text style={styles.title}>{title}</Text><Text style={styles.copy}>{copy}</Text><Pressable onPress={() => void onRetry()} style={styles.button}><Text style={styles.buttonText}>{retryLabel}</Text></Pressable><Pressable onPress={() => void onSignOut()} style={styles.secondary}><Text style={styles.secondaryText}>Sign out</Text></Pressable></View>;
}

function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [code, setCode] = useState(""); const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"password" | "email" | "totp" | "phone" | "backup">("password");
  const showError = (e: unknown) => Alert.alert("Could not sign in", (e as { errors?: Array<{ longMessage?: string }> }).errors?.[0]?.longMessage || (e instanceof Error ? e.message : "Please retry."));
  async function advance(result: NonNullable<typeof signIn>) {
    if (result.status === "complete") { await setActive!({ session: result.createdSessionId }); return; }
    if (result.status === "needs_second_factor") {
      const factors = result.supportedSecondFactors || [];
      if (factors.some(f => f.strategy === "totp")) { setStep("totp"); setCode(""); return; }
      const phone = factors.find(f => f.strategy === "phone_code");
      if (phone?.strategy === "phone_code") { await result.prepareSecondFactor({ strategy: "phone_code", phoneNumberId: phone.phoneNumberId }); setStep("phone"); setCode(""); return; }
      if (factors.some(f => f.strategy === "backup_code")) { setStep("backup"); setCode(""); return; }
    }
    throw new Error("This account requires another sign-in method. Contact BTP support for help.");
  }
  async function submit(emailOnly = false) {
    if (!isLoaded || !signIn || busy) return; setBusy(true);
    try {
      if (emailOnly) {
        const result = await signIn.create({ identifier: email.trim() });
        const factor = result.supportedFirstFactors?.find(f => f.strategy === "email_code");
        if (factor?.strategy !== "email_code") throw new Error("Email-code sign-in is unavailable for this account. Contact BTP support to recover access.");
        await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId: factor.emailAddressId }); setCode(""); setStep("email");
      } else if (step === "password") await advance(await signIn.create({ identifier: email.trim(), password }));
      else if (step === "email") await advance(await signIn.attemptFirstFactor({ strategy: "email_code", code }));
      else await advance(await signIn.attemptSecondFactor({ strategy: step === "phone" ? "phone_code" : step === "backup" ? "backup_code" : "totp", code }));
    } catch (e) { showError(e); } finally { setBusy(false); }
  }
  return <View style={styles.signIn}><Text style={styles.brand}>BTP</Text><Text style={styles.title}>{step === "password" ? "Welcome back" : "Verify your sign-in"}</Text><Text style={styles.copy}>Invite-only access for verified clinical-trial professionals.</Text>
    {step === "password" ? <><TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Work or verified email" placeholderTextColor={colors.muted} style={styles.input} value={email}/><TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete="password" onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} value={password}/></> : <><Text style={styles.copy}>{step === "totp" ? "Enter the code from your authenticator." : step === "backup" ? "Enter a backup code." : "Enter the code sent to your verified contact."}</Text><TextInput accessibilityLabel="Verification code" autoCapitalize="none" autoComplete="one-time-code" onChangeText={setCode} placeholder="Verification code" style={styles.input} value={code}/></>}
    <Pressable disabled={busy || (step === "password" ? !email || !password : !code)} onPress={() => void submit()} style={styles.button}><Text style={styles.buttonText}>{busy ? "Please wait…" : "Continue"}</Text></Pressable>
    {step === "password" ? <Pressable disabled={busy || !email} onPress={() => void submit(true)} style={styles.secondary}><Text style={styles.secondaryText}>Use an email code / recover access</Text></Pressable> : <><Pressable disabled={busy} onPress={() => { setStep("password"); setCode(""); }} style={styles.secondary}><Text style={styles.secondaryText}>Start again</Text></Pressable>{(step === "totp" || step === "phone") && <Pressable onPress={() => { setStep("backup"); setCode(""); }}><Text style={styles.secondaryText}>Use a backup code</Text></Pressable>}</>}
    <Text style={styles.note}>Need access? BTP beta accounts are created by invitation.</Text></View>;
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

const styles=StyleSheet.create({center: { alignItems:"center",backgroundColor:colors.background,flex:1,gap:spacing.md,justifyContent:"center",padding:spacing.lg},checking: { fontFamily: "Geist", color:colors.muted,fontSize:14},access: { backgroundColor:colors.background,flex:1,gap:spacing.md,justifyContent:"center",padding:spacing.lg},signIn: { backgroundColor:colors.background,flex:1,gap:spacing.md,justifyContent:"center",padding:spacing.lg},brand: {fontFamily: "CormorantGaramond-Italic", color:colors.accent,fontSize:28,letterSpacing:1},title: { fontFamily: "Geist", color:colors.ink,fontSize:32,fontWeight:"700"},copy: { fontFamily: "Geist", color:colors.muted,fontSize:15,lineHeight:22,marginBottom:spacing.sm},input: { fontFamily: "Geist", backgroundColor:colors.surface,borderColor:colors.border,borderRadius:14,borderWidth:1,color:colors.ink,fontSize:16,padding:15},button: { alignItems:"center",backgroundColor:colors.accent,borderRadius:14,padding:16},buttonText: { fontFamily: "Geist", color:colors.white,fontSize:16,fontWeight:"700"},secondary: { alignItems:"center",borderColor:colors.border,borderRadius:14,borderWidth:1,padding:15},secondaryText: { fontFamily: "Geist", color:colors.ink,fontSize:15,fontWeight:"700"},disabled: { opacity:.45},note: { fontFamily: "Geist", color:colors.muted,fontSize:12,lineHeight:18,textAlign:"center"},previewShell: { flex:1},previewContent: { flex:1},previewBanner: { alignItems:"center",backgroundColor:"#7C2D12",paddingHorizontal:spacing.sm,paddingVertical:6},previewBannerText: { fontFamily: "Geist", color:colors.white,fontSize:10,fontWeight:"900",letterSpacing:.5}});
