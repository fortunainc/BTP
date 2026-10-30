import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/AppScreen";
import { BackLink, Button, Mark } from "@/components/ui";
import { colors, fonts, spacing, type } from "@/constants/theme";

const benefits = [
  { icon: "chatbubble-outline" as const, title: "Ask openly", copy: "Your posts show your handle and general role, not your name or employer." },
  { icon: "bulb-outline" as const, title: "Learn from experience", copy: "Find practical answers from other clinical research professionals." },
  { icon: "people-outline" as const, title: "Help someone move forward", copy: "Share something you’ve learned. Your experience could be the answer someone needs." },
];

export function AboutBtp({ onContinue, onBack }: { onContinue?: () => void; onBack?: () => void }) {
  return <AppScreen contentStyle={styles.content}>
    {onBack ? <BackLink onPress={onBack} /> : null}
    <Mark size={26} />
    <Text style={type.eyebrow}>What is BTP?</Text>
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={type.display}>Hard questions.{"\n"}Practical answers.</Text>
      <Text style={styles.tagline}>Experience you won’t find in a protocol.</Text>
    </View>
    <Text style={type.body}>A private community for clinical research professionals to ask questions, share what works, and get help from people who understand the work.</Text>
    <View style={styles.benefits}>
      {benefits.map(({ icon, title, copy }) => <View key={title} style={styles.benefit}>
        <Ionicons name={icon} color={colors.accentBright} size={22} style={styles.icon} />
        <View style={styles.benefitText}>
          <Text accessibilityRole="header" style={type.section}>{title}</Text>
          <Text style={type.small}>{copy}</Text>
        </View>
      </View>)}
    </View>
    {onContinue ? <Button label="Explore the community" onPress={onContinue} /> : null}
  </AppScreen>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.lg },
  heading: { gap: spacing.sm },
  tagline: { color: colors.accentBright, fontFamily: fonts.serifItalic, fontSize: 22, lineHeight: 28 },
  benefits: { borderTopWidth: 1, borderTopColor: colors.border },
  benefit: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: { marginTop: 3 },
  benefitText: { flex: 1, gap: spacing.xs },
});
