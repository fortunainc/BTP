import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { QuestionCard } from "@/components/QuestionCard";
import { colors, spacing } from "@/constants/theme";
import { previewQuestions } from "@/data/preview";

export default function QuestionsScreen() {
  return (
    <AppScreen>
      <Text style={styles.title}>Questions</Text>
      <View style={styles.search}>
        <Ionicons color={colors.muted} name="search" size={19} />
        <TextInput placeholder="Search questions, topics or roles" placeholderTextColor={colors.muted} style={styles.input} />
      </View>
      <Text style={styles.section}>Latest from verified members</Text>
      {previewQuestions.map((question) => <QuestionCard key={question.id} question={question} />)}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 30, fontWeight: "700" },
  search: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md },
  input: { color: colors.ink, flex: 1, fontSize: 15, paddingVertical: 14 },
  section: { color: colors.muted, fontSize: 13, fontWeight: "700", letterSpacing: 0.3, marginTop: spacing.sm, textTransform: "uppercase" },
});
