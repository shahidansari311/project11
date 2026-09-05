import { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, Text } from "react-native";
import { propertyService } from "@/services/property.service";
import { Property } from "@/pages/BrowseProperties/data";
import { Colors } from "@/constants/colors";
import PropertyCard from "@/pages/BrowseProperties/components/PropertyCard";
import HomePageSkeleton from "@/pages/BrowseProperties/components/HomePageSkeleton";
import { useFocusEffect } from "expo-router";

export default function BuilderLiveTab() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProperties = useCallback(async () => {
    try {
      const res = await propertyService.getBuilderProperties({ status: "AVAILABLE" });
      if (res?.data?.properties) {
        setProperties(res.data.properties);
      }
    } catch (error) {
      console.error("Failed to load live properties:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProperties();
  };

  return (
    <View style={styles.root}>
      {isLoading ? (
        <HomePageSkeleton />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          <Text style={styles.headerTitle}>Live Listings</Text>
          <Text style={styles.headerSubtitle}>Properties currently available for investors</Text>
          
          <View style={styles.listContainer}>
            {properties.length === 0 ? (
              <Text style={styles.emptyText}>You don't have any live properties.</Text>
            ) : (
              properties.map(prop => (
                <PropertyCard key={prop.id} property={prop} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scrollContent: { padding: 16, paddingBottom: 100 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: Colors.textLight, marginBottom: 20 },
  listContainer: { gap: 16 },
  emptyText: { textAlign: "center", color: Colors.textLight, marginTop: 40 },
});
