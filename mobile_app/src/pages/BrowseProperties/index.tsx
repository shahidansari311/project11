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

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

import BrowseHeader from "./components/BrowseHeader";
import CategoryFilter from "./components/CategoryFilter";
import PropertyCard from "./components/PropertyCard";
import BottomTabBar from "./components/BottomTabBar";
import { PROPERTIES, CategoryFilter as CategoryFilterType } from "./data";

export default function BrowsePropertiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilterType>("All Assets");

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
});
