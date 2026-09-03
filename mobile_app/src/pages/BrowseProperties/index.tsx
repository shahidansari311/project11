/**
 * BrowseProperties Page — Pure content, no shell chrome.
 * ─────────────────────────────────────────────────────────
 * Search bar (sticky) → Category filters → Property cards
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  RefreshControl,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useDebounce } from "../../hooks/useDebounce";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

import CategoryFilter from "./components/CategoryFilter";
import PropertyCard from "./components/PropertyCard";
import PropertySkeleton from "./components/PropertySkeleton";
import FilterModal, { FilterType, ActiveFilters, FilterData } from "./components/FilterModal";
import LoginPromptModal from "../../components/LoginPromptModal";
import { CategoryFilter as CategoryFilterType, Property } from "./data";
import { propertyService } from "../../services/property.service";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useAuth } from "../../contexts/AuthContext";

/** Generic filter chips — UI-only for now, to be wired to backend modal */
const DUMMY_FILTERS = [
  { label: "Price", icon: "cash-outline" as const },
  { label: "Location", icon: "location-outline" as const },
  { label: "Area", icon: "expand-outline" as const },
  { label: "Status", icon: "shield-checkmark-outline" as const },
];

const STATIC_FILTER_DATA: FilterData = {
  categories: ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "LAND"],
  statuses: ["AVAILABLE", "SOLD", "UNDER_REVIEW", "COMING_SOON"],
  locations: ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai"],
  minPrice: 0,
  maxPrice: 100000000,
  minArea: 0,
  maxArea: 100000,
};

export default function BrowsePropertiesPage() {
  const router = useRouter();
  const mounted = useRef(true);
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [activeCategory, setActiveCategory] = useState<string>("ALL ASSETS");
  const [categories, setCategories] = useState<string[]>(["ALL ASSETS", ...STATIC_FILTER_DATA.categories]);
  
  // Modal & Active Filters State
  const [filterData, setFilterData] = useState<FilterData>(STATIC_FILTER_DATA);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  
  const hasActiveFilters = useMemo(() => {
    return Object.values(activeFilters).some(v => v !== undefined && v !== null);
  }, [activeFilters]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalFilterType, setModalFilterType] = useState<FilterType>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [isFetchingProperties, setIsFetchingProperties] = useState(true);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { refreshFavorites } = useFavorites();
  const { isGuest, refreshAuth, isLoading: authLoading } = useAuth();

  // Filters are now static, no need to fetch them from backend on mount.

  const fetchProperties = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    try {
      const res = await propertyService.getProperties({
        page: pageNum,
        limit: 10,
        search: debouncedSearch,
        category: activeCategory === "ALL ASSETS" ? undefined : activeCategory,
        ...activeFilters
      });
      
      if (!mounted.current) return;
      
      if (res?.data?.properties) {
        if (isRefresh || pageNum === 1) {
          setProperties(res.data.properties);
        } else {
          setProperties(prev => [...prev, ...res.data.properties]);
        }
        setHasMore(res.data.pagination.page < res.data.pagination.totalPages);
      }
    } catch (error) {
      if (mounted.current) console.error("Failed to fetch properties:", error);
    }
  }, [debouncedSearch, activeCategory, activeFilters]);

  useEffect(() => {
    let ignore = false;
    setIsFetchingProperties(true);
    setPage(1);
    fetchProperties(1, true).finally(() => {
      if (!ignore && mounted.current) setIsFetchingProperties(false);
    });
    return () => { ignore = true; };
  }, [debouncedSearch, activeCategory, fetchProperties]);

  const handleLoadMore = () => {
    if (!hasMore || isFetchingMore || isFetchingProperties) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProperties(nextPage).finally(() => setIsFetchingMore(false));
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await Promise.all([fetchProperties(1, true), refreshAuth(), refreshFavorites()]);
    setRefreshing(false);
  }, [fetchProperties, refreshAuth, refreshFavorites]);

  const handleRequireLogin = useCallback(() => {
    setShowLoginPrompt(true);
  }, []);

  const renderPropertyItem = useCallback(({ item }: { item: Property }) => (
    <View style={styles.cardWrapper}>
      <PropertyCard
        property={item}
        isGuest={isGuest}
        onRequireLogin={handleRequireLogin}
      />
    </View>
  ), [isGuest, handleRequireLogin]);

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <CategoryFilter categories={categories} active={activeCategory} onChange={setActiveCategory} />
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>Featured Properties</Text>
        {/* <Text style={styles.sectionCount}>
          {properties.length}{" "}
          {properties.length === 1 ? "listing" : "listings"}
        </Text> */}
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
          {hasActiveFilters && (
            <TouchableOpacity
              style={[styles.filterChip, styles.resetChip]}
              activeOpacity={0.75}
              onPress={() => setActiveFilters({})}
            >
              <Ionicons name="refresh" size={14} color={Colors.onErrorContainer} />
              <Text style={styles.resetChipLabel}>Reset</Text>
            </TouchableOpacity>
          )}
          {DUMMY_FILTERS.map((filter) => {
            let isActive = false;
            if (filter.label === "Price") isActive = !!(activeFilters.minPrice !== undefined || activeFilters.maxPrice !== undefined);
            if (filter.label === "Location") isActive = !!activeFilters.location;
            if (filter.label === "Area") isActive = !!(activeFilters.minArea !== undefined || activeFilters.maxArea !== undefined);
            if (filter.label === "Status") isActive = !!activeFilters.status;

            return (
              <TouchableOpacity
                key={filter.label}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                activeOpacity={0.75}
                onPress={() => {
                  setModalFilterType(filter.label as FilterType);
                  setModalVisible(true);
                }}
              >
                <Ionicons
                  name={filter.icon}
                  size={13}
                  color={isActive ? Colors.onPrimary : Colors.primary}
                />
                <Text style={[styles.filterChipLabel, isActive && styles.filterChipLabelActive]}>
                  {filter.label}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={11}
                  color={isActive ? Colors.onPrimary : Colors.outline}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Virtualized Property List ── */}
      {isLoading ? (
        <View style={styles.scrollContent}>
          {renderHeader()}
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.cardWrapper}>
              <PropertySkeleton />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingMore ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ margin: 16 }} />
            ) : <View style={{ height: 24 }} />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          renderItem={renderPropertyItem}
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

      {/* ── Filter Modal ── */}
      <FilterModal
        visible={modalVisible}
        filterType={modalFilterType}
        filterData={filterData}
        activeFilters={activeFilters}
        onClose={() => setModalVisible(false)}
        onApply={(newFilters) => setActiveFilters(newFilters)}
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
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  filterChipLabelActive: {
    color: Colors.onPrimary,
  },
  resetChip: {
    backgroundColor: Colors.errorContainer,
    borderColor: Colors.errorContainer,
    borderStyle: "dashed",
  },
  resetChipLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.onErrorContainer,
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
