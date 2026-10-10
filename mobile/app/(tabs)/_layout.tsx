import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { colors, fonts } from "@/constants/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, color, focused }: { name: IconName; color: string; focused: boolean }) {
  return <Ionicons color={color} name={name} size={focused ? 25 : 23} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={focused ? "home" : "home-outline"} />,
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          title: "Questions",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={focused ? "chatbubbles" : "chatbubbles-outline"} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: "Ask BTP",
          tabBarIcon: () => (
            <View style={styles.askButton}>
              <Ionicons color={colors.white} name="add" size={30} />
            </View>
          ),
          tabBarLabelStyle: [styles.label, styles.askLabel],
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={focused ? "notifications" : "notifications-outline"} />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: "You",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={focused ? "person" : "person-outline"} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: Platform.OS === "ios" ? 88 : 72,
    paddingBottom: Platform.OS === "ios" ? 22 : 10,
    paddingTop: 8,
  },
  label: { fontFamily: fonts.interface, fontSize: 11, fontWeight: "600" },
  askButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderColor: colors.background,
    borderRadius: 28,
    borderWidth: 4,
    height: 56,
    justifyContent: "center",
    marginTop: -22,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    width: 56,
  },
  askLabel: { color: colors.accent, fontWeight: "700" },
});
