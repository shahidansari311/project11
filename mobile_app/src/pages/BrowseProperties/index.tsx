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

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

import BrowseHeader from "./components/BrowseHeader";
import CategoryFilter from "./components/CategoryFilter";
import PropertyCard from "./components/PropertyCard";
import PropertySkeleton from "./components/PropertySkeleton";
import BottomTabBar from "./components/BottomTabBar";
import LoginPromptModal from "../../components/LoginPromptModal";
import { CategoryFilter as CategoryFilterType, Property } from "./data";
import { propertyService } from "../../services/property.service";

export default function BrowsePropertiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilterType>("ALL ASSETS");
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isGuest, setIsGuest] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const fetchProperties = async () => {
    try {
      const res = await propertyService.getProperties();
      if (res && res.data && res.data.properties) {
        setProperties(res.data.properties);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync("refresh_token");
      setIsGuest(!token);
    } catch (e) {
      setIsGuest(true);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    fetchProperties().finally(() => setIsLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProperties();
    await checkAuthStatus();
    setRefreshing(false);
  }, []);

  // DEV ONLY — clears stored tokens and returns to auth screen
  const handleLogout = useCallback(async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    router.replace("/");
  }, [router]);

  /**
   * Derived list: filter properties by category and search query.
   * Runs only when search, category, or properties change.
   */
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
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Sticky Header ── */}
      <BrowseHeader
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isGuest={isGuest}
        onLoginPress={() => router.push("/")}
      />

      {/* ── Scrollable Body ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
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
            {!isLoading ? `${filteredProperties.length} listings` : 'Loading...'}
          </Text>
        </View>

        {/* DEV: Logout button — remove before production */}
        <TouchableOpacity style={styles.devLogoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={16} color="#c0392b" />
          <Text style={styles.devLogoutText}>DEV: Logout</Text>
        </TouchableOpacity>

        {/* Property Cards */}
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

      {/* ── Fixed Bottom Tab Bar ── */}
      <BottomTabBar />

      {/* ── Login Prompt Modal ── */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={() => {
          setShowLoginPrompt(false);
          router.push("/");
        }}
      />
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
