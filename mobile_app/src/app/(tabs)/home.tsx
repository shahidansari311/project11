import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, BackHandler } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import DashboardHeader from "@/pages/BrowseProperties/components/DashboardHeader";
import HomePageSkeleton from "@/pages/BrowseProperties/components/HomePageSkeleton";
import { propertyService } from "@/services/property.service";
import { settingService } from "@/services/setting.service";
import { Property } from "@/pages/BrowseProperties/data";
import { Colors } from "@/constants/colors";
import LoginPromptModal from "@/components/LoginPromptModal";

export default function HomeTab() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [propsRes, tutRes] = await Promise.all([
          propertyService.getProperties({ limit: 7 }),
          settingService.getTutorialVideo()
        ]);
        if (mounted) {
          if (propsRes?.data?.properties) setProperties(propsRes.data.properties);
          if (tutRes?.data?.url) setTutorialVideoUrl(tutRes.data.url);
        }
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [propsRes, tutRes] = await Promise.all([
        propertyService.getProperties({ limit: 7 }),
        settingService.getTutorialVideo()
      ]);
      if (propsRes?.data?.properties) setProperties(propsRes.data.properties);
      if (tutRes?.data?.url) setTutorialVideoUrl(tutRes.data.url);
    } catch (error) {
      console.error("Failed to refresh home data:", error);
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
            tutorialVideoUrl={tutorialVideoUrl}
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
