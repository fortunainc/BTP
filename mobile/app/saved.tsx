import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { AuthorLine, BackLink, Button, Loading, StateBox } from "@/components/ui";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { api } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import type { SavedAnswer } from "@/types/question";

export default function SavedAnswersScreen() {
  const { getToken, signedIn } = useBtpAuth();
  const [items, setItems] = useState<SavedAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!signedIn) return;
    setLoading(true); setError("");
    try { setItems(await api.saved.list(await getToken())); }
    catch { setError("Check your connection and try again."); }
    finally { setLoading(false); }
  }, [getToken, signedIn]);
  // Reload on return so answers saved or unsaved elsewhere stay current.
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <AppScreen>
    <BackLink label="You" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/you")} />
    <Text accessibilityRole="header" style={s.title}>Saved answers</Text>
    <Text style={s.subtitle}>Answers you saved, newest first. Only you can see this list.</Text>
    {loading && !items.length ? <Loading label="Loading saved answers" />
      : error ? <StateBox action={<Button label="Try again" onPress={() => void load()} style={{ alignSelf: "stretch" }} variant="ghost" />} copy={error} title="We couldn’t load saved answers." tone="error" />
      : !items.length ? <StateBox copy="Tap Save on any answer to keep it here." title="Nothing saved yet." />
      : items.map((item) => <Pressable accessibilityHint="Opens the question" accessibilityRole="button" key={item.answerId} onPress={() => router.push({ pathname: "/question/[id]", params: { id: item.situationId } })} style={({ pressed }) => [s.card, pressed && { backgroundColor: colors.surfaceRaised }]}>
          <Text numberOfLines={2} style={s.question}>{item.situationTitle}</Text>
          <View style={s.answer}>
            <AuthorLine handle={item.authorHandle} role={item.authorRole} />
            <Text numberOfLines={4} style={s.excerpt}>{item.excerpt}</Text>
          </View>
        </Pressable>)}
  </AppScreen>;
}

const s = StyleSheet.create({
  title: { ...type.display, fontSize: 28 },
  subtitle: { ...type.small, marginTop: -6 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: 10, padding: spacing.md },
  question: { color: colors.inkStrong, fontFamily: fonts.sansSemiBold, fontSize: 15.5, lineHeight: 22 },
  answer: { borderLeftColor: colors.borderStrong, borderLeftWidth: 2, gap: 5, paddingLeft: 12 },
  excerpt: { ...type.small, color: colors.ink },
});
