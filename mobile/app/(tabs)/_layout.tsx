import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Platform, StyleSheet } from "react-native";

import { colors, fonts, gradients } from "@/constants/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Ionicons color={color} name={name} size={23} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.accentBright,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Community",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} name={focused ? "chatbubbles" : "chatbubbles-outline"} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: "Ask",
          tabBarIcon: () => (
            <LinearGradient colors={gradients.button} end={{ x: 1, y: 0.6 }} start={{ x: 0, y: 0.4 }} style={styles.askButton}>
              <Ionicons color={colors.onAccent} name="add" size={22} />
            </LinearGradient>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} name={focused ? "notifications" : "notifications-outline"} />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: "You",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} name={focused ? "person" : "person-outline"} />,
        }}
      />
      {/* Former Questions tab. Kept as a hidden route so old links still land in Community. */}
      <Tabs.Screen name="questions" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0C0706",
    borderTopColor: colors.border,
    height: Platform.OS === "ios" ? 86 : 70,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    paddingTop: 8,
  },
  label: { fontFamily: fonts.sansMedium, fontSize: 11 },
  askButton: { alignItems: "center", borderRadius: 15, height: 30, justifyContent: "center", width: 30 },
});
