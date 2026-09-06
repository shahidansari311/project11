import { useState, useCallback } from "react";
import { propertyService } from "@/services/property.service";
import { Property } from "@/pages/BrowseProperties/data";
import { useFocusEffect } from "expo-router";
import BuilderPropertyListLayout from "@/components/layout/BuilderPropertyListLayout";

export default function BuilderTab() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProperties = useCallback(async () => {
    try {
      const res = await propertyService.getBuilderProperties({ status: "REJECTED" });
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
    }, [loadProperties])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProperties();
  };

  return (
    <BuilderPropertyListLayout
      title="Rejected"
      subtitle="SUBRejected"
      iconName="close-circle"
      headerColor="#ef4444"
      emptyMessage="EMPTYRejected"
      emptySubmessage="None of your properties have been rejected by the admin."
      properties={properties}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
    />
  );
}
