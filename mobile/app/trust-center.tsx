import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/constants/theme";

const sections = [
  { icon: "shield-checkmark-outline" as const, title: "Verified privately", copy: "BTP reviews one credible professional signal, such as relevant LinkedIn history, a work-email check, a verified-member endorsement, or other evidence. Verification evidence is never shown to members." },
  { icon: "eye-off-outline" as const, title: "Identity protected in the community", copy: "Members see your handle and generalized professional perspective—not your account email, real name, exact employer, LinkedIn profile, or verification method." },
  { icon: "document-lock-outline" as const, title: "Post safely", copy: "Do not submit patient information, company or individual names, protocol identifiers, confidential documents, screenshots, unpublished results, or urgent safety reports. BTP scans for identifiers, but you remain in control of what you share." },
  { icon: "flag-outline" as const, title: "Human accountability", copy: "Report impersonation, confidentiality risks, harassment, solicitation, or unsafe advice. BTP reviews reports privately; the reported member is not told who reported them." },
];

export default function TrustCenterScreen() {
  return <View style={styles.safe}>
    <View style={styles.header}>
      <Pressable accessibilityLabel="Close Trust Center" onPress={() => router.back()} style={styles.back}><Ionicons color={colors.ink} name="close" size={24} /></Pressable>
      <Text style={styles.headerTitle}>Trust Center</Text><View style={styles.placeholder} />
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}><Text style={styles.eyebrow}>THE BTP PROMISE</Text><Text style={styles.title}>Identity protected in discussions. Verified privately by BTP.</Text><Text style={styles.intro}>BTP keeps limited confidential account information for verification, authentication, safety, and support. Your community identity is designed to protect your real-world identity from other members.</Text></View>
      {sections.map((section) => <View key={section.title} style={styles.card}><Ionicons color={colors.accent} name={section.icon} size={23} /><View style={styles.cardCopy}><Text style={styles.cardTitle}>{section.title}</Text><Text style={styles.cardText}>{section.copy}</Text></View></View>)}
      <View style={styles.note}><Text style={styles.noteTitle}>A precise promise</Text><Text style={styles.noteText}>BTP does not promise absolute anonymity. Details a member shares can sometimes identify them. BTP minimizes that risk with generalized labels, redaction, controlled access, and private moderation.</Text></View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1, paddingTop: 24 },
  header: { alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingBottom: 12, paddingHorizontal: spacing.md },
  back: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  headerTitle: { color: colors.ink, fontFamily: "Geist", fontSize: 17, fontWeight: "700" },
  placeholder: { width: 40 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 44 },
  hero: { gap: spacing.sm, paddingBottom: spacing.sm },
  eyebrow: { color: colors.antiqueGold, fontFamily: "Geist", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: colors.ink, fontFamily: "Geist", fontSize: 27, fontWeight: "700", lineHeight: 35 },
  intro: { color: colors.muted, fontFamily: "Geist", fontSize: 14, lineHeight: 22 },
  card: { alignItems: "flex-start", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: 12, padding: spacing.md },
  cardCopy: { flex: 1, gap: 5 }, cardTitle: { color: colors.ink, fontFamily: "Geist", fontSize: 15, fontWeight: "700" }, cardText: { color: colors.muted, fontFamily: "Geist", fontSize: 13, lineHeight: 20 },
  note: { backgroundColor: colors.accentSoft, borderRadius: 17, gap: 6, padding: spacing.md }, noteTitle: { color: colors.ink, fontFamily: "Geist", fontSize: 14, fontWeight: "700" }, noteText: { color: colors.muted, fontFamily: "Geist", fontSize: 12, lineHeight: 19 },
});
