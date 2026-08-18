/**
 * BrowseProperties Page — Pure content, no shell chrome.
 * ─────────────────────────────────────────────────────────
 * The AppHeader and AppTabBar live in (tabs)/_layout.tsx.
 * This component renders only its own content:
 *   Search bar (sticky) → Category filters → Property cards
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

import CategoryFilter from "./components/CategoryFilter";
import PropertyCard from "./components/PropertyCard";
import PropertySkeleton from "./components/PropertySkeleton";
import LoginPromptModal from "../../components/LoginPromptModal";
import { CategoryFilter as CategoryFilterType, Property } from "./data";
import { propertyService } from "../../services/property.service";
import { useFavorites } from "../../contexts/FavoritesContext";

export default function BrowsePropertiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilterType>("ALL ASSETS");
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { refreshFavorites } = useFavorites();

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

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("refresh_token");
      setIsGuest(!token);
    } catch {
      setIsGuest(true);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
    fetchProperties().finally(() => setIsLoading(false));
  }, [checkAuthStatus, fetchProperties]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProperties(), checkAuthStatus(), refreshFavorites()]);
    setRefreshing(false);
  }, [fetchProperties, checkAuthStatus, refreshFavorites]);

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

  return (
    <View style={styles.root}>
      {/* ── Sticky Search Bar ── */}
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
            placeholder="Search properties..."
            placeholderTextColor={Colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />

        {/* Section heading */}
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Available Opportunities</Text>
          {/* <Text style={styles.sectionCount}>
            {!isLoading ? `${filteredProperties.length} listings` : "Loading..."}
          </Text> */}
        </View>

        {/* Property cards */}
        {isLoading ? (
          <>
            <PropertySkeleton />
            <PropertySkeleton />
            <PropertySkeleton />
          </>
        ) : filteredProperties.length > 0 ? (
          filteredProperties.map((property) => (
            <View key={property.id} style={styles.cardWrapper}>
              <PropertyCard
                property={property}
                isGuest={isGuest}
                onRequireLogin={() => setShowLoginPrompt(true)}
              />
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No properties found.</Text>
          </View>
        )}
      </ScrollView>

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
  // ── Search bar ──
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    height: 46,
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
  // ── Scroll ──
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
