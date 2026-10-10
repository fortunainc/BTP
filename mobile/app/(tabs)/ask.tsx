import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors, spacing } from "@/constants/theme";

export default function AskScreen() {
  const [question, setQuestion] = useState("");
  return (
    <AppScreen>
      <View style={styles.heading}>
        <Text style={styles.kicker}>ASK BTP</Text>
        <Text style={styles.title}>What question do you need help answering?</Text>
        <Text style={styles.subtitle}>Share enough context for someone experienced to help. BTP will check for identifying details before anything is posted.</Text>
      </View>
      <TextInput
        multiline
        onChangeText={setQuestion}
        placeholder="Describe the situation and what you need to decide..."
        placeholderTextColor={colors.muted}
        style={styles.input}
        textAlignVertical="top"
        value={question}
      />
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Keep it safe</Text>
        <Text style={styles.noticeText}>Leave out patient information, company names, protocol numbers and confidential study details.</Text>
      </View>
      <Pressable disabled={question.trim().length < 20} style={({ pressed }) => [styles.button, question.trim().length < 20 && styles.disabled, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Review my question</Text>
      </Pressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.sm },
  kicker: { color: colors.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "700", lineHeight: 35 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, color: colors.ink, fontSize: 16, lineHeight: 24, minHeight: 210, padding: spacing.md },
  notice: { backgroundColor: colors.accentSoft, borderRadius: 14, gap: 4, padding: 14 },
  noticeTitle: { color: colors.accent, fontSize: 13, fontWeight: "800" },
  noticeText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  button: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 15, padding: 16 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
