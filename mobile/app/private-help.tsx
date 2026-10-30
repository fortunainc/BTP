import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { BackLink, Button, Chip, StateBox } from "@/components/ui";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { api } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import { announce, confirmSuccess } from "@/lib/feedback";
import type { HelpType } from "@/types/question";

const helpTypes: Array<{ value: HelpType; label: string }> = [
  { value: "INTERVIEW_PREP", label: "Interview preparation" },
  { value: "WRITTEN_REVIEW", label: "Written review" },
  { value: "DOCUMENT_REVIEW", label: "Workflow review" },
  { value: "CONSULTATION", label: "Private conversation" },
  { value: "PROJECT_HELP", label: "Project help" },
];

/** One private help screen, opened from You or from a question (questionId keeps the link). */
export default function PrivateHelpScreen() {
  const { requestId, questionId, questionTitle } = useLocalSearchParams<{ requestId?: string; questionId?: string; questionTitle?: string }>();
  const { getToken } = useBtpAuth();
  const [helpType, setHelpType] = useState<HelpType>(questionId ? "CONSULTATION" : "INTERVIEW_PREP");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const feedback = Boolean(requestId);
  const back = () => router.canGoBack() ? router.back() : router.replace("/(tabs)/you");

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const token = await getToken();
      if (requestId) await api.help.feedback(token, requestId, details.trim());
      else await api.help.create(token, helpType, details.trim(), questionId || null);
      setSent(true); confirmSuccess(); announce(feedback ? "Feedback received." : "Request sent.");
    } catch (e) { setError(e instanceof Error ? e.message : "Your request wasn’t sent. Try again."); }
    finally { setBusy(false); }
  };

  if (sent) {
    return <AppScreen contentStyle={{ justifyContent: "center" }}>
      <StateBox copy={feedback ? "Only you and authorized BTP staff can see your feedback." : "BTP will review it and tell you whether help is available, the scope and any fee before anything begins. You can follow its status under You."} title={feedback ? "Feedback received." : "Request sent."} />
      <Button label="Done" onPress={back} />
    </AppScreen>;
  }

  return <AppScreen>
    <BackLink onPress={back} />
    <Text accessibilityRole="header" style={s.title}>{feedback ? <>Private help <Text style={s.accent}>feedback</Text></> : <>Request <Text style={s.accent}>private help</Text></>}</Text>
    <Text style={s.subtitle}>{feedback ? "Tell BTP what helped and what could improve." : "For help a community answer can’t cover."}</Text>
    {questionId && !feedback ? <View style={s.linked}><Text style={s.linkedHead}>About this question</Text><Text numberOfLines={3} style={s.linkedText}>{questionTitle || "The question you were viewing"}</Text></View> : null}
    {!feedback ? <View style={s.chips}>{helpTypes.map((t) => <Chip active={helpType === t.value} key={t.value} label={t.label} onPress={() => setHelpType(t.value)} />)}</View> : null}
    <TextInput accessibilityLabel={feedback ? "Your feedback" : "What would you like help with?"} maxLength={2000} multiline onChangeText={setDetails} placeholder={feedback ? "What helped, and what could be better?" : "What would you like help with?"} placeholderTextColor={colors.faint} scrollEnabled={false} style={s.input} textAlignVertical="top" value={details} />
    <Text style={s.fine}>Leave out patient information, employer names, confidential materials and identifying details.</Text>
    {error ? <StateBox copy={error} title="Not sent" tone="error" /> : null}
    <Button busy={busy} disabled={details.trim().length < 10} label={feedback ? "Send feedback" : "Send request"} onPress={() => void submit()} />
    {!feedback ? <Text style={s.fine}>This is a request, not a booking. BTP reviews it and tells you whether help is available, the scope and any fee before anything begins.</Text> : null}
  </AppScreen>;
}

const s = StyleSheet.create({
  title: { ...type.display, fontSize: 28 },
  accent: { color: colors.accentBright, fontFamily: fonts.serifItalic },
  subtitle: { ...type.body, color: colors.muted },
  linked: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: 4, padding: 14 },
  linkedHead: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 12.5 },
  linkedText: { color: colors.ink, fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, color: colors.inkStrong, fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, minHeight: 150, padding: spacing.md },
  fine: { ...type.meta, color: colors.faint, lineHeight: 18 },
});
