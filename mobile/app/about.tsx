import { router } from "expo-router";
import { AboutBtp } from "@/components/AboutBtp";

export default function AboutScreen() {
  return <AboutBtp onBack={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/you")} />;
}
