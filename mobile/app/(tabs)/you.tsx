import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors, spacing } from "@/constants/theme";
import { api, liveApiConfigured } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import type { PrivateHelpRequest } from "@/types/question";

const rows = ["Verification and role", "Expertise and topics", "Privacy", "Notifications", "Private help"];

export default function YouScreen() {
  const auth = useBtpAuth();
  const [requests, setRequests] = useState<PrivateHelpRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!liveApiConfigured || !auth.signedIn) return;
    setLoading(true);
    try { setRequests(await api.help.list(await auth.getToken())); } catch { setRequests([]); } finally { setLoading(false); }
  }, [auth]);
  useEffect(() => { void load(); }, [load]);
  return (
    <AppScreen>
      <Text style={styles.title}>You</Text>
      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.initials}>VP</Text></View>
        <View><Text style={styles.handle}>Verified professional</Text><Text style={styles.role}>Clinical operations · identity protected</Text></View>
      </View>
      {auth.configured && <Pressable onPress={() => void auth.signOut()} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable>}
      <View style={styles.list}>
        {rows.map((row, index) => (
          <View key={row} style={[styles.row, index < rows.length - 1 && styles.divider]}>
            <Text style={styles.rowText}>{row}</Text>
            <Ionicons color={colors.muted} name="chevron-forward" size={18} />
          </View>
        ))}
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Private help</Text>{loading && <ActivityIndicator color={colors.accent} size="small" />}</View>
      <Text style={styles.sectionCopy}>Requests are reviewed and matched by BTP privately during beta.</Text>
      {!liveApiConfigured || !auth.signedIn ? <View style={styles.helpCard}><Text style={styles.helpTitle}>No active requests</Text><Text style={styles.helpDetail}>Requests you make from a question will appear here.</Text></View> : requests.length === 0 && !loading ? <View style={styles.helpCard}><Text style={styles.helpTitle}>No active requests</Text><Text style={styles.helpDetail}>When a community answer is not enough, request dedicated help from the question.</Text></View> : requests.map(request => <View key={request.id} style={styles.helpCard}><View style={styles.helpTop}><Text style={styles.helpTitle}>{labelHelpType(request.helpType)}</Text><View style={styles.status}><Text style={styles.statusText}>{labelStatus(request.status)}</Text></View></View><Text numberOfLines={2} style={styles.helpDetail}>{request.details}</Text><Text style={styles.helpTime}>{new Date(request.createdAt).toLocaleDateString()}</Text></View>)}
    </AppScreen>
  );
}

const labelHelpType = (value: string) => ({ CONSULTATION: "Private consultation", WRITTEN_REVIEW: "Written review", DOCUMENT_REVIEW: "Document or workflow review", PROJECT_HELP: "Defined project help" }[value] || "Private help");
const labelStatus = (value: string) => ({ NEW: "Received", REVIEWING: "In review", MATCHING: "Finding a match", MATCHED: "Matched", COMPLETED: "Completed", CLOSED: "Closed" }[value] || value.replaceAll("_", " ").toLowerCase());

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 30, fontWeight: "700" },
  profile: { alignItems: "center", flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm },
  avatar: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 28, height: 56, justifyContent: "center", width: 56 },
  initials: { color: colors.white, fontSize: 17, fontWeight: "800" },
  handle: { color: colors.ink, fontSize: 17, fontWeight: "700" },
  role: { color: colors.muted, fontSize: 13, marginTop: 3 },
  list: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginHorizontal: spacing.md, paddingVertical: 17 },
  divider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  rowText: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  signOut: { alignItems: "center", borderColor: colors.border, borderRadius: 14, borderWidth: 1, padding: 14 },
  signOutText: { color: colors.danger, fontWeight: "700" },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  sectionCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: -8 },
  helpCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 7, padding: spacing.md },
  helpTop: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  helpTitle: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: "700" },
  helpDetail: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  helpTime: { color: colors.muted, fontSize: 11 },
  status: { backgroundColor: colors.accentSoft, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: colors.accent, fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
});
