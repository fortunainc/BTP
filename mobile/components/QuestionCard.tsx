import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { colors, spacing } from "@/constants/theme";
import type { QuestionSummary } from "@/types/question";

export function QuestionCard({ question }: { question: QuestionSummary }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/question/[id]", params: { id: question.id } })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.metaRow}>
        <Text style={styles.role}>{question.role}</Text>
        <Text style={styles.time}>{question.createdLabel}</Text>
      </View>
      <Text numberOfLines={3} style={styles.title}>{question.title}</Text>
      <View style={styles.footer}>
        <View style={styles.tag}><Text style={styles.tagText}>{question.topic}</Text></View>
        <View style={styles.answers}>
          <Ionicons color={colors.muted} name={question.hasVisibleAnswer ? "checkmark-circle-outline" : "chatbubble-outline"} size={15} />
          <Text style={styles.answerText}>{question.hasVisibleAnswer ? "Answered" : "Needs an answer"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  pressed: { opacity: 0.72 },
  metaRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  role: { fontFamily: "Geist", color: colors.accent, fontSize: 12, fontWeight: "700" },
  time: { fontFamily: "Geist", color: colors.muted, fontSize: 12 },
  title: { fontFamily: "Geist", color: colors.ink, fontSize: 16, fontWeight: "600", lineHeight: 23 },
  footer: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  tag: { backgroundColor: colors.accentSoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontFamily: "Geist", color: colors.accent, fontSize: 11, fontWeight: "700" },
  answers: { alignItems: "center", flexDirection: "row", gap: 5 },
  answerText: { fontFamily: "Geist", color: colors.muted, fontSize: 12 },
});
