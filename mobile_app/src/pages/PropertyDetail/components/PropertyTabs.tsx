import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Colors } from '@/constants/colors';

export type TabKey = 'overview' | 'financials' | 'trends' | 'documents';

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'financials', label: 'Financials' },
  { key: 'trends', label: 'Market Trends' },
  // { key: 'documents', label: 'Documents' },
];

interface PropertyTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function PropertyTabs({ activeTab, onTabChange }: PropertyTabsProps) {
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});
  
  // Animation values for the background pill
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const layout = tabLayouts[activeTab];
    if (layout) {
      Animated.spring(indicatorX, {
        toValue: layout.x,
        useNativeDriver: false, // width/left interpolation requires JS driver
        friction: 8,
        tension: 50,
      }).start();
      
      Animated.spring(indicatorWidth, {
        toValue: layout.width,
        useNativeDriver: false,
        friction: 8,
        tension: 50,
      }).start();
    }
  }, [activeTab, tabLayouts, indicatorX, indicatorWidth]);

  const handleTabPress = (key: TabKey) => {
    if (key !== activeTab) {
      // Optional fallback: React Native Vibration
      // Vibration.vibrate(10);
      onTabChange(key);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* The Animated Sliding Pill */}
        <Animated.View
          style={[
            styles.animatedPill,
            {
              left: indicatorX,
              width: indicatorWidth,
            },
          ]}
        />

        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleTabPress(tab.key)}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                setTabLayouts((prev) => ({ ...prev, [tab.key]: { x, width } }));
              }}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
  },
  animatedPill: {
    position: 'absolute',
    height: 36, // Match tabButton vertical padding + text height roughly
    top: 12, // Match scrollContent paddingVertical
    backgroundColor: Colors.primary,
    borderRadius: 20,
    zIndex: 0,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8, // Instead of gap to ensure absolute positioning calculates right
    zIndex: 1, // Keep text above the absolute pill
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  activeTabText: {
    color: Colors.onPrimary,
  },
});
