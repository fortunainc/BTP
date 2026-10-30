import { type PropsWithChildren, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { AboutBtp } from "@/components/AboutBtp";
import { Loading } from "@/components/ui";
import { useBtpAuth } from "@/lib/auth";

// Per member and device. Reopening About BTP never resets the first-visit flag.
export function WelcomeGate({ children }: PropsWithChildren) {
  const { member } = useBtpAuth();
  const key = member?.approved ? `btp.welcome.v1.${encodeURIComponent(member.id).replace(/%/g, "_")}` : null;
  const [state, setState] = useState<{ key: string | null; seen: boolean } | null>(null);
  useEffect(() => {
    let active = true;
    if (!key) return;
    const read = async () => {
      try {
        const value = Platform.OS === "web" ? localStorage.getItem(key) : await SecureStore.getItemAsync(key);
        if (active) setState({ key, seen: value === "seen" });
      } catch {
        if (active) setState({ key, seen: false });
      }
    };
    void read();
    return () => { active = false; };
  }, [key]);
  if (!key) return children;
  if (state?.key !== key) return <Loading label="Opening BTP…" />;
  if (key && !state.seen) return <AboutBtp onContinue={() => {
    // Storage failure must never trap a member outside the community.
    setState({ key, seen: true });
    void (async () => {
      try {
        if (Platform.OS === "web") localStorage.setItem(key, "seen");
        else await SecureStore.setItemAsync(key, "seen");
      } catch { /* The welcome may appear next launch; access still works. */ }
    })();
  }} />;
  return children;
}
