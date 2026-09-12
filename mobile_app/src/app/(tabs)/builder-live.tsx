import { useState, useCallback } from "react";
import { BackHandler } from "react-native";
import { propertyService } from "@/services/property.service";
import { Property } from "@/pages/BrowseProperties/data";
import { useFocusEffect, useRouter } from "expo-router";
import BuilderPropertyListLayout from "@/components/layout/BuilderPropertyListLayout";
import { Colors } from "@/constants/colors";

export default function BuilderLiveTab() {
  const router = useRouter();
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
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [loadProperties])
  );


  const onRefresh = () => {
    setIsRefreshing(true);
    loadProperties();
  };

  return (
    <BuilderPropertyListLayout
      title="Live Listings"
      subtitle="Properties currently available for investors to view and fund."
      iconName="home"
      headerColor={Colors.primary}
      emptyMessage="No Live Properties"
      emptySubmessage="You don't have any properties currently visible to the public."
      properties={properties}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
    />
  );
}
