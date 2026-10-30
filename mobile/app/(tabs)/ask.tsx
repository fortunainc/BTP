import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { Button, StateBox } from "@/components/ui";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { api } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import { announce, confirmSuccess } from "@/lib/feedback";
import type { PostResult } from "@/types/question";

const MIN_QUESTION_LENGTH = 20;
const MAX_QUESTION_LENGTH = 5000;

export default function AskScreen() {
  const auth = useBtpAuth();
  const [question, setQuestion] = useState("");
  const [reviewed, setReviewed] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [result, setResult] = useState<PostResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const activeLength = (reviewed ?? question).trim().length;
  const longEnough = activeLength >= MIN_QUESTION_LENGTH;

  const review = async () => {
    setBusy(true); setError("");
    try {
      const r = await api.questions.review(await auth.getToken(), question.trim());
      setReviewed(r.redactedContent);
      setReviewNote(r.redactionsApplied > 0 ? `We removed ${r.redactionsApplied} detail${r.redactionsApplied === 1 ? "" : "s"} that could identify you or your site. Edit anything else that should go.` : "Read it once more and remove anything that could identify you, your site or a patient.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn’t review your question. Try again.");
    } finally { setBusy(false); }
  };

  const post = async () => {
    if (!reviewed || !longEnough) return;
    setBusy(true); setError("");
    try {
      const r = await api.questions.create(await auth.getToken(), reviewed.trim());
      setResult(r); setQuestion(""); setReviewed(null);
      confirmSuccess();
      announce(r.pendingReview ? "Your question is awaiting review." : "Your question is posted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn’t post your question. Try again.");
    } finally { setBusy(false); }
  };

  if (result) {
    return <AppScreen contentStyle={styles.center}>
      {result.pendingReview ? <View style={styles.outcome}>
        <View style={[styles.status, styles.statusWaiting]}><Text style={[styles.statusText, { color: colors.ink }]}>Awaiting review</Text></View>
        <Text accessibilityRole="header" style={styles.outcomeTitle}>Your question is awaiting review.</Text>
        <Text style={styles.outcomeCopy}>BTP reviews some posts before they appear. It will show in Community once approved.</Text>
        <Button label="Back to Community" onPress={() => { setResult(null); router.navigate("/"); }} variant="ghost" />
      </View> : <View style={[styles.outcome, styles.outcomePosted]}>
        <View style={styles.status}><Text style={styles.statusText}>Posted</Text></View>
        <Text accessibilityRole="header" style={styles.outcomeTitle}>Your question is posted.</Text>
        <Text style={styles.outcomeCopy}>Members see it with your handle and general role. New replies show up in Activity.</Text>
        <Button label="View your question" onPress={() => { const id = result.id; setResult(null); router.push({ pathname: "/question/[id]", params: { id } }); }} />
      </View>}
      <Button label="Ask another question" onPress={() => setResult(null)} variant="quiet" />
    </AppScreen>;
  }

  if (reviewed !== null) {
    return <AppScreen>
      <Text style={type.eyebrow}>Review your question</Text>
      <Text accessibilityRole="header" style={styles.title}>Check it before <Text style={styles.accent}>it is shared.</Text></Text>
      <Text style={styles.subtitle}>{reviewNote}</Text>
      <TextInput accessibilityLabel="Your reviewed question" editable={!busy} maxLength={MAX_QUESTION_LENGTH} multiline onChangeText={setReviewed} scrollEnabled={false} style={styles.input} textAlignVertical="top" value={reviewed} />
      {!longEnough ? <Text style={styles.validation}>Your question needs at least {MIN_QUESTION_LENGTH} characters.</Text> : null}
      {error ? <StateBox copy={error} title="Not posted" tone="error" /> : null}
      <Button busy={busy} disabled={!longEnough} label="Post to the community" onPress={() => void post()} />
      <Button disabled={busy} label="Back to edit" onPress={() => { setReviewed(null); setError(""); }} variant="ghost" />
    </AppScreen>;
  }

  return <AppScreen>
    <Text style={type.eyebrow}>Ask the community</Text>
    <Text accessibilityRole="header" style={styles.title}>What are you <Text style={styles.accent}>trying to solve?</Text></Text>
    <Text style={styles.subtitle}>Describe what is happening and what you need to decide.</Text>
    <TextInput accessibilityLabel="Your question" editable={!busy} maxLength={MAX_QUESTION_LENGTH} multiline onChangeText={setQuestion} placeholder="For example: our referrals arrive with no prescreen answers. How do other sites handle the first call?" placeholderTextColor={colors.faint} scrollEnabled={false} style={styles.input} textAlignVertical="top" value={question} />
    <Text style={styles.counter}>{question.length.toLocaleString()} / {MAX_QUESTION_LENGTH.toLocaleString()}</Text>
    <View style={styles.notice}>
      <Text style={styles.noticeText}><Text style={styles.noticeStrong}>Leave out</Text> patient information, confidential documents, and study, site, sponsor or company names. BTP checks for identifying details before anything is posted.</Text>
    </View>
    {error ? <StateBox copy={error} title="Not reviewed" tone="error" /> : null}
    <Button busy={busy} disabled={question.trim().length < MIN_QUESTION_LENGTH} label="Review your question" onPress={() => void review()} />
  </AppScreen>;
}

const styles = StyleSheet.create({
  center: { justifyContent: "center" },
  title: { ...type.display },
  accent: { color: colors.accentBright, fontFamily: fonts.serifItalic },
  subtitle: { ...type.body, color: colors.muted },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, color: colors.inkStrong, fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, minHeight: 170, padding: spacing.md },
  counter: { ...type.meta, alignSelf: "flex-end", marginTop: -6 },
  notice: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: 14 },
  noticeText: { color: colors.ink, fontFamily: fonts.sans, fontSize: 14, lineHeight: 21 },
  noticeStrong: { color: colors.accentBright, fontFamily: fonts.sansSemiBold },
  validation: { color: colors.danger, fontFamily: fonts.sansMedium, fontSize: 13 },
  outcome: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: 12, padding: spacing.lg },
  outcomePosted: { borderColor: colors.borderStrong },
  status: { alignSelf: "flex-start", backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 5 },
  statusWaiting: { backgroundColor: "rgba(191,174,156,.14)" },
  statusText: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 12 },
  outcomeTitle: { ...type.title },
  outcomeCopy: { ...type.body, color: colors.muted },
});
