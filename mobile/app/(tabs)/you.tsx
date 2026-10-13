import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppScreen } from "@/components/AppScreen";
import { colors, spacing } from "@/constants/theme";
import { api, liveApiConfigured } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import type { ContentReport, PrivateHelpRequest } from "@/types/question";

const rows = [
  { label: "Professional verification", detail: "Approved privately for beta" },
  { label: "Trust Center", detail: "How identity and reporting work", action: "trust" },
  { label: "Notifications", detail: "Managed by BTP for beta" },
];
const ACCOUNT_DELETION_EMAIL = "mailto:fortunaindustriesinc@gmail.com?subject=BTP%20account%20deletion%20request&body=Please%20delete%20my%20BTP%20account%20and%20associated%20personal%20data.%20My%20account%20email%20is%3A%20";

export default function YouScreen() {
  const auth = useBtpAuth();
  const { getToken, member, signedIn } = auth;
  const [requests, setRequests] = useState<PrivateHelpRequest[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!liveApiConfigured || !signedIn) return;
    setLoading(true);
    try { const token = await getToken(); const [helpItems, reportItems] = await Promise.all([api.help.list(token), api.reports.list(token)]); setRequests(helpItems); setReports(reportItems); } catch { setRequests([]); setReports([]); } finally { setLoading(false); }
  }, [getToken, signedIn]);
  useEffect(() => { void load(); }, [load]);
  const profileName = member?.handle?.trim() || "BTP member";
  const profileDetails = [generalizedRole(member?.roleCategory), generalizedCompany(member?.companyCategory), verificationLabel(member?.verificationStatus)].filter(Boolean).join(" · ");
  const requestAccountDeletion = async () => {
    try {
      await Linking.openURL(ACCOUNT_DELETION_EMAIL);
    } catch {
      Alert.alert("Could not open email", "Email fortunaindustriesinc@gmail.com with the subject “BTP account deletion request.”");
    }
  };
  return (
    <AppScreen>
      <Text style={styles.title}>You</Text>
      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.initials}>{initials(profileName)}</Text></View>
        <View style={styles.profileCopy}><Text style={styles.handle}>{profileName}</Text><Text style={styles.role}>{profileDetails || "Identity protected"}</Text><Text style={styles.privacy}>Your identity is not shown with community questions or answers.</Text></View>
      </View>
      {auth.configured && <Pressable onPress={() => void auth.signOut()} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable>}
      <View style={styles.list}>
        {rows.map((row, index) => (
          <Pressable disabled={!row.action} key={row.label} onPress={() => row.action === "trust" && router.push("/trust-center")} style={[styles.row, index < rows.length - 1 && styles.divider]}>
            <View style={styles.rowCopy}><Text style={styles.rowText}>{row.label}</Text><Text style={styles.betaLabel}>{row.detail}</Text></View>
            {row.action && <Text style={styles.chevron}>›</Text>}
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={() => void requestAccountDeletion()} style={styles.deleteAccount}>
        <Text style={styles.deleteAccountText}>Request account deletion</Text>
      </Pressable>
      <Text style={styles.deletionNote}>BTP will verify your request and delete your account and associated personal data. Community contributions may be retained only in de-identified form to protect shared discussions.</Text>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your reports</Text></View>
      <Text style={styles.sectionCopy}>Only you and BTP can see these report outcomes.</Text>
      {reports.length === 0 ? <View style={styles.helpCard}><Text style={styles.helpTitle}>No reports submitted</Text><Text style={styles.helpDetail}>If something threatens privacy or trust, report it from the question or answer.</Text></View> : reports.slice(0, 5).map(report => <View key={report.id} style={styles.helpCard}><View style={styles.helpTop}><Text style={styles.helpTitle}>{labelReportReason(report.reason)}</Text><View style={styles.status}><Text style={styles.statusText}>{labelStatus(report.status)}</Text></View></View><Text style={styles.helpDetail}>{report.status === "Pending" ? "Received by BTP for private review." : report.action === "hidden" ? "Reviewed. The content was hidden." : report.action === "restored" ? "Reviewed again. The content was restored." : "Reviewed. No removal was required."}</Text><Text style={styles.helpTime}>{new Date(report.createdAt).toLocaleDateString()}</Text></View>)}
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Private help</Text>{loading && <ActivityIndicator color={colors.accent} size="small" />}</View>
      <Text style={styles.sectionCopy}>Requests are reviewed and matched by BTP privately during beta.</Text>
      {!liveApiConfigured || !auth.signedIn ? <View style={styles.helpCard}><Text style={styles.helpTitle}>No active requests</Text><Text style={styles.helpDetail}>Requests you make from a question will appear here.</Text></View> : requests.length === 0 && !loading ? <View style={styles.helpCard}><Text style={styles.helpTitle}>No active requests</Text><Text style={styles.helpDetail}>When a community answer is not enough, request dedicated help from the question.</Text></View> : requests.map(request => <View key={request.id} style={styles.helpCard}><View style={styles.helpTop}><Text style={styles.helpTitle}>{labelHelpType(request.helpType)}</Text><View style={styles.status}><Text style={styles.statusText}>{labelStatus(request.status)}</Text></View></View><Text numberOfLines={2} style={styles.helpDetail}>{request.details}</Text><Text style={styles.helpTime}>{new Date(request.createdAt).toLocaleDateString()}</Text></View>)}
    </AppScreen>
  );
}

const labelHelpType = (value: string) => ({ CONSULTATION: "Private consultation", INTERVIEW_PREP: "Interview preparation", WRITTEN_REVIEW: "Written review", DOCUMENT_REVIEW: "Document or workflow review", PROJECT_HELP: "Defined project help" }[value] || "Private help");
const labelStatus = (value: string) => ({ NEW: "Received", REVIEWING: "In review", MATCHING: "Finding a match", MATCHED: "Matched", COMPLETED: "Completed", CLOSED: "Closed" }[value] || value.replaceAll("_", " ").toLowerCase());
const labelReportReason = (value: string) => ({ IDENTIFYING_INFORMATION: "Identifying information", CONFIDENTIAL_INFORMATION: "Confidential information", PATIENT_INFORMATION: "Patient information", HARASSMENT: "Harassment", MISINFORMATION: "Potentially unsafe information", URGENT_SAFETY_OR_MISCONDUCT: "Urgent safety or misconduct", OTHER: "Other concern" }[value] || "Reported concern");
const initials = (handle: string) => handle.split(/[^A-Za-z0-9]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "BM";
const generalizedRole = (value?: string | null) => {
  const role = (value || "").toLowerCase();
  if (!role) return "Verified BTP member";
  if (role.includes("crc") || role.includes("coordinator") || role.includes("site")) return "Site professional";
  if (role.includes("cra") || role.includes("monitor")) return "CRA / monitor";
  if (role.includes("regulatory")) return "Regulatory professional";
  if (role.includes("quality")) return "Quality professional";
  if (role.includes("investigator") || role === "pi") return "Investigator";
  if (role.includes("operations") || role.includes("ctm") || role.includes("project")) return "Clinical operations professional";
  return "Clinical research professional";
};
const generalizedCompany = (value?: string | null) => {
  const company = (value || "").toLowerCase();
  if (!company) return null;
  if (company.includes("site")) return "Site";
  if (company.includes("sponsor") || company.includes("biotech") || company.includes("pharma")) return "Sponsor";
  if (company.includes("cro") || company.includes("research organization")) return "CRO";
  if (company.includes("vendor") || company.includes("provider")) return "Service provider";
  return "Clinical research organization";
};
const verificationLabel = (value?: string | null) => value?.toLowerCase() === "approved" ? "Verified" : value || null;

const styles = StyleSheet.create({
  title: { fontFamily: "Geist", color: colors.ink, fontSize: 30, fontWeight: "700" },
  profile: { alignItems: "center", flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm },
  avatar: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 28, height: 56, justifyContent: "center", width: 56 },
  initials: { fontFamily: "Geist", color: colors.white, fontSize: 17, fontWeight: "800" },
  profileCopy: { flex: 1 },
  handle: { fontFamily: "Geist", color: colors.ink, fontSize: 17, fontWeight: "700" },
  role: { fontFamily: "Geist", color: colors.muted, fontSize: 13, marginTop: 3 },
  privacy: { fontFamily: "Geist", color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  list: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginHorizontal: spacing.md, paddingVertical: 17 },
  rowCopy: { flex: 1, gap: 3 },
  divider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  rowText: { fontFamily: "Geist", color: colors.ink, fontSize: 15, fontWeight: "600" },
  betaLabel: { fontFamily: "Geist", color: colors.muted, fontSize: 11 },
  chevron: { color: colors.muted, fontFamily: "Geist", fontSize: 25, marginLeft: spacing.sm },
  signOut: { alignItems: "center", borderColor: colors.border, borderRadius: 14, borderWidth: 1, padding: 14 },
  signOutText: { fontFamily: "Geist", color: colors.danger, fontWeight: "700" },
  deleteAccount: { alignItems: "center", paddingHorizontal: spacing.sm, paddingVertical: 4 },
  deleteAccountText: { fontFamily: "Geist", color: colors.danger, fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
  deletionNote: { fontFamily: "Geist", color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: -8, textAlign: "center" },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  sectionTitle: { fontFamily: "Geist", color: colors.ink, fontSize: 20, fontWeight: "700" },
  sectionCopy: { fontFamily: "Geist", color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: -8 },
  helpCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 7, padding: spacing.md },
  helpTop: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  helpTitle: { fontFamily: "Geist", color: colors.ink, flex: 1, fontSize: 15, fontWeight: "700" },
  helpDetail: { fontFamily: "Geist", color: colors.muted, fontSize: 13, lineHeight: 19 },
  helpTime: { fontFamily: "Geist", color: colors.muted, fontSize: 11 },
  status: { backgroundColor: colors.accentSoft, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontFamily: "Geist", color: colors.accent, fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
});
