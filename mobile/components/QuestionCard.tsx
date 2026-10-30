import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthorLine } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/constants/theme";
import type { QuestionSummary } from "@/types/question";

export function QuestionCard({ question }: { question: QuestionSummary }) {
  return (
    <Pressable
      accessibilityHint="Opens the question and its answers"
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/question/[id]", params: { id: question.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <AuthorLine handle={question.authorHandle} mine={question.isAuthor} role={question.role} time={question.createdLabel} />
      <Text numberOfLines={3} style={styles.title}>{question.title}</Text>
      <View style={styles.footer}>
        <Text numberOfLines={1} style={styles.tag}>{question.topic}</Text>
        <View style={styles.answers}>
          <Ionicons color={question.hasVisibleAnswer ? colors.muted : colors.accentBright} name={question.hasVisibleAnswer ? "chatbubble-ellipses-outline" : "help-circle-outline"} size={15} />
          <Text style={[styles.answerText, !question.hasVisibleAnswer && styles.needs]}>{question.hasVisibleAnswer ? "Answered" : "Needs an answer"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: 9, padding: spacing.md },
  pressed: { backgroundColor: colors.surfaceRaised },
  title: { color: colors.inkStrong, fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 23 },
  footer: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between", marginTop: 2 },
  tag: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, color: colors.accentBright, flexShrink: 1, fontFamily: fonts.sansMedium, fontSize: 12, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 4 },
  answers: { alignItems: "center", flexDirection: "row", gap: 5 },
  answerText: { color: colors.muted, fontFamily: fonts.sans, fontSize: 12.5 },
  needs: { color: colors.accentBright, fontFamily: fonts.sansMedium },
});
