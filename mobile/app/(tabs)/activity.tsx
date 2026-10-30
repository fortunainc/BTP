import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Loading, StateBox } from "@/components/ui";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { api } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import type { ActivityItem } from "@/types/question";

export default function ActivityScreen() {
  const { getToken, signedIn } = useBtpAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (pull = false) => {
    if (!signedIn) return;
    if (pull) setRefreshing(true);
    setError("");
    try { setItems(await api.activity.list(await getToken())); }
    catch { setError("Check your connection and try again."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [getToken, signedIn]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const open = (item: ActivityItem) => {
    if (item.questionId) router.push({ pathname: "/question/[id]", params: { id: item.questionId } });
    if (!item.read) {
      setItems((current) => current.map((c) => c.id === item.id ? { ...c, read: true } : c));
      void (async () => { try { await api.activity.markRead(await getToken(), item.id); } catch { setItems((current) => current.map((c) => c.id === item.id ? { ...c, read: false } : c)); } })();
    }
  };
  const markAllRead = async () => {
    setBusy(true);
    try { await api.activity.markAllRead(await getToken()); setItems((current) => current.map((i) => ({ ...i, read: true }))); }
    catch { setError("Couldn’t mark everything as read. Try again."); }
    finally { setBusy(false); }
  };
  const hasUnread = items.some((i) => !i.read);

  return <SafeAreaView edges={["top"]} style={s.safe}>
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl onRefresh={() => void load(true)} refreshing={refreshing} tintColor={colors.accent} />}>
      <View style={s.header}>
        <Text accessibilityRole="header" style={s.title}>Activity</Text>
        {hasUnread ? <Pressable accessibilityRole="button" disabled={busy} hitSlop={10} onPress={() => void markAllRead()}><Text style={[s.link, busy && { opacity: 0.45 }]}>Mark all read</Text></Pressable> : null}
      </View>
      <Text style={s.subtitle}>Replies to your questions, and updates on your answers and reports.</Text>
      {loading ? <Loading label="Loading activity" />
        : error && !items.length ? <StateBox action={<Button label="Try again" onPress={() => void load()} style={{ alignSelf: "stretch" }} variant="ghost" />} copy={error} title="We couldn’t load Activity." tone="error" />
        : !items.length ? <StateBox copy="Replies to your questions and updates on your answers will appear here." title="Nothing new yet." />
        : items.map((item) => <Pressable accessibilityHint={item.questionId ? "Opens the question" : undefined} accessibilityLabel={`${item.read ? "" : "Unread. "}${item.title} ${item.detail}`} accessibilityRole="button" key={item.id} onPress={() => open(item)} style={({ pressed }) => [s.item, !item.read && s.unread, pressed && { backgroundColor: colors.surfaceRaised }]}>
            <View style={[s.dot, item.read && { backgroundColor: "transparent" }]} />
            <View style={s.copy}><Text style={s.itemTitle}>{item.title}</Text>{item.detail ? <Text numberOfLines={2} style={s.detail}>{item.detail}</Text> : null}</View>
            <Text style={s.time}>{item.displayTime}</Text>
          </Pressable>)}
      {error && items.length ? <Text style={s.inlineError}>{error}</Text> : null}
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 12, padding: spacing.lg, paddingTop: spacing.sm },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  title: { ...type.display, fontSize: 28 },
  link: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 14 },
  subtitle: { ...type.small, marginBottom: 4 },
  item: { alignItems: "flex-start", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: 12, padding: spacing.md },
  unread: { borderColor: colors.borderStrong },
  dot: { backgroundColor: colors.accentBright, borderRadius: 4, height: 8, marginTop: 7, width: 8 },
  copy: { flex: 1, gap: 4 },
  itemTitle: { color: colors.inkStrong, fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 21 },
  detail: { ...type.small },
  time: { ...type.meta, color: colors.faint },
  inlineError: { color: colors.danger, fontFamily: fonts.sans, fontSize: 13, textAlign: "center" },
});
