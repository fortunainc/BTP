import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { Button } from "@/components/ui";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { api } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import type { ContentReport, PrivateHelpRequest } from "@/types/question";

export default function YouScreen() {
  const auth = useBtpAuth();
  const { getToken, member, signedIn } = auth;
  const [requests, setRequests] = useState<PrivateHelpRequest[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!signedIn) return;
    setLoading(true); setError("");
    try { const token = await getToken(); const [help, rep] = await Promise.all([api.help.list(token), api.reports.list(token)]); setRequests(help); setReports(rep); }
    catch { setError("Couldn’t refresh your history. Tap to try again."); }
    finally { setLoading(false); }
  }, [getToken, signedIn]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handle = member?.handle?.trim() || "BTP member";
  const role = member?.roleLabel || generalizedRole(member?.roleCategory);
  const verified = member?.verificationStatus?.toLowerCase() === "approved";
  const open = requests.filter((r) => !["COMPLETED", "CLOSED"].includes(r.status)).length;

  const requestAccountDeletion = () => Alert.alert("Request account deletion?", "BTP will receive a private request for your signed-in account. A request does not immediately delete your account.", [
    { text: "Cancel", style: "cancel" },
    { text: "Submit request", style: "destructive", onPress: () => { void (async () => {
      try { await api.requestDeletion(await getToken()); Alert.alert("Request received", "BTP will review and complete your deletion request. Contact support if you need an update."); }
      catch (e) { Alert.alert("Request not submitted", e instanceof Error ? e.message : "Please try again."); }
    })(); } },
  ]);

  return <AppScreen>
    <Text accessibilityRole="header" style={styles.title}>You</Text>
    <View style={styles.profile}>
      <View style={styles.avatar}><Text style={styles.initials}>{initials(handle)}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.handle}>{handle}</Text>
        <Text style={styles.role}>{[role, verified ? "Verified" : null].filter(Boolean).join(" · ")}</Text>
      </View>
    </View>
    <Text style={styles.fine}>Members see your handle and general role. Your name, email and employer are never shown. Never use your real name or employer as your handle.</Text>

    <View style={styles.list}>
      <Row icon="bookmark-outline" label="Saved answers" onPress={() => router.push("/saved")} />
      <Row detail={open ? `${open} open request${open === 1 ? "" : "s"}` : "Help a community answer can’t cover"} icon="briefcase-outline" label="Private help" onPress={() => router.push("/private-help")} />
      <Row icon="shield-checkmark-outline" label="Privacy and trust" onPress={() => router.push("/trust-center")} />
      <Row detail="Shown in Activity in the app" icon="notifications-outline" label="Notifications" last />
    </View>

    {error ? <Pressable onPress={() => void load()}><Text style={styles.error}>{error}</Text></Pressable> : null}

    {requests.length ? <>
      <View style={styles.sectionHeader}><Text style={styles.section}>Your private help requests</Text>{loading ? <ActivityIndicator color={colors.accent} size="small" /> : null}</View>
      {requests.map((r) => <View key={r.id} style={styles.card}>
        <View style={styles.cardTop}><Text style={styles.cardTitle}>{labelHelpType(r.helpType)}</Text><Text style={styles.status}>{labelStatus(r.status)}</Text></View>
        <Text numberOfLines={2} style={styles.cardText}>{r.details}</Text>
        {r.memberUpdate ? <Text style={styles.cardText}>{r.memberUpdate}</Text> : null}
        {r.status === "COMPLETED" && !r.feedback ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/private-help", params: { requestId: r.id } })}><Text style={styles.link}>Share private feedback</Text></Pressable> : null}
        {r.feedback ? <Text style={styles.cardText}>Feedback received. Thank you.</Text> : null}
        <Text style={styles.date}>{new Date(r.createdAt).toLocaleDateString()}</Text>
      </View>)}
    </> : null}

    <View style={styles.sectionHeader}><Text style={styles.section}>Your reports</Text></View>
    <Text style={styles.fine}>Only you and BTP can see these outcomes.</Text>
    {reports.length === 0 ? <Text style={styles.cardText}>None submitted. You can report a question or answer from its page.</Text> : reports.slice(0, 5).map((r) => <View key={r.id} style={styles.card}>
      <View style={styles.cardTop}><Text style={styles.cardTitle}>{labelReportReason(r.reason)}</Text><Text style={styles.status}>{labelStatus(r.status)}</Text></View>
      <Text style={styles.cardText}>{r.status === "Pending" ? "Received by BTP for private review." : r.action === "hidden" ? "Reviewed. The content was hidden." : r.action === "restored" ? "Reviewed again. The content was restored." : "Reviewed. No removal was needed."}</Text>
      <Text style={styles.date}>{new Date(r.createdAt).toLocaleDateString()}</Text>
    </View>)}

    <Pressable accessibilityRole="button" onPress={() => router.push("/paid-reviews")} style={({ pressed }) => [styles.shape, pressed && { opacity: 0.8 }]}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.shapeTitle}>Help shape what gets built.</Text>
        <Text style={styles.cardText}>Interested in paid product reviews? Tell us about your experience.</Text>
      </View>
      <Ionicons color={colors.faint} name="chevron-forward" size={18} />
    </Pressable>

    {auth.configured ? <Button label="Sign out" onPress={() => void auth.signOut()} variant="ghost" /> : null}
    <Pressable accessibilityRole="button" onPress={requestAccountDeletion} style={styles.deleteButton}><Text style={styles.delete}>Request account deletion</Text></Pressable>
    <Text style={[styles.fine, { textAlign: "center" }]}>BTP will verify your request and delete your account and associated personal data. Community contributions may be kept only in de-identified form to protect shared discussions.</Text>
  </AppScreen>;
}

function Row({ icon, label, detail, onPress, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; onPress?: () => void; last?: boolean }) {
  return <Pressable accessibilityRole={onPress ? "button" : "text"} disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.divider, pressed && { backgroundColor: colors.surfaceRaised }]}>
    <Ionicons color={colors.accentBright} name={icon} size={19} />
    <View style={{ flex: 1, gap: 2 }}><Text style={styles.rowText}>{label}</Text>{detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}</View>
    {onPress ? <Ionicons color={colors.faint} name="chevron-forward" size={18} /> : null}
  </Pressable>;
}

const labelHelpType = (v: string) => ({ CONSULTATION: "Private conversation", INTERVIEW_PREP: "Interview preparation", WRITTEN_REVIEW: "Written review", DOCUMENT_REVIEW: "Workflow review", PROJECT_HELP: "Project help" }[v] || "Private help");
const labelStatus = (v: string) => ({ NEW: "Received", REVIEWING: "In review", MATCHING: "Finding a match", MATCHED: "Matched", COMPLETED: "Completed", CLOSED: "Closed", Pending: "Received", Reviewed: "Reviewed" }[v] || v.replaceAll("_", " ").toLowerCase());
const labelReportReason = (v: string) => ({ IDENTIFYING_INFORMATION: "Identifying information", CONFIDENTIAL_INFORMATION: "Confidential information", PATIENT_INFORMATION: "Patient information", HARASSMENT: "Harassment", MISINFORMATION: "Potentially unsafe information", URGENT_SAFETY_OR_MISCONDUCT: "Urgent safety or misconduct", OTHER: "Other concern" }[v] || "Reported concern");
const initials = (h: string) => h.split(/[^A-Za-z0-9]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toLowerCase().slice(0, 2) || "bm";
const generalizedRole = (value?: string | null) => {
  const r = (value || "").toLowerCase();
  if (!r) return "BTP member";
  if (r.includes("crc") || r.includes("coordinator") || r.includes("site")) return "Site professional";
  if (r.includes("cra") || r.includes("monitor")) return "CRA or monitor";
  if (r.includes("regulatory")) return "Regulatory professional";
  if (r.includes("quality")) return "Quality professional";
  if (r.includes("investigator") || r === "pi") return "Investigator";
  if (r.includes("operations") || r.includes("ctm") || r.includes("project")) return "Clinical operations professional";
  return "Clinical research professional";
};

const styles = StyleSheet.create({
  title: { ...type.display, fontSize: 28 },
  profile: { alignItems: "center", flexDirection: "row", gap: 13 },
  avatar: { alignItems: "center", borderColor: colors.accent, borderRadius: 26, borderWidth: 1, height: 52, justifyContent: "center", width: 52 },
  initials: { color: colors.accentBright, fontFamily: fonts.mark, fontSize: 22 },
  handle: { color: colors.inkStrong, fontFamily: fonts.sansSemiBold, fontSize: 17 },
  role: { ...type.small, marginTop: 2 },
  fine: { ...type.meta, color: colors.faint, lineHeight: 18 },
  list: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  row: { alignItems: "center", flexDirection: "row", gap: 13, minHeight: 58, paddingHorizontal: spacing.md, paddingVertical: 12 },
  divider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  rowText: { color: colors.inkStrong, fontFamily: fonts.sansMedium, fontSize: 15.5 },
  rowDetail: { ...type.meta },
  error: { color: colors.danger, fontFamily: fonts.sans, fontSize: 13, textAlign: "center" },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  section: { ...type.section },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: 6, padding: 14 },
  cardTop: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  cardTitle: { color: colors.inkStrong, flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 15 },
  cardText: { ...type.small },
  status: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 11.5, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 4 },
  date: { ...type.meta, color: colors.faint },
  link: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 14 },
  shape: { alignItems: "center", borderColor: colors.border, borderRadius: radius.md, borderStyle: "dashed", borderWidth: 1, flexDirection: "row", gap: 10, marginTop: spacing.sm, padding: 14 },
  shapeTitle: { color: colors.ink, fontFamily: fonts.serif, fontSize: 17 },
  deleteButton: { alignItems: "center", minHeight: 36, justifyContent: "center" },
  delete: { color: colors.danger, fontFamily: fonts.sansMedium, fontSize: 13.5, textDecorationLine: "underline" },
});
