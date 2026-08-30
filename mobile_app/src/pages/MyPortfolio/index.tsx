import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

export default function MyPortfolioPage() {
  // Empty data for now, no demo data as requested
  const totalValue = 0;
  const monthlyYield = 0;
  const avgYield = 0;
  const properties: any[] = []; // Empty array for properties

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>My Portfolio</Text>
        
        {/* Portfolio Overview Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>
            ${totalValue.toFixed(2)}
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Monthly Yield</Text>
              <Text style={styles.statValue}>+${monthlyYield.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Avg Yield</Text>
              <Text style={styles.statValue}>{avgYield.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Properties List (Empty State for now) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Investments</Text>
        </View>

        {properties.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business" size={48} color={Colors.outlineVariant} />
            <Text style={styles.emptyTitle}>No investments yet</Text>
            <Text style={styles.emptySubtitle}>
              When you invest in properties, they will appear here.
            </Text>
          </View>
        ) : (
          properties.map((prop, idx) => (
            <View key={idx} style={styles.cardPlaceholder}>
              {/* Ready for mapping actual data later */}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.primary,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: 4,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statBox: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: Colors.surfaceContainer,
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primaryContainer,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  emptyState: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.outlineVariant,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onSurface,
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  cardPlaceholder: {
    // For future use
  }
});
