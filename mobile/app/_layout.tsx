import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { BtpAuthProvider } from "@/lib/auth";
import { colors } from "@/constants/theme";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Newsreader-Regular": require("@/assets/brand/Newsreader-Regular.ttf"),
    "Newsreader-Medium": require("@/assets/brand/Newsreader-Medium.ttf"),
    "Newsreader-Italic": require("@/assets/brand/Newsreader-Italic.ttf"),
    "Inter-Regular": require("@/assets/brand/Inter-Regular.ttf"),
    "Inter-Medium": require("@/assets/brand/Inter-Medium.ttf"),
    "Inter-SemiBold": require("@/assets/brand/Inter-SemiBold.ttf"),
    "Inter-Bold": require("@/assets/brand/Inter-Bold.ttf"),
    "CormorantGaramond-Italic": require("@/assets/brand/CormorantGaramond-Italic.ttf"),
  });

  // If a font fails to load, continue with system fonts rather than spinning forever.
  if (!fontsLoaded && !fontError) {
    return <View style={{ alignItems: "center", backgroundColor: colors.background, flex: 1, justifyContent: "center" }}><ActivityIndicator color={colors.accent} /></View>;
  }

  return (
    <BtpAuthProvider>
      <StatusBar style="light" backgroundColor={colors.background} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="question/[id]" />
        <Stack.Screen name="private-help" />
        <Stack.Screen name="saved" />
        <Stack.Screen name="paid-reviews" />
        <Stack.Screen name="trust-center" options={{ presentation: "modal" }} />
      </Stack>
    </BtpAuthProvider>
  );
}
