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
  StyleSheet,
  RefreshControl,
  FlatList,
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

export default function BrowsePropertiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilterType>("ALL ASSETS");
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
    <View>
      <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>Available Opportunities</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No properties found.</Text>
    </View>
  );

  const isLoading = authLoading || isFetchingProperties;

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

      {/* ── Scrollable Content (Virtualized List) ── */}
      {isLoading ? (
        <View style={styles.scrollContent}>
          {renderHeader()}
          <PropertySkeleton />
          <PropertySkeleton />
          <PropertySkeleton />
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
