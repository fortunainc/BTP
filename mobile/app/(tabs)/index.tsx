import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppScreen } from "@/components/AppScreen";
import { QuestionCard } from "@/components/QuestionCard";
import { colors, spacing } from "@/constants/theme";
import { previewQuestions } from "@/data/preview";
import { api, liveApiConfigured } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import type { QuestionSummary } from "@/types/question";

export default function HomeScreen() {
  const auth = useBtpAuth();
  const [questions, setQuestions] = useState<QuestionSummary[]>(previewQuestions);
  useEffect(() => { if (liveApiConfigured && auth.signedIn) void auth.getToken().then(api.questions.list).then((items) => setQuestions(items.slice(0, 3))).catch(() => undefined); }, [auth]);
  return (
    <AppScreen>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>BTP</Text>
        <Text style={styles.title}>Good morning.</Text>
        <Text style={styles.subtitle}>Your experience could help someone move forward today.</Text>
      </View>
      <Pressable onPress={() => router.push("/(tabs)/ask")} style={styles.askCard}>
        <Text style={styles.askLabel}>ASK BTP</Text>
        <Text style={styles.askTitle}>What question do you need help answering?</Text>
        <Text style={styles.askHint}>We’ll help remove identifying details before it is shared.</Text>
      </Pressable>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Needs your experience</Text>
        <Pressable onPress={() => router.push("/(tabs)/questions")}><Text style={styles.link}>See all</Text></Pressable>
      </View>
      {questions.map((question) => <QuestionCard key={question.id} question={question} />)}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs, marginBottom: spacing.sm },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.ink, fontSize: 30, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  askCard: { backgroundColor: colors.accent, borderRadius: 22, gap: 8, padding: 20 },
  askLabel: { color: colors.warm, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  askTitle: { color: colors.white, fontSize: 21, fontWeight: "700", lineHeight: 28 },
  askHint: { color: "#D8E8E1", fontSize: 13, lineHeight: 19 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: "700" },
  link: { color: colors.accent, fontSize: 14, fontWeight: "700" },
});
