import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { BackLink, Button, Loading, StateBox } from "@/components/ui";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { api } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import { confirmTap } from "@/lib/feedback";
import type { PaidReviewInterest } from "@/types/question";

export default function PaidReviewsScreen() {
  const { getToken, signedIn } = useBtpAuth();
  const [data, setData] = useState<PaidReviewInterest | null>(null);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    if (!signedIn) return;
    setError("");
    try { setData(await api.interest.get(await getToken())); }
    catch { setError("Check your connection and try again."); }
  }, [getToken, signedIn]);
  useEffect(() => { void load(); }, [load]);

  const toggle = async (value: boolean) => {
    if (!data) return;
    const before = data;
    setData({ ...data, interested: value }); setSaving(true); setSaveError("");
    try { setData(await api.interest.set(await getToken(), value)); confirmTap(); }
    catch { setData(before); setSaveError("Your choice wasn’t saved. Try again."); }
    finally { setSaving(false); }
  };

  const known = data ? [data.roleLabel ? `Role: ${data.roleLabel}` : null, data.yearsExperience != null ? `Experience: ${data.yearsExperience} year${data.yearsExperience === 1 ? "" : "s"}` : null].filter(Boolean) as string[] : [];

  return <AppScreen>
    <BackLink label="You" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/you")} />
    <Text accessibilityRole="header" style={s.title}>Help shape <Text style={s.accent}>what gets built.</Text></Text>
    <Text style={s.subtitle}>Interested in paid product reviews? Tell us about your experience.</Text>
    {error ? <StateBox action={<Button label="Try again" onPress={() => void load()} style={{ alignSelf: "stretch" }} variant="ghost" />} copy={error} title="We couldn’t load this." tone="error" />
      : !data ? <Loading label="Loading" />
      : <>
        <View style={s.row}>
          <Text style={s.rowText}>I’m interested in paid product reviews</Text>
          <Switch {...({ activeThumbColor: colors.inkStrong } as object)} accessibilityLabel="I’m interested in paid product reviews" disabled={saving} ios_backgroundColor="#2A1F19" onValueChange={(v) => void toggle(v)} thumbColor={colors.inkStrong} trackColor={{ false: "#2A1F19", true: colors.accent }} value={data.interested} />
        </View>
        {saveError ? <Text style={s.error}>{saveError}</Text> : <Text style={s.saved}>{data.interested ? "Saved. You can turn this off at any time." : "Off. Turn it on if you’d like BTP to consider you."}</Text>}
        {known.length ? <View style={s.card}><Text style={s.cardHead}>BTP already has</Text>{known.map((k) => <Text key={k} style={s.cardItem}>{k}</Text>)}</View> : null}
        <Text style={s.fine}>Opportunities depend on relevant experience. BTP will ask about recent work and products when a review could fit. Expressing interest doesn’t guarantee paid work, and membership alone doesn’t qualify you for every review. Only BTP sees this.</Text>
      </>}
  </AppScreen>;
}

const s = StyleSheet.create({
  title: { ...type.display, fontSize: 28 },
  accent: { color: colors.accentBright, fontFamily: fonts.serifItalic },
  subtitle: { ...type.body, color: colors.muted },
  row: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.md },
  rowText: { color: colors.inkStrong, flex: 1, fontFamily: fonts.sansMedium, fontSize: 15.5, lineHeight: 22 },
  saved: { ...type.meta, marginTop: -6 },
  error: { color: colors.danger, fontFamily: fonts.sansMedium, fontSize: 13, marginTop: -6 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: 4, padding: 14 },
  cardHead: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 13 },
  cardItem: { color: colors.ink, fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21 },
  fine: { ...type.small, color: colors.faint },
});
