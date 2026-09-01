import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
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

interface PropertyActionBarProps {
  property: Property;
  insetsBottom: number;
  onInvestPress: () => void;
}

export default function PropertyActionBar({
  property,
  insetsBottom,
  onInvestPress,
}: PropertyActionBarProps) {
  return (
    <View
      style={[
        styles.floatingActionFooter,
        { bottom: Math.max(insetsBottom + 10, 16) },
      ]}
    >
      <View style={styles.footerPriceBlock}>
        <Text style={styles.footerPriceHeader}>MIN. ENTRY</Text>
        <Text style={styles.footerPriceAmount}>
          {formatCurrency(property.minInvestment)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.actionInvestBtn}
        activeOpacity={0.88}
        onPress={onInvestPress}
      >
        <Text style={styles.actionInvestText}>Invest Now</Text>
        <View style={styles.actionInvestIconCircle}>
          <Ionicons name="arrow-forward" size={14} color="#ffffff" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Floating Luxury Action Bar ──
  floatingActionFooter: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  footerPriceBlock: {
    flex: 1,
  },
  footerPriceHeader: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.75)",
    letterSpacing: 0.6,
  },
  footerPriceAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.onPrimary,
    letterSpacing: -0.3,
  },
  actionInvestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.onPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionInvestText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primary,
  },
  actionInvestIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
