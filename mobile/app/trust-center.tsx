import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { SITE_URL } from "@/lib/links";

const sections = [
  { icon: "shield-checkmark-outline" as const, title: "Verified privately", copy: "BTP checks your experience. Verification evidence is never shown to members." },
  { icon: "eye-off-outline" as const, title: "What members see", copy: "Your handle and a general role. Never your name, email or employer." },
  { icon: "document-lock-outline" as const, title: "Before you post", copy: "Leave out patient information, names, protocol numbers and confidential documents. BTP checks for identifying details, and you stay in control of what you share." },
  { icon: "flag-outline" as const, title: "Reports", copy: "Reviewed privately by BTP. The reported member is not told who reported them." },
];

export default function TrustCenterScreen() {
  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}>
      <Pressable accessibilityLabel="Close" accessibilityRole="button" hitSlop={10} onPress={() => router.back()} style={styles.close}><Ionicons color={colors.ink} name="close" size={24} /></Pressable>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={type.eyebrow}>Privacy and trust</Text>
      <Text accessibilityRole="header" style={styles.title}>Identity protected in discussions. <Text style={styles.accent}>Verified privately by BTP.</Text></Text>
      {sections.map((s) => <View key={s.title} style={styles.card}>
        <Ionicons color={colors.accentBright} name={s.icon} size={21} />
        <View style={{ flex: 1, gap: 4 }}><Text style={styles.cardTitle}>{s.title}</Text><Text style={styles.cardText}>{s.copy}</Text></View>
      </View>)}
      <Text style={styles.note}>BTP does not promise absolute anonymity. Details you share can sometimes identify you. BTP reduces that risk with general labels, redaction, controlled access and private moderation.</Text>
      <Button label="Read the full privacy page" onPress={() => void Linking.openURL(`${SITE_URL}/privacy`)} variant="ghost" />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: "flex-end", paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  close: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  content: { gap: 14, padding: spacing.lg, paddingBottom: 44, paddingTop: 0 },
  title: { ...type.title, fontSize: 26, lineHeight: 33 },
  accent: { color: colors.accentBright, fontFamily: fonts.serifItalic },
  card: { alignItems: "flex-start", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: 12, padding: spacing.md },
  cardTitle: { color: colors.inkStrong, fontFamily: fonts.sansSemiBold, fontSize: 15 },
  cardText: { ...type.small },
  note: { ...type.small, color: colors.faint },
});
