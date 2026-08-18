/**
 * BottomTabBar — Fixed 4-tab navigation bar
 * ──────────────────────────────────────────
 * Tabs: Portfolio · Explore (active) · Insights · Profile
 *
 * NOTE: This is currently a static visual component.
 *       Real navigation will be wired via expo-router tabs in a future task.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

export type TabKey = "portfolio" | "explore" | "insights" | "profile";

interface TabItem {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route?: string;
}

const TABS: TabItem[] = [
  {
    key: "portfolio",
    label: "Portfolio",
    icon: "business-outline",
    activeIcon: "business",
  },
  {
    key: "explore",
    label: "Explore",
    icon: "search-outline",
    activeIcon: "search",
    route: "/(tabs)/home",
  },
  {
    key: "insights",
    label: "Insights",
    icon: "bar-chart-outline",
    activeIcon: "bar-chart",
  },
  {
    key: "profile",
    label: "Profile",
    icon: "person-outline",
    activeIcon: "person",
    route: "/profile",
  },
];

interface BottomTabBarProps {
  activeTab: TabKey;
}

export default function BottomTabBar({ activeTab }: BottomTabBarProps) {
  const router = useRouter();

  const handleTabPress = (tab: TabItem) => {
    if (tab.key === activeTab) return;
    
    if (tab.route) {
      router.replace(tab.route as any);
    } else {
      Alert.alert("Coming Soon", `The ${tab.label} feature is coming soon!`);
    }
  };

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={22}
              color={isActive ? Colors.onPrimaryContainer : Colors.onSecondaryContainer}
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
    paddingBottom: 24, // extra bottom padding for home-bar devices
    // Top shadow
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
