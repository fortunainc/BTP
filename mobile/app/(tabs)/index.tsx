import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppScreen } from "@/components/AppScreen";
import { QuestionCard } from "@/components/QuestionCard";
import { colors, spacing } from "@/constants/theme";
import { api, liveApiConfigured } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import type { QuestionSummary } from "@/types/question";

export default function HomeScreen() {
  const auth = useBtpAuth();
  const { getToken, signedIn } = auth;
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState(liveApiConfigured);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!liveApiConfigured || !signedIn) return;
    setLoading(true); setError("");
    try { setQuestions((await api.questions.list(await getToken())).slice(0, 3)); }
    catch (e) { setQuestions([]); setError(e instanceof Error ? e.message : "Could not load questions."); }
    finally { setLoading(false); }
  }, [getToken, signedIn]);
  useEffect(() => { void load(); }, [load]);
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
      {loading ? <View style={styles.state}><ActivityIndicator color={colors.accent}/><Text style={styles.stateText}>Loading questions…</Text></View> : error ? <View style={styles.state}><Text style={styles.errorTitle}>Questions are unavailable</Text><Text style={styles.stateText}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View> : questions.length === 0 ? <View style={styles.state}><Text style={styles.emptyTitle}>No questions need an answer yet</Text><Text style={styles.stateText}>You can ask the first question or check again later.</Text></View> : questions.map((question) => <QuestionCard key={question.id} question={question} />)}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs, marginBottom: spacing.sm },
  eyebrow: {fontFamily: "CormorantGaramond-Italic", color: colors.accent, fontSize: 28, letterSpacing: 1 },
  title: { fontFamily: "Geist", color: colors.ink, fontSize: 30, fontWeight: "700" },
  subtitle: {fontFamily: "Geist", color: colors.muted, fontSize: 16, lineHeight: 23 },
  askCard: { backgroundColor: colors.accent, borderRadius: 22, gap: 8, padding: 20 },
  askLabel: { fontFamily: "Geist", color: colors.warm, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  askTitle: { fontFamily: "Geist", color: colors.white, fontSize: 21, fontWeight: "700", lineHeight: 28 },
  askHint: { fontFamily: "Geist", color: colors.vellum, fontSize: 13, lineHeight: 19 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  sectionTitle: { fontFamily: "Geist", color: colors.ink, fontSize: 19, fontWeight: "700" },
  link: { fontFamily: "Geist", color: colors.accent, fontSize: 14, fontWeight: "700" },
  state: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  stateText: { fontFamily: "Geist", color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  errorTitle: { fontFamily: "Geist", color: colors.danger, fontSize: 16, fontWeight: "700" },
  emptyTitle: { fontFamily: "Geist", color: colors.ink, fontSize: 16, fontWeight: "700" },
  retry: { borderColor: colors.accent, borderRadius: 12, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { fontFamily: "Geist", color: colors.accent, fontWeight: "700" },
});
