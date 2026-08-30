import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Colors } from "@/constants/colors";

import { favoriteService } from "../../services/favorite.service";
import { Property } from "../BrowseProperties/data";
import PropertyCard from "../BrowseProperties/components/PropertyCard";
import PropertySkeleton from "../BrowseProperties/components/PropertySkeleton";
import LoginPromptModal from "@/components/LoginPromptModal";
import { useFavorites } from "../../contexts/FavoritesContext";

export default function SavedPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { refreshFavorites } = useFavorites();

  const fetchSavedProperties = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("refresh_token");
      if (!token) {
        setIsGuest(true);
        setIsLoading(false);
        return;
      }
      setIsGuest(false);
      
      const response = await favoriteService.getFavoriteProperties();
      if (response && response.data) {
        setProperties(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch saved properties:", error);
      setIsGuest(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedProperties();
  }, [fetchSavedProperties]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchSavedProperties(), refreshFavorites()]);
    setIsRefreshing(false);
  };

  const handleRequireLogin = useCallback(() => {
    setShowLoginPrompt(true);
  }, []);

  const renderPropertyItem = useCallback(({ item }: { item: Property }) => (
    <PropertyCard
      property={item}
      isGuest={isGuest}
      onRequireLogin={handleRequireLogin}
    />
  ), [isGuest, handleRequireLogin]);

  const renderSkeleton = useCallback(() => <PropertySkeleton />, []);

  if (isLoading) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Properties</Text>
        </View>
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(i) => i.toString()}
          renderItem={renderSkeleton}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    );
  }

  if (isGuest) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <Ionicons name="heart-circle-outline" size={80} color={Colors.outlineVariant} />
        <Text style={styles.guestTitle}>Login Required</Text>
        <Text style={styles.guestSubtitle}>Please login to view and manage your saved properties.</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/")}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Login to Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Properties</Text>
        <Text style={styles.headerSubtitle}>
          {properties.length} {properties.length === 1 ? "property" : "properties"}
        </Text>
      </View>

      {properties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-dislike-outline" size={64} color={Colors.outlineVariant} />
          <Text style={styles.emptyTitle}>No saved properties</Text>
          <Text style={styles.emptySubtitle}>Tap the heart icon on any property to save it here.</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.navigate("/(tabs)/home")}
            activeOpacity={0.8}
          >
            <Text style={styles.exploreButtonText}>Explore Properties</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={renderPropertyItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        />
      )}

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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 20,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  exploreButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
  }
});
