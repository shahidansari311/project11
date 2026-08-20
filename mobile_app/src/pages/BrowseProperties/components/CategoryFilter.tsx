/**
 * CategoryFilter — Horizontal scrollable filter chip row
 * ───────────────────────────────────────────────────────
 * Renders pill-shaped buttons for each category with subtle soft fills.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Colors } from "@/constants/colors";
import { CATEGORIES, CategoryFilter as CategoryFilterType } from "../data";

interface CategoryFilterProps {
  active: CategoryFilterType;
  onChange: (category: CategoryFilterType) => void;
}

export default function CategoryFilter({
  active,
  onChange,
}: CategoryFilterProps) {
  const formatCategory = (cat: string) => {
    return cat.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat === active;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
              onPress={() => onChange(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipLabel,
                  isActive ? styles.chipLabelActive : styles.chipLabelInactive,
                ]}
              >
                {formatCategory(cat)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  chipInactive: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderColor: Colors.outlineVariant,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  chipLabelActive: {
    color: Colors.onPrimary,
  },
  chipLabelInactive: {
    color: Colors.onSurfaceVariant,
  },
});
