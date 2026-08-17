/**
 * BrowseHeader — Top sticky header for Browse Properties screen
 * ──────────────────────────────────────────────────────────────
 * Contains:
 *  - Left: hamburger menu icon
 *  - Center: brand title "Silverreal Estate"
 *  - Right: profile / account icon
 *  - Below: search input with leading search icon
 */

import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface BrowseHeaderProps {
  searchValue: string;
  onSearchChange: (text: string) => void;
  onMenuPress?: () => void;
  onProfilePress?: () => void;
}

export default function BrowseHeader({
  searchValue,
  onSearchChange,
  onMenuPress,
  onProfilePress,
}: BrowseHeaderProps) {
  return (
    <View style={styles.container}>
      {/* ── Top row: menu · title · profile ── */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>Silverreal Estate</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onProfilePress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="person-circle-outline"
            size={26}
            color={Colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={Colors.outline}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            placeholderTextColor={Colors.outline}
            value={searchValue}
            onChangeText={onSearchChange}
            returnKeyType="search"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingBottom: 12,
    // subtle bottom shadow to "dock" the header
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 64,
  },
  iconButton: {
    padding: 8,
    borderRadius: 99,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: -0.4,
  },
  searchRow: {
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: "400",
    padding: 0,
  },
});
