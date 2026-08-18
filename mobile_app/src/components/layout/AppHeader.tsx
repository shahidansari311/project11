/**
 * AppHeader — Universal persistent top bar
 * ─────────────────────────────────────────
 * Rendered once in the Tabs shell. Never re-mounts on tab switch.
 * Shows: [Menu] | Brand Title | [Profile icon or Login button]
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Colors } from "@/constants/colors";

interface AppHeaderProps {
  isGuest?: boolean;
  userProfileUrl?: string | null;
  onLoginPress?: () => void;
  onProfilePress?: () => void;
}

export default function AppHeader({
  isGuest = false,
  userProfileUrl,
  onLoginPress,
  onProfilePress,
}: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={{ width: 40 }} />{/* Placeholder for balance */}

      <Text style={styles.brandTitle}>Silverreal Estate</Text>

      {isGuest ? (
        <TouchableOpacity
          style={styles.loginButton}
          onPress={onLoginPress}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onProfilePress}
          activeOpacity={0.7}
        >
          {userProfileUrl ? (
            <Image
              source={{ uri: userProfileUrl }}
              style={styles.headerAvatar}
              contentFit="cover"
            />
          ) : (
            <Ionicons
              name="person-circle-outline"
              size={26}
              color={Colors.onSurfaceVariant}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  iconButton: {
    padding: 8,
    borderRadius: 99,
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: -0.4,
  },
  loginButton: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onPrimaryContainer,
  },
});
