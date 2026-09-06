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
      const res = await propertyService.getBuilderProperties({ status: "PENDING_APPROVAL" });
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
      title="Pending Review"
      subtitle="SUBPending Review"
      iconName="time"
      headerColor="#f59e0b"
      emptyMessage="EMPTYPending Review"
      emptySubmessage="You do not have any properties waiting for admin review."
      properties={properties}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
    />
  );
}
