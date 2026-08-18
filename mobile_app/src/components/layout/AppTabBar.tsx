/**
 * AppTabBar — Universal persistent bottom tab bar
 * ─────────────────────────────────────────────────
 * Rendered once in the Tabs shell. Never re-mounts on tab switch.
 * Renders 4 visual tabs; "Portfolio" and "Insights" show a Coming Soon alert.
 * "Explore" maps to the "home" screen; "Profile" maps to the "profile" screen.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface VisualTab {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  /** The expo-router screen name this tab navigates to. null = Coming Soon. */
  routeName: string | null;
}

const VISUAL_TABS: VisualTab[] = [
  {
    id: "portfolio",
    label: "Portfolio",
    icon: "business-outline",
    activeIcon: "business",
    routeName: null,
  },
  {
    id: "explore",
    label: "Explore",
    icon: "search-outline",
    activeIcon: "search",
    routeName: "home",
  },
  {
    id: "insights",
    label: "Insights",
    icon: "bar-chart-outline",
    activeIcon: "bar-chart",
    routeName: null,
  },
  {
    id: "profile",
    label: "Profile",
    icon: "person-outline",
    activeIcon: "person",
    routeName: "profile",
  },
];

interface AppTabBarProps {
  /** Current active route name from the Tabs navigator (e.g. "home" or "profile"). */
  activeRouteName: string;
  onTabPress: (routeName: string) => void;
}

export default function AppTabBar({ activeRouteName, onTabPress }: AppTabBarProps) {
  const handlePress = (tab: VisualTab) => {
    if (!tab.routeName) {
      Alert.alert("Coming Soon", `The ${tab.label} feature is coming soon!`);
      return;
    }
    onTabPress(tab.routeName);
  };

  return (
    <View style={styles.container}>
      {VISUAL_TABS.map((tab) => {
        const isActive = tab.routeName === activeRouteName;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => handlePress(tab)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={22}
              color={
                isActive ? Colors.onPrimaryContainer : Colors.onSecondaryContainer
              }
            />
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 28,
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: Colors.primaryContainer,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: Colors.onPrimaryContainer,
  },
  tabLabelInactive: {
    color: Colors.onSecondaryContainer,
  },
});
