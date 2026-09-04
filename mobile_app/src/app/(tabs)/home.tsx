import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import DashboardHeader from "@/pages/BrowseProperties/components/DashboardHeader";
import { propertyService } from "@/services/property.service";
import { Property } from "@/pages/BrowseProperties/data";
import { Colors } from "@/constants/colors";
import LoginPromptModal from "@/components/LoginPromptModal";

export default function HomeTab() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProperties = async () => {
      try {
        const res = await propertyService.getProperties({ limit: 15 });
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

  return (
    <View style={styles.root}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DashboardHeader 
            properties={properties} 
            onRequireLogin={() => setShowLoginPrompt(true)} 
          />
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 110, // Leave space for bottom tab bar
  },
});
