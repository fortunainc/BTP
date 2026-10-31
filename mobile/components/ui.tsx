import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, fonts, gradients, radius, spacing, type } from "@/constants/theme";

/** The boxed BTP mark used on the website. */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <View accessibilityLabel="BTP" accessible style={[styles.mark, { borderRadius: size * 0.3, paddingHorizontal: size * 0.42 }]}>
      <Text style={[styles.markText, { fontSize: size, lineHeight: size * 1.25 }]}>BTP</Text>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "quiet";
  disabled?: boolean;
  busy?: boolean;
  icon?: ComponentProps<typeof Ionicons>["name"];
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({ label, onPress, variant = "primary", disabled, busy, icon, style, accessibilityHint }: ButtonProps) {
  const inactive = disabled || busy;
  const content = (
    <View style={styles.buttonInner}>
      {busy ? <ActivityIndicator color={variant === "primary" ? colors.onAccent : colors.accentBright} size="small" /> : icon ? <Ionicons color={variant === "primary" ? colors.onAccent : colors.accentBright} name={icon} size={18} /> : null}
      <Text style={[styles.buttonText, variant === "primary" ? styles.primaryText : styles.ghostText]}>{label}</Text>
    </View>
  );
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(busy) }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, variant === "ghost" && styles.ghost, variant === "quiet" && styles.quiet, inactive && styles.disabled, pressed && styles.pressed, style]}
    >
      {variant === "primary" ? (
        <LinearGradient colors={gradients.button} end={{ x: 1, y: 0.6 }} start={{ x: 0, y: 0.4 }} style={styles.gradient}>{content}</LinearGradient>
      ) : content}
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: Boolean(active) }} onPress={onPress} style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Handle and general role, the only identity shown with posts. */
export function AuthorLine({ handle, role, time, mine }: { handle?: string | null; role?: string | null; time?: string; mine?: boolean }) {
  // Editorial prompts retain their origin privately, without a member attribution.
  if (role === "Community question") return time ? <Text style={styles.author}>{time}</Text> : null;
  const parts = [role || "BTP member", time].filter(Boolean).join(" · ");
  return (
    <Text numberOfLines={1} style={styles.author}>
      <Text style={styles.handle}>{mine ? "You" : handle || "BTP member"}</Text>
      <Text>{"  "}{parts}</Text>
    </Text>
  );
}

export function StateBox({ title, copy, tone = "neutral", action }: { title: string; copy?: string; tone?: "neutral" | "error"; action?: ReactNode }) {
  return (
    <View accessibilityLiveRegion="polite" style={[styles.state, tone === "error" && styles.stateError]}>
      <Text style={[styles.stateTitle, tone === "error" && { color: colors.danger }]}>{title}</Text>
      {copy ? <Text style={styles.stateCopy}>{copy}</Text> : null}
      {action}
    </View>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <View accessibilityLabel={label} style={styles.loading}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.stateCopy}>{label}</Text>
    </View>
  );
}

export function BackLink({ label = "Back", onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={12} onPress={onPress} style={styles.back}>
      <Ionicons color={colors.accentBright} name="chevron-back" size={18} />
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  mark: { alignSelf: "flex-start", borderColor: "rgba(232,204,148,.55)", borderWidth: 1, paddingTop: 1 },
  markText: { color: colors.accentBright, fontFamily: fonts.mark },
  button: { borderRadius: radius.md, minHeight: 50, overflow: "hidden" },
  gradient: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 50, paddingHorizontal: spacing.md },
  buttonInner: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 50, paddingHorizontal: spacing.md },
  ghost: { borderColor: colors.borderStrong, borderWidth: 1 },
  quiet: { minHeight: 40 },
  buttonText: { fontSize: 15.5 },
  primaryText: { color: colors.onAccent, fontFamily: fonts.sansSemiBold },
  ghostText: { color: colors.accentBright, fontFamily: fonts.sansSemiBold },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.78 },
  chip: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.borderStrong },
  chipText: { color: colors.muted, fontFamily: fonts.sansMedium, fontSize: 13.5 },
  chipTextActive: { color: colors.accentBright },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  author: { ...type.meta },
  handle: { color: colors.accentBright, fontFamily: fonts.sansSemiBold },
  state: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  stateError: { backgroundColor: colors.dangerSoft, borderColor: "rgba(226,154,143,.35)" },
  stateTitle: { color: colors.inkStrong, fontFamily: fonts.serif, fontSize: 19, textAlign: "center" },
  stateCopy: { ...type.small, textAlign: "center" },
  loading: { alignItems: "center", gap: spacing.sm, padding: spacing.lg },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 2, minHeight: 32 },
  backText: { color: colors.accentBright, fontFamily: fonts.sansSemiBold, fontSize: 14.5 },
});
