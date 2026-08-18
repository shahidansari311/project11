/**
 * CategoryFilter — Horizontal scrollable filter chip row
 * ───────────────────────────────────────────────────────
 * Renders pill-shaped buttons for each category.
 * The active chip uses primary-container fill; inactive chips
 * use a transparent/white fill with an outline border.
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
              activeOpacity={0.75}
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
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  chipInactive: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderColor: Colors.outlineVariant,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  chipLabelActive: {
    color: Colors.onPrimaryContainer,
  },
  chipLabelInactive: {
    color: Colors.primary,
  },
});
