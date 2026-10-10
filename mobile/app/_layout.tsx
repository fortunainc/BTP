import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BtpAuthProvider } from "@/lib/auth";

export default function RootLayout() {
  return (
    <BtpAuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="question/[id]" />
      </Stack>
    </BtpAuthProvider>
  );
}
