/**
 * AppTabBar — Universal persistent bottom tab bar
 * ─────────────────────────────────────────────────
 * Rendered once in the Tabs shell. Never re-mounts on tab switch.
 * Renders 4 visual tabs; "Portfolio" and "Insights" show a Coming Soon alert.
 * "Explore" maps to the "home" screen; "Profile" maps to the "profile" screen.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
    id: "saved",
    label: "Saved",
    icon: "heart-outline",
    activeIcon: "heart",
    routeName: "saved",
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
  userProfileUrl?: string | null;
  onTabPress: (routeName: string) => void;
}

export default function AppTabBar({ activeRouteName, userProfileUrl, onTabPress }: AppTabBarProps) {
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
            {tab.id === "profile" && userProfileUrl ? (
              <View style={[styles.tabAvatarContainer, isActive && styles.tabAvatarContainerActive]}>
                <Image
                  source={{ uri: userProfileUrl }}
                  style={styles.tabAvatar}
                  contentFit="cover"
                />
              </View>
            ) : (
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={
                  isActive ? Colors.onPrimary : Colors.onSecondaryContainer
                }
              />
            )}
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
    marginHorizontal: 16,
    marginBottom: Platform.OS === "ios" ? 14 : 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 24,
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(225, 227, 228, 0.8)",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
  },
  tabAvatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    overflow: "hidden",
  },
  tabAvatarContainerActive: {
    borderColor: Colors.onPrimary,
  },
  tabAvatar: {
    width: "100%",
    height: "100%",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: Colors.onPrimary,
  },
  tabLabelInactive: {
    color: Colors.onSecondaryContainer,
  },
});
