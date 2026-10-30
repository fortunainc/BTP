import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthorLine, BackLink, Button, Chip, StateBox } from "@/components/ui";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { api } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import { announce, confirmSuccess, confirmTap } from "@/lib/feedback";
import type { Answer, OutcomeType, QuestionDetail, ReactionType } from "@/types/question";

const outcomeOptions: Array<{ value: OutcomeType; label: string }> = [{ value: "resolution", label: "Resolved" }, { value: "validation", label: "Confirmed accurate" }, { value: "correction", label: "Needed correction" }, { value: "incomplete", label: "Incomplete" }, { value: "misleading", label: "Misleading" }];
const reportOptions = [{ value: "IDENTIFYING_INFORMATION", label: "Identifying details" }, { value: "CONFIDENTIAL_INFORMATION", label: "Confidential information" }, { value: "PATIENT_INFORMATION", label: "Patient information" }, { value: "HARASSMENT", label: "Harassment" }, { value: "MISINFORMATION", label: "Unsafe information" }, { value: "OTHER", label: "Other" }];
const reactionLabels: Record<ReactionType, { label: string; on: string; icon: keyof typeof Ionicons.glyphMap; iconOn: keyof typeof Ionicons.glyphMap }> = {
  HELPFUL: { label: "This helped", on: "This helped", icon: "heart-outline", iconOn: "heart" },
  SAME_HERE: { label: "Same here", on: "Same here", icon: "people-outline", iconOn: "people" },
  SAVED: { label: "Save", on: "Saved", icon: "bookmark-outline", iconOn: "bookmark" },
  WORKED: { label: "It worked", on: "It worked", icon: "checkmark-circle-outline", iconOn: "checkmark-circle" },
};

export default function QuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken, signedIn } = useBtpAuth();
  const [q, setQ] = useState<QuestionDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(true);
  const [following, setFollowing] = useState(false);
  const [answer, setAnswer] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [modal, setModal] = useState<"outcome" | "report" | null>(null);
  const [details, setDetails] = useState("");
  const [outcomeType, setOutcomeType] = useState<OutcomeType>("resolution");
  const [reportReason, setReportReason] = useState("OTHER");
  const [reportTarget, setReportTarget] = useState<{ type: "QUESTION" | "ANSWER"; id: string } | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) { setLoadError("This question link is incomplete."); setBusy(false); return; }
    if (!signedIn) return;
    setBusy(true); setLoadError("");
    try {
      const token = await getToken();
      setQ(await api.questions.detail(token, id));
      void api.questions.followState(token, id).then((f) => setFollowing(f.following)).catch(() => undefined);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "This question could not be loaded.");
    } finally { setBusy(false); }
  }, [getToken, id, signedIn]);
  useEffect(() => { void load(); }, [load]);

  const updateAnswer = (answerId: string, patch: Partial<Answer>) => setQ((current) => current ? { ...current, answers: current.answers.map((a) => a.id === answerId ? { ...a, ...patch } : a) } : current);

  const react = async (a: Answer, reaction: ReactionType) => {
    const on = !a.myReactions.includes(reaction);
    const before = a;
    const optimistic = on ? [...a.myReactions, reaction] : a.myReactions.filter((r) => r !== reaction);
    updateAnswer(a.id, { myReactions: optimistic, ...(reaction === "WORKED" ? { askerReportedWorked: on } : {}) });
    setPending(`${a.id}:${reaction}`); setActionError("");
    try {
      const mine = await api.questions.react(await getToken(), a.id, reaction, on);
      updateAnswer(a.id, { myReactions: mine, ...(reaction === "WORKED" ? { askerReportedWorked: mine.includes("WORKED") } : {}) });
      confirmTap();
      if (reaction === "SAVED") announce(on ? "Saved. Find it under You, Saved answers." : "Removed from saved answers.");
    } catch (e) {
      updateAnswer(a.id, { myReactions: before.myReactions, askerReportedWorked: before.askerReportedWorked });
      setActionError(e instanceof Error ? e.message : "That didn’t save. Try again.");
    } finally { setPending(null); }
  };

  const submitAnswer = async () => {
    if (!id) return;
    setBusy(true); setActionError("");
    try {
      const result = await api.questions.answer(await getToken(), id, answer.trim());
      setAnswer("");
      await load();
      confirmSuccess();
      const redacted = result.contextRedacted ? " Some identifying details were removed." : "";
      setNotice(result.pendingReview ? `Your answer is awaiting review.${redacted}` : `Your answer is posted.${redacted}`);
    } catch (e) { setActionError(e instanceof Error ? e.message : "Your answer wasn’t posted. Try again."); }
    finally { setBusy(false); }
  };

  const toggleFollow = async () => {
    if (!id) return;
    try { const r = await api.questions.follow(await getToken(), id, !following); setFollowing(r.following); confirmTap(); }
    catch { setActionError("Follow didn’t update. Try again."); }
  };

  const submitExtra = async () => {
    if (!id || !modal) return;
    setBusy(true);
    try {
      if (modal === "outcome") await api.questions.outcome(await getToken(), id, outcomeType, details);
      else if (reportTarget) await api.questions.report(await getToken(), reportTarget.type, reportTarget.id, reportReason, details);
      const done = modal;
      setModal(null); setReportTarget(null); setDetails(""); setReportReason("OTHER");
      confirmSuccess();
      setNotice(done === "outcome" ? "Thanks for sharing what happened." : "Report received. BTP reviews it privately and the member is not told who reported it. You can see the outcome under You.");
    } catch (e) { setActionError(e instanceof Error ? e.message : "That wasn’t submitted. Try again."); }
    finally { setBusy(false); }
  };

  if (!q) {
    return <SafeAreaView style={s.loading}>
      {busy && !loadError ? <ActivityIndicator color={colors.accent} /> : <View style={s.loadState}>
        <StateBox action={<Button label="Try again" onPress={() => void load()} style={{ alignSelf: "stretch" }} variant="ghost" />} copy={loadError || "Please try again."} title="We couldn’t load this question." tone="error" />
        <Button label="Back to Community" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} variant="quiet" />
      </View>}
    </SafeAreaView>;
  }

  const canAnswer = !q.isAuthor && !q.answers.some((a) => a.isAuthor);
  return <SafeAreaView edges={["top", "bottom"]} style={s.safe}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.content} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
        <View style={s.top}>
          <BackLink label="Community" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} />
          <Pressable accessibilityRole="button" accessibilityState={{ selected: following }} hitSlop={10} onPress={() => void toggleFollow()} style={s.follow}>
            <Ionicons color={colors.accentBright} name={following ? "star" : "star-outline"} size={16} />
            <Text style={s.followText}>{following ? "Following" : "Follow"}</Text>
          </Pressable>
        </View>
        <AuthorLine handle={q.authorHandle} mine={q.isAuthor} role={q.role} time={q.createdLabel} />
        <Text accessibilityRole="header" style={s.title}>{q.title}</Text>
        {q.description && q.description !== q.title ? <Text style={s.description}>{q.description}</Text> : null}
        <Text style={s.tag}>{q.topic}</Text>
        <View style={s.actions}>
          {q.isAuthor ? <Button label="What happened?" onPress={() => setModal("outcome")} style={{ flex: 1 }} variant="ghost" /> : null}
          <Button label="Get private help" onPress={() => router.push({ pathname: "/private-help", params: { questionId: q.id, questionTitle: q.title } })} style={{ flex: 1 }} variant="ghost" />
        </View>
        {!q.isAuthor ? <Pressable accessibilityRole="button" onPress={() => { setReportTarget({ type: "QUESTION", id: q.id }); setModal("report"); }} style={s.reportLink}><Ionicons color={colors.faint} name="flag-outline" size={13} /><Text style={s.reportText}>Report this question</Text></Pressable> : null}

        {notice ? <View accessibilityLiveRegion="polite" style={s.notice}><Text style={s.noticeText}>{notice}</Text></View> : null}
        {actionError ? <View accessibilityLiveRegion="assertive" style={[s.notice, s.noticeError]}><Text style={[s.noticeText, { color: colors.danger }]}>{actionError}</Text></View> : null}

        <Text style={s.section}>Answers from experience</Text>
        {q.answers.length === 0 ? <Text style={s.empty}>{q.isAuthor ? "No answers yet. Replies will appear here and in Activity." : "No answers yet. If you have handled something similar, your experience could help."}</Text> : q.answers.map((a) => (
          <View key={a.id} style={s.answer}>
            <AuthorLine handle={a.authorHandle} mine={a.isAuthor} role={a.role} time={a.timeLabel} />
            {a.askerReportedWorked ? <View style={s.worked}><Ionicons color={colors.accentBright} name="checkmark-circle" size={14} /><Text style={s.workedText}>It worked for the asker</Text></View> : null}
            <Text style={s.answerText}>{a.text}</Text>
            {!a.isAuthor ? <>
              <View style={s.reactions}>
                {(["HELPFUL", "SAME_HERE", "SAVED", ...(q.isAuthor ? ["WORKED" as const] : [])] as ReactionType[]).map((r) => {
                  const on = a.myReactions.includes(r);
                  const meta = reactionLabels[r];
                  return <Pressable accessibilityLabel={meta.label} accessibilityRole="button" accessibilityState={{ selected: on, busy: pending === `${a.id}:${r}` }} disabled={pending === `${a.id}:${r}`} key={r} onPress={() => void react(a, r)} style={({ pressed }) => [s.reaction, on && s.reactionOn, pressed && { opacity: 0.75 }]}>
                    <Ionicons color={on ? colors.onAccent : colors.accentBright} name={on ? meta.iconOn : meta.icon} size={14} />
                    <Text style={[s.reactionText, on && s.reactionTextOn]}>{on ? meta.on : meta.label}</Text>
                  </Pressable>;
                })}
              </View>
              {q.isAuthor ? <Text style={s.fine}>Only you can mark “It worked”. Others see it as your own report, not verified proof.</Text> : null}
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => { setReportTarget({ type: "ANSWER", id: a.id }); setModal("report"); }} style={s.reportLink}><Text style={s.reportText}>Report</Text></Pressable>
            </> : null}
          </View>
        ))}

        {canAnswer ? <>
          <Text style={s.label}>Your answer</Text>
          <TextInput accessibilityLabel="Your answer" maxLength={2000} multiline onChangeText={setAnswer} placeholder="Share what you did, what worked, or what you would watch for" placeholderTextColor={colors.faint} scrollEnabled={false} style={s.input} textAlignVertical="top" value={answer} />
          <Text style={s.fine}>Leave out names, sites and patient details. BTP checks answers before they appear.</Text>
          <Button busy={busy} disabled={answer.trim().length < 10} label="Answer from experience" onPress={() => void submitAnswer()} />
        </> : q.answers.some((a) => a.isAuthor) ? <Text style={s.empty}>You answered this question. Thank you for sharing your experience.</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>

    <Modal animationType="slide" onRequestClose={() => setModal(null)} transparent visible={Boolean(modal)}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.overlay}>
        <ScrollView contentContainerStyle={s.sheetScroll} keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"} keyboardShouldPersistTaps="handled">
          <View style={s.sheet}>
            <Text accessibilityRole="header" style={s.sheetTitle}>{modal === "outcome" ? "What happened?" : "Report content"}</Text>
            <Text style={s.sheetCopy}>{modal === "outcome" ? "Choose the outcome that is true, then share what happened." : "Tell BTP what concerns you. Reports are reviewed privately by BTP."}</Text>
            <View style={s.options}>{(modal === "outcome" ? outcomeOptions : reportOptions).map((o) => <Chip active={(modal === "outcome" ? outcomeType : reportReason) === o.value} key={o.value} label={o.label} onPress={() => modal === "outcome" ? setOutcomeType(o.value as OutcomeType) : setReportReason(o.value)} />)}</View>
            <TextInput accessibilityLabel="Details" maxLength={modal === "report" ? 500 : 2000} multiline onChangeText={setDetails} placeholder={modal === "outcome" ? "What did you try and what happened?" : "What should BTP review?"} placeholderTextColor={colors.faint} style={s.modalInput} textAlignVertical="top" value={details} />
            <Button busy={busy} disabled={details.trim().length < 10} label="Submit" onPress={() => void submitExtra()} />
            <Button label="Cancel" onPress={() => setModal(null)} variant="quiet" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  loading: { alignItems: "center", backgroundColor: colors.background, flex: 1, justifyContent: "center", padding: spacing.lg },
  loadState: { gap: spacing.md, width: "100%" },
  content: { gap: 14, padding: spacing.lg, paddingBottom: 48, paddingTop: spacing.sm },
  top: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  follow: { alignItems: "center", flexDirection: "row", gap: 5, minHeight: 32 },
  followText: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 14 },
  title: { color: colors.inkStrong, fontFamily: fonts.sansSemiBold, fontSize: 20, lineHeight: 28 },
  description: { ...type.body },
  tag: { alignSelf: "flex-start", backgroundColor: colors.accentSoft, borderRadius: radius.pill, color: colors.accentBright, fontFamily: fonts.sansMedium, fontSize: 12, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 4 },
  actions: { flexDirection: "row", gap: spacing.sm },
  reportLink: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 5, minHeight: 28 },
  reportText: { color: colors.faint, fontFamily: fonts.sansMedium, fontSize: 12.5 },
  notice: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: 12 },
  noticeError: { backgroundColor: colors.dangerSoft },
  noticeText: { color: colors.ink, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  section: { ...type.section, marginTop: spacing.sm },
  empty: { ...type.small },
  answer: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: 10, padding: spacing.md },
  worked: { alignItems: "center", alignSelf: "flex-start", backgroundColor: colors.accentSoft, borderRadius: radius.pill, flexDirection: "row", gap: 5, paddingHorizontal: 10, paddingVertical: 4 },
  workedText: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 12 },
  answerText: { ...type.body },
  reactions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  reaction: { alignItems: "center", borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, flexDirection: "row", gap: 5, minHeight: 34, paddingHorizontal: 11 },
  reactionOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  reactionText: { color: colors.ink, fontFamily: fonts.sansMedium, fontSize: 13 },
  reactionTextOn: { color: colors.onAccent, fontFamily: fonts.sansSemiBold },
  fine: { ...type.meta, color: colors.faint, lineHeight: 18 },
  label: { color: colors.ink, fontFamily: fonts.sansMedium, fontSize: 14, marginTop: spacing.sm },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, color: colors.inkStrong, fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, minHeight: 120, padding: spacing.md },
  overlay: { backgroundColor: "rgba(0,0,0,.55)", flex: 1 },
  sheetScroll: { flexGrow: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderColor: colors.border, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, gap: spacing.md, padding: spacing.lg, paddingBottom: 34 },
  sheetTitle: { ...type.title },
  sheetCopy: { ...type.small },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modalInput: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.inkStrong, fontFamily: fonts.sans, fontSize: 15.5, minHeight: 120, padding: 14 },
});
