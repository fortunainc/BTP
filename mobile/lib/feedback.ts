import * as Haptics from "expo-haptics";
import { AccessibilityInfo, Platform } from "react-native";

let reduceMotion = false;
void AccessibilityInfo.isReduceMotionEnabled().then((value) => { reduceMotion = value; }).catch(() => undefined);
AccessibilityInfo.addEventListener?.("reduceMotionChanged", (value) => { reduceMotion = value; });

/** True when the member asked the system to reduce motion. */
export const prefersReducedMotion = () => reduceMotion;

/** Light confirmation for a successful action. Silent on web and on failure. */
export function confirmTap() {
  if (Platform.OS === "web") return;
  void Haptics.selectionAsync().catch(() => undefined);
}

export function confirmSuccess() {
  if (Platform.OS === "web") return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

export function announce(message: string) {
  AccessibilityInfo.announceForAccessibility?.(message);
}
