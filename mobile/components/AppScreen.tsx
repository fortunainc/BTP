import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/constants/theme";

type Props = PropsWithChildren<{ scroll?: boolean; contentStyle?: ViewStyle }>;

export function AppScreen({ children, scroll = true, contentStyle }: Props) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  scroll: { flexGrow: 1 },
  content: { flex: 1, gap: spacing.md, padding: spacing.lg },
});
