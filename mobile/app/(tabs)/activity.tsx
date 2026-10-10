import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors, spacing } from "@/constants/theme";

const items = [
  { icon: "chatbubble-ellipses-outline" as const, title: "Someone answered your question", detail: "A site manager shared how their team approached a similar situation.", time: "12m" },
  { icon: "checkmark-circle-outline" as const, title: "What happened?", detail: "Close the loop on a question you asked last week.", time: "1d" },
];

export default function ActivityScreen() {
  return (
    <AppScreen>
      <Text style={styles.title}>Activity</Text>
      <Text style={styles.subtitle}>Only updates that help you move a case forward.</Text>
      {items.map((item) => (
        <View key={item.title} style={styles.item}>
          <View style={styles.icon}><Ionicons color={colors.accent} name={item.icon} size={22} /></View>
          <View style={styles.copy}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.detail}>{item.detail}</Text></View>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 30, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 15, marginBottom: spacing.sm },
  item: { alignItems: "flex-start", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  icon: { alignItems: "center", backgroundColor: colors.accentSoft, borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  copy: { flex: 1, gap: 4 },
  itemTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  detail: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  time: { color: colors.muted, fontSize: 11 },
});
