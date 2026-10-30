import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { QuestionCard } from "@/components/QuestionCard";
import { Button, Chip, Loading, Mark, StateBox } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/constants/theme";
import { api } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import { CATEGORIES, type QuestionSummary } from "@/types/question";

const NEEDS_ANSWER = "__unanswered";

export default function CommunityScreen() {
  const { getToken, signedIn } = useBtpAuth();
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const generation = useRef(0);

  const load = useCallback(async (cursor: string | null = null, pull = false, silent = false) => {
    if (!signedIn) return;
    const current = ++generation.current;
    if (cursor) setLoadingMore(true); else if (pull) setRefreshing(true); else if (!silent) setLoading(true);
    setError("");
    try {
      const result = await api.questions.page(await getToken(), { query: query.trim(), category: filter && filter !== NEEDS_ANSWER ? filter : null, unanswered: filter === NEEDS_ANSWER, cursor });
      if (current !== generation.current) return;
      setQuestions((previous) => cursor ? [...previous, ...result.items.filter((item) => !previous.some((old) => old.id === item.id))] : result.items);
      setNextCursor(result.nextCursor);
    } catch {
      if (current === generation.current) setError("Check your connection and try again.");
    } finally {
      if (current === generation.current) { setLoading(false); setLoadingMore(false); setRefreshing(false); }
    }
  }, [getToken, signedIn, query, filter]);

  useEffect(() => { const timer = setTimeout(() => { void load(); }, query ? 300 : 0); return () => { clearTimeout(timer); generation.current++; }; }, [load, query]);

  // Refresh quietly when returning to Community so new posts and answers appear.
  const firstFocus = useRef(true);
  useFocusEffect(useCallback(() => { if (firstFocus.current) { firstFocus.current = false; return; } void load(null, false, true); }, [load]));

  const filtered = Boolean(query.trim() || filter);
  const header = (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Mark size={18} />
        <Text accessibilityRole="header" style={styles.title}>Community</Text>
      </View>
      <Pressable accessibilityHint="Opens Ask" accessibilityRole="button" onPress={() => router.push("/(tabs)/ask")} style={({ pressed }) => [styles.askRow, pressed && { opacity: 0.8 }]}>
        <Text style={styles.askText}>What are you trying to solve?</Text>
        <Text style={styles.askAction}>Ask</Text>
      </Pressable>
      <View style={styles.search}>
        <Ionicons color={colors.faint} name="search" size={18} />
        <TextInput accessibilityLabel="Search questions" autoCorrect={false} clearButtonMode="while-editing" onChangeText={setQuery} placeholder="Search questions and topics" placeholderTextColor={colors.faint} returnKeyType="search" style={styles.input} value={query} />
      </View>
      <ScrollView horizontal contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>
        <Chip active={!filter} label="All" onPress={() => setFilter(null)} />
        <Chip active={filter === NEEDS_ANSWER} label="Needs an answer" onPress={() => setFilter(filter === NEEDS_ANSWER ? null : NEEDS_ANSWER)} />
        {CATEGORIES.map((category) => <Chip active={filter === category} key={category} label={category} onPress={() => setFilter(filter === category ? null : category)} />)}
      </ScrollView>
    </View>
  );

  const empty = loading ? <Loading label="Loading questions" />
    : error ? <StateBox action={<Button label="Try again" onPress={() => void load()} style={styles.stateButton} variant="ghost" />} copy={error} title="We couldn’t load questions." tone="error" />
    : filtered ? <StateBox copy={filter === NEEDS_ANSWER ? "Every question has at least one answer right now." : "Try another search or topic."} title="No matching questions." />
    : <StateBox action={<Button label="Ask a question" onPress={() => router.push("/(tabs)/ask")} style={styles.stateButton} />} copy="Be the first to ask." title="No questions yet." />;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <FlatList
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={empty}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.md }} /> : nextCursor && !error ? <Button label="Load more" onPress={() => void load(nextCursor)} style={{ marginTop: spacing.md }} variant="ghost" /> : null}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        data={loading && !questions.length ? [] : error ? [] : questions}
        keyExtractor={(item) => item.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl onRefresh={() => void load(null, true)} refreshing={refreshing} tintColor={colors.accent} />}
        renderItem={({ item }) => <QuestionCard question={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40, paddingTop: spacing.sm },
  header: { gap: 12, marginBottom: spacing.md },
  topRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  title: { color: colors.inkStrong, fontFamily: fonts.serif, fontSize: 28, lineHeight: 34 },
  askRow: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 52, paddingHorizontal: spacing.md },
  askText: { color: colors.ink, flex: 1, fontFamily: fonts.sans, fontSize: 15.5 },
  askAction: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 15 },
  search: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, paddingHorizontal: 14 },
  input: { color: colors.inkStrong, flex: 1, fontFamily: fonts.sans, fontSize: 15.5, minHeight: 48 },
  chips: { gap: 8, paddingRight: spacing.lg },
  stateButton: { alignSelf: "stretch" },
});
