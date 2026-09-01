import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Property } from "../../BrowseProperties/data";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

interface PropertyHighlightsProps {
  property: Property;
}

export default function PropertyHighlights({ property }: PropertyHighlightsProps) {
  return (
    <>
      {/* Quick Info Pills Row */}
      <View style={styles.quickStatsRow}>
        <View style={styles.quickStatChip}>
          <Ionicons name="people-outline" size={14} color={Colors.primary} />
          <Text style={styles.quickStatText}>{property.investors} Investors</Text>
        </View>

        <View style={styles.quickStatChip}>
          <Ionicons name="cube-outline" size={14} color={Colors.primary} />
          <Text style={styles.quickStatText}>{property.totalSize}</Text>
        </View>
      </View>

      {/* ── High-Contrast Highlight Grid ── */}
      <View style={styles.highlightGrid}>
        <View style={styles.primaryHighlightCard}>
          <Text style={styles.highlightCardLabel}>TARGET IRR</Text>
          <Text style={styles.primaryHighlightValue}>{property.targetReturn}%</Text>
          <Text style={styles.highlightSubtext}>Annualized return</Text>
        </View>

        <View style={styles.secondaryHighlightCard}>
          <Text style={styles.highlightCardLabelDark}>MIN INVESTMENT</Text>
          <Text style={styles.secondaryHighlightValue}>
            {formatCurrency(property.minInvestment)}
          </Text>
          <Text style={styles.highlightSubtextDark}>Starting entry</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Quick Info Chips ──
  quickStatsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  quickStatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  quickStatText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurface,
  },

  // ── High Contrast Highlight Grid ──
  highlightGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 18,
  },
  primaryHighlightCard: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  secondaryHighlightCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(225, 227, 228, 0.8)",
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  highlightCardLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.75)",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  highlightCardLabelDark: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.outline,
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  primaryHighlightValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.onPrimary,
    letterSpacing: -0.4,
  },
  secondaryHighlightValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.onSurface,
    letterSpacing: -0.4,
  },
  highlightSubtext: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
    fontWeight: "500",
  },
  highlightSubtextDark: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    fontWeight: "500",
  },
});
