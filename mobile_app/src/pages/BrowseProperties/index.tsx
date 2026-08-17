/**
 * BrowseProperties Page — Composer
 * ──────────────────────────────────
 * Thin composer that assembles the browse screen from isolated
 * sub-components. All business logic (filtering, search) lives here;
 * each sub-component handles its own rendering.
 *
 * Component tree:
 *   <View> (root)
 *     <StatusBar>
 *     <BrowseHeader>         ← sticky top bar + search
 *     <ScrollView>           ← main scrollable content
 *       <CategoryFilter>     ← horizontal filter chips
 *       <SectionHeading>     ← "Available Opportunities" + count
 *       <PropertyCard> × N   ← one card per listing
 *     </ScrollView>
 *     <BottomTabBar>         ← fixed bottom navigation
 *   </View>
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

import BrowseHeader from "./components/BrowseHeader";
import CategoryFilter from "./components/CategoryFilter";
import PropertyCard from "./components/PropertyCard";
import BottomTabBar from "./components/BottomTabBar";
import { PROPERTIES, CategoryFilter as CategoryFilterType } from "./data";

export default function BrowsePropertiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilterType>("All Assets");

  // DEV ONLY — clears stored tokens and returns to auth screen
  const handleLogout = useCallback(async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    router.replace("/");
  }, [router]);

  /**
   * Derived list: filter PROPERTIES by category and search query.
   * Runs only when search or category changes.
   */
  const filteredProperties = useMemo(() => {
    return PROPERTIES.filter((p) => {
      const matchesCategory =
        activeCategory === "All Assets" || p.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Sticky Header ── */}
      <BrowseHeader
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ── Scrollable Body ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter Chips */}
        <CategoryFilter
          active={activeCategory}
          onChange={setActiveCategory}
        />

        {/* Section heading */}
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Available Opportunities</Text>
          <Text style={styles.sectionCount}>
            {filteredProperties.length} listings
          </Text>
        </View>

        {/* DEV: Logout button — remove before production */}
        <TouchableOpacity style={styles.devLogoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={16} color="#c0392b" />
          <Text style={styles.devLogoutText}>DEV: Logout</Text>
        </TouchableOpacity>

        {/* Property Cards */}
        {filteredProperties.length > 0 ? (
          filteredProperties.map((property) => (
            <View key={property.id} style={styles.cardWrapper}>
              <PropertyCard property={property} />
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No properties found.</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Fixed Bottom Tab Bar ── */}
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  // ── Section Heading ──
  sectionHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.onSurface,
    letterSpacing: -0.4,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.2,
  },
  // ── Cards ──
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  // ── Empty state ──
  emptyState: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  // ── DEV Logout ──
  devLogoutButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c0392b",
    backgroundColor: "#fff5f5",
  },
  devLogoutText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#c0392b",
  },
});
