import { useState, useCallback } from "react";
import { BackHandler } from "react-native";
import { GlobalAlert } from "@/components/GlobalAlertModal";
import { propertyService } from "@/services/property.service";
import { Property } from "@/pages/BrowseProperties/data";
import { useFocusEffect, useRouter } from "expo-router";
import BuilderPropertyListLayout from "@/components/layout/BuilderPropertyListLayout";

export default function BuilderTab() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProperties = useCallback(async () => {
    try {
      const res = await propertyService.getBuilderProperties({ status: "DRAFT" });
      if (res?.data?.properties) {
        setProperties(res.data.properties);
      }
    } catch (error) {
      console.error("Failed to load properties:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProperties();
      const onBackPress = () => {
        router.navigate("/(tabs)/builder-live" as any);
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [loadProperties, router])
  );


  const onRefresh = () => {
    setIsRefreshing(true);
    loadProperties();
  };

  const handleDeleteDraft = (id: string) => {
    GlobalAlert.alert(
      "Delete Draft",
      "Are you sure you want to delete this draft permanently?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            // Optimistic update for instant feedback
            setProperties(prev => prev.filter(p => p.id !== id));
            try {
              await propertyService.deleteBuilderProperty(id);
              // Fetch from backend once delete completes to ensure consistency
              await loadProperties();
            } catch (error) {
              // Revert if failed
              loadProperties();
              GlobalAlert.alert("Error", "Failed to delete draft.");
            }
          }
        }
      ]
    );
  };

  return (
    <BuilderPropertyListLayout
      title="Drafts"
      subtitle="Saved but unpublished listings. Complete and submit them for review."
      iconName="document-text"
      headerColor="#6366f1"
      emptyMessage="No Drafts Yet"
      emptySubmessage="You do not have any unpublished property drafts."
      properties={properties}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      onDeleteDraft={handleDeleteDraft}
    />
  );
}
