import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import PortfolioDetailPage from '@/pages/PortfolioDetail';

export default function PortfolioRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) return null;

  return <PortfolioDetailPage id={id} />;
}
