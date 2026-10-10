import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors, spacing } from "@/constants/theme";

const rows = ["Verification and role", "Expertise and topics", "Privacy", "Notifications", "Private help"];

export default function YouScreen() {
  return (
    <AppScreen>
      <Text style={styles.title}>You</Text>
      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.initials}>VP</Text></View>
        <View><Text style={styles.handle}>Verified professional</Text><Text style={styles.role}>Clinical operations · identity protected</Text></View>
      </View>
      <View style={styles.list}>
        {rows.map((row, index) => (
          <View key={row} style={[styles.row, index < rows.length - 1 && styles.divider]}>
            <Text style={styles.rowText}>{row}</Text>
            <Ionicons color={colors.muted} name="chevron-forward" size={18} />
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

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
});
