import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import PropertyDetailPage from '@/pages/PropertyDetail';

export default function PropertyRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) return null;

  return <PropertyDetailPage id={id} />;
}
