import React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Property } from "@/pages/BrowseProperties/data";
import { Colors } from "@/constants/colors";
import PropertyCard from "@/pages/BrowseProperties/components/PropertyCard";
import BuilderListSkeleton from "@/components/layout/BuilderListSkeleton";

interface BuilderPropertyListLayoutProps {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  headerColor: string;
  emptyMessage: string;
  emptySubmessage: string;
  properties: Property[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function BuilderPropertyListLayout({
  title,
  subtitle,
  iconName,
  headerColor,
  emptyMessage,
  emptySubmessage,
  properties,
  isLoading,
  isRefreshing,
  onRefresh,
}: BuilderPropertyListLayoutProps) {
  if (isLoading) {
    return <BuilderListSkeleton />;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scrollContent, { paddingTop: 16 }]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={headerColor} />
      }
      showsVerticalScrollIndicator={false}
    >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
          </View>

          <View style={styles.listContainer}>
            {properties.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="documents-outline" size={64} color={Colors.onSurfaceVariant + "50"} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>{emptyMessage}</Text>
                <Text style={styles.emptySubtitle}>{emptySubmessage}</Text>
              </View>
            ) : (
              properties.map(prop => (
                <PropertyCard key={prop.id} property={prop} />
              ))
            )}
          </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: "#F3F4F6" 
  },
  scrollContent: { 
    flexGrow: 1,
    paddingHorizontal: 16, 
    paddingBottom: 120 
  },
  headerRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 20 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#111827" 
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: "#6B7280", 
    marginTop: 2 
  },
  listContainer: { 
    gap: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.onSurface,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
  },
});
