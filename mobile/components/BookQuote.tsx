import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/constants/theme";

/** Founding line from the book "Behind the Protocol", shown word for word. */
export function BookQuote({ compact = false }: { compact?: boolean }) {
  return <View accessible accessibilityLabel="The people running clinical trials see the failures first, and the system was never built to hear them. From Behind the Protocol. BTP is the system built to hear them." style={[styles.card, compact && styles.compact]}>
    <Text style={[styles.quote, compact && styles.quoteCompact]}>“The people running clinical trials see the failures first, and the system was never built to hear them.”</Text>
    <Text style={styles.cite}>FROM <Text style={styles.citeTitle}>Behind the Protocol</Text></Text>
    <View style={styles.rule} />
    <Text style={styles.answer}>BTP is the system built to hear them.</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.oxblood, borderRadius: 18, gap: 10, padding: spacing.lg },
  compact: { padding: spacing.md },
  quote: { color: colors.background, fontFamily: "CormorantGaramond-Italic", fontSize: 24, lineHeight: 31 },
  quoteCompact: { fontSize: 20, lineHeight: 26 },
  cite: { color: "#D8C7B8", fontFamily: "Geist", fontSize: 10, letterSpacing: 1.4 },
  citeTitle: { fontFamily: "CormorantGaramond-Italic", fontSize: 13, letterSpacing: 0 },
  rule: { backgroundColor: "rgba(201,166,107,0.45)", height: 1, marginVertical: 2 },
  answer: { color: colors.gilt, fontFamily: "Geist", fontSize: 15, fontWeight: "700" },
});
