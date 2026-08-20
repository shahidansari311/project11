/**
 * AppHeader — Universal persistent top bar
 * ─────────────────────────────────────────
 * Clean, borderless header with brand typography and sleek profile avatar badge.
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
      {/* Brand Title */}
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <Ionicons name="business" size={16} color={Colors.onPrimary} />
        </View>
        <Text style={styles.brandTitle}>
          Silver<Text style={styles.brandSubtitle}>RealEstate</Text>
        </Text>
      </View>

      {/* Action: Profile or Login */}
      {isGuest ? (
        <TouchableOpacity
          style={styles.loginButton}
          onPress={onLoginPress}
          activeOpacity={0.85}
        >
          <Text style={styles.loginButtonText}>Sign In</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.onPrimary} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onProfilePress}
          activeOpacity={0.8}
        >
          {userProfileUrl ? (
            <Image
              source={{ uri: userProfileUrl }}
              style={styles.headerAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons
                name="person"
                size={16}
                color={Colors.primary}
              />
            </View>
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
    paddingHorizontal: 20,
    height: 56,
    backgroundColor: Colors.surface,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontWeight: "400",
    color: Colors.secondary,
  },
  iconButton: {
    padding: 2,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.onPrimary,
  },
});
