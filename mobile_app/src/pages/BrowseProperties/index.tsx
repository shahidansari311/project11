/**
 * BrowseProperties Page — Pure content, no shell chrome.
 * ─────────────────────────────────────────────────────────
 * Search bar (sticky) → Category filters → Property cards
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  RefreshControl,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

import CategoryFilter from "./components/CategoryFilter";
import PropertyCard from "./components/PropertyCard";
import PropertySkeleton from "./components/PropertySkeleton";
import LoginPromptModal from "../../components/LoginPromptModal";
import { CategoryFilter as CategoryFilterType, Property } from "./data";
import { propertyService } from "../../services/property.service";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useAuth } from "../../contexts/AuthContext";

/** Dummy filter chips — UI-only, no logic attached */
const DUMMY_FILTERS = [
  { label: "Price", icon: "cash-outline" as const },
  { label: "Location", icon: "location-outline" as const },
  { label: "Area", icon: "expand-outline" as const },
  { label: "Status", icon: "shield-checkmark-outline" as const },
];

export default function BrowsePropertiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilterType>("ALL ASSETS");
  const [properties, setProperties] = useState<Property[]>([]);
  const [isFetchingProperties, setIsFetchingProperties] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { refreshFavorites } = useFavorites();
  const { isGuest, refreshAuth, isLoading: authLoading } = useAuth();

  const fetchProperties = useCallback(async () => {
    try {
      const res = await propertyService.getProperties();
      if (res?.data?.properties) {
        setProperties(res.data.properties);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    }
  }, []);

  useEffect(() => {
    fetchProperties().finally(() => setIsFetchingProperties(false));
  }, [fetchProperties]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProperties(), refreshAuth(), refreshFavorites()]);
    setRefreshing(false);
  }, [fetchProperties, refreshAuth, refreshFavorites]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesCategory =
        activeCategory === "ALL ASSETS" || p.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory, properties]);

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>Featured Properties</Text>
        <Text style={styles.sectionCount}>
          {filteredProperties.length}{" "}
          {filteredProperties.length === 1 ? "listing" : "listings"}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name="search"
          size={28}
          color={Colors.primary}
        />
      </View>
      <Text style={styles.emptyText}>No matching properties</Text>
      <Text style={styles.emptySubtext}>
        Try tweaking your search term or category filters.
      </Text>
    </View>
  );

  const isLoading = authLoading || isFetchingProperties;

  return (
    <View style={styles.root}>
      {/* ── Search Bar & Filter Chips Header ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={Colors.primary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city, neighborhood, project..."
            placeholderTextColor={Colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={Colors.outline}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {DUMMY_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.label}
              style={styles.filterChip}
              activeOpacity={0.75}
            >
              <Ionicons
                name={filter.icon}
                size={13}
                color={Colors.primary}
              />
              <Text style={styles.filterChipLabel}>{filter.label}</Text>
              <Ionicons
                name="chevron-down"
                size={11}
                color={Colors.outline}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Virtualized Property List ── */}
      {isLoading ? (
        <View style={styles.scrollContent}>
          {renderHeader()}
          <View style={styles.cardWrapper}><PropertySkeleton /></View>
          <View style={styles.cardWrapper}><PropertySkeleton /></View>
          <View style={styles.cardWrapper}><PropertySkeleton /></View>
        </View>
      ) : (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <PropertyCard
                property={item}
                isGuest={isGuest}
                onRequireLogin={() => setShowLoginPrompt(true)}
              />
            </View>
          )}
        />
      )}

      {/* ── Login Prompt Modal ── */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={() => {
          setShowLoginPrompt(false);
          router.push("/");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  // ── Search Section ──
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    backgroundColor: Colors.surface,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(225, 227, 228, 0.8)",
    borderRadius: 16,
    height: 44,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: "500",
    padding: 0,
  },
  // ── Dummy Filters ──
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
    paddingBottom: 2,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  // ── Scroll Content (Padding at bottom for Floating TabBar) ──
  scrollContent: {
    paddingTop: 2,
    paddingBottom: 24,
  },
  headerWrapper: {
    marginBottom: 2,
  },
  // ── Section Heading ──
  sectionHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.onSurface,
    letterSpacing: -0.4,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.outline,
  },
  // ── Cards ──
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  // ── Empty state ──
  emptyState: {
    paddingTop: 60,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.outline,
    marginTop: 6,
    textAlign: "center",
  },
});
