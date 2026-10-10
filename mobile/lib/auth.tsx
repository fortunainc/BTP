import { ClerkProvider, useAuth, useSignIn } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, spacing } from "@/constants/theme";

type AuthState = { configured: boolean; ready: boolean; signedIn: boolean; getToken: () => Promise<string | null>; signOut: () => Promise<void> };
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const devToken = process.env.EXPO_PUBLIC_DEV_AUTH_TOKEN;
const AuthContext = createContext<AuthState>({ configured: Boolean(devToken), ready: true, signedIn: Boolean(devToken), getToken: async () => devToken ?? null, signOut: async () => undefined });
const tokenCache = { getToken: (key: string) => SecureStore.getItemAsync(key), saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value) };

function ClerkBridge({ children }: PropsWithChildren) {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();
  if (!isLoaded) return <View style={styles.center}><ActivityIndicator color={colors.accent}/></View>;
  if (!isSignedIn) return <SignInScreen/>;
  return <AuthContext.Provider value={{ configured: true, ready: true, signedIn: true, getToken: async () => getToken(), signOut }}>{children}</AuthContext.Provider>;
}

function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false);
  const submit=async()=>{if(!isLoaded)return;setBusy(true);try{const result=await signIn.create({identifier:email,password});if(result.status==="complete")await setActive({session:result.createdSessionId});else Alert.alert("More verification needed","Complete the requested sign-in verification in your BTP account.");}catch(e){const message=(e as {errors?:Array<{longMessage?:string}>}).errors?.[0]?.longMessage||"Check your email and password.";Alert.alert("Could not sign in",message);}finally{setBusy(false);}};
  return <View style={styles.signIn}><Text style={styles.brand}>BTP</Text><Text style={styles.title}>Welcome back</Text><Text style={styles.copy}>Invite-only access for verified clinical-trial professionals.</Text><TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Work or verified email" placeholderTextColor={colors.muted} style={styles.input} value={email}/><TextInput autoCapitalize="none" autoComplete="password" onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} value={password}/><Pressable disabled={busy||!email||!password} onPress={()=>void submit()} style={[styles.button,(busy||!email||!password)&&styles.disabled]}><Text style={styles.buttonText}>{busy?"Signing in…":"Sign in"}</Text></Pressable><Text style={styles.note}>Need access? BTP beta accounts are created by invitation.</Text></View>;
}

export function BtpAuthProvider({ children }: PropsWithChildren) {
  if (!publishableKey) return <>{children}</>;
  return <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}><ClerkBridge>{children}</ClerkBridge></ClerkProvider>;
}
export function useBtpAuth() { return useContext(AuthContext); }

const styles=StyleSheet.create({center:{alignItems:"center",backgroundColor:colors.background,flex:1,justifyContent:"center"},signIn:{backgroundColor:colors.background,flex:1,gap:spacing.md,justifyContent:"center",padding:spacing.lg},brand:{color:colors.accent,fontSize:14,fontWeight:"900",letterSpacing:3},title:{color:colors.ink,fontSize:32,fontWeight:"700"},copy:{color:colors.muted,fontSize:15,lineHeight:22,marginBottom:spacing.sm},input:{backgroundColor:colors.surface,borderColor:colors.border,borderRadius:14,borderWidth:1,color:colors.ink,fontSize:16,padding:15},button:{alignItems:"center",backgroundColor:colors.accent,borderRadius:14,padding:16},buttonText:{color:colors.white,fontSize:16,fontWeight:"700"},disabled:{opacity:.45},note:{color:colors.muted,fontSize:12,lineHeight:18,textAlign:"center"}});
