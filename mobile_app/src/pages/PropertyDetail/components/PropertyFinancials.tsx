import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Property } from "../../BrowseProperties/data";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

interface PropertyFinancialsProps {
  property: Property;
}

export default function PropertyFinancials({ property }: PropertyFinancialsProps) {
  return (
    <>
      {/* ── Detailed Financial Specifications Card ── */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionHeaderTitle}>Investment Financials</Text>

        <View style={styles.specRow}>
          <View style={styles.specIconBox}>
            <Ionicons name="cash" size={18} color="#ffffff" />
          </View>
          <View style={styles.specLabelCol}>
            <Text style={styles.specTitle}>Total Asset Value</Text>
            <Text style={styles.specSub}>Property valuation</Text>
          </View>
          <Text style={styles.specValueBold}>
            {formatCurrency(property.totalPrice)}
          </Text>
        </View>

        <View style={styles.specRow}>
          <View style={styles.specIconBox}>
            <Ionicons name="wallet-outline" size={18} color="#ffffff" />
          </View>
          <View style={styles.specLabelCol}>
            <Text style={styles.specTitle}>Minimum Entry</Text>
            <Text style={styles.specSub}>Fractional minimum</Text>
          </View>
          <Text style={styles.specValueBold}>
            {formatCurrency(property.minInvestment)}
          </Text>
        </View>

        <View style={styles.specRow}>
          <View style={styles.specIconBox}>
            <Ionicons name="expand-outline" size={18} color="#ffffff" />
          </View>
          <View style={styles.specLabelCol}>
            <Text style={styles.specTitle}>Asset Size</Text>
            <Text style={styles.specSub}>Total area square feet</Text>
          </View>
          <Text style={styles.specValueBold}>{property.totalSize}</Text>
        </View>

        <View style={styles.specRowNoBorder}>
          <View style={styles.specIconBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#ffffff"
            />
          </View>
          <View style={styles.specLabelCol}>
            <Text style={styles.specTitle}>Asset Category</Text>
            <Text style={styles.specSub}>Property classification</Text>
          </View>
          <Text style={styles.specValueBold}>{property.category}</Text>
        </View>
      </View>

      {/* ── Overview & Strategy ── */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionHeaderTitle}>Property Overview</Text>
        <Text style={styles.descriptionBody}>{property.description}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Specifications & Financials Card ──
  detailsCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(225, 227, 228, 0.8)",
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.onSurface,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  specRowNoBorder: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  specIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  specLabelCol: {
    flex: 1,
  },
  specTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  specSub: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  specValueBold: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.onSurface,
  },

  descriptionBody: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 23,
    fontWeight: "400",
  },
});
