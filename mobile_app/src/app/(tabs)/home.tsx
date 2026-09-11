import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import DashboardHeader from "@/pages/BrowseProperties/components/DashboardHeader";
import HomePageSkeleton from "@/pages/BrowseProperties/components/HomePageSkeleton";
import { propertyService } from "@/services/property.service";
import { Property } from "@/pages/BrowseProperties/data";
import { Colors } from "@/constants/colors";
import LoginPromptModal from "@/components/LoginPromptModal";

export default function HomeTab() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProperties = async () => {
      try {
        const res = await propertyService.getProperties({ limit: 7 });
        if (mounted && res?.data?.properties) {
          setProperties(res.data.properties);
        }
      } catch (error) {
        console.error("Failed to load featured properties:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadProperties();
    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await propertyService.getProperties({ limit: 7 });
      if (res?.data?.properties) {
        setProperties(res.data.properties);
      }
    } catch (error) {
      console.error("Failed to refresh featured properties:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.root}>
      {isLoading ? (
        <HomePageSkeleton />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          <DashboardHeader 
            properties={properties} 
            onRequireLogin={() => setShowLoginPrompt(true)} 
            isRefreshing={isRefreshing}
          />
        </ScrollView>
      )}

      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingBottom: 55,
  },
});
