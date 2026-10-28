import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { BtpAuthProvider } from "@/lib/auth";
import { colors } from "@/constants/theme";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist: require("@/assets/brand/Geist.ttf"),
    "CormorantGaramond-Italic": require("@/assets/brand/CormorantGaramond-Italic.ttf"),
  });

  // If a font fails to load, continue with system fonts rather than spinning forever.
  if (!fontsLoaded && !fontError) {
    return <View style={{ alignItems: "center", backgroundColor: colors.oxblood, flex: 1, justifyContent: "center" }}><ActivityIndicator color={colors.gilt} /></View>;
  }

  return (
    <BtpAuthProvider>
      <StatusBar style="light" backgroundColor={colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="question/[id]" />
        <Stack.Screen name="trust-center" options={{ presentation: "modal" }} />
      </Stack>
    </BtpAuthProvider>
  );
}
