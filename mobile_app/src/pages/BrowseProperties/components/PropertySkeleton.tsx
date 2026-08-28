import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import Skeleton from "@/components/ui/Skeleton";

export default function PropertySkeleton() {
  return (
    <View style={styles.cardContainer}>
      {/* ── Left: Image Block ── */}
      <View style={styles.imageWrapper}>
        <Skeleton width={124} height={124} borderRadius={0} />

        {/* Status badge overlay (top-left pill) */}
        <View style={styles.statusBadge}>
          <Skeleton width={54} height={15} borderRadius={8} />
        </View>

        {/* Image count badge (bottom-left) */}
        <View style={styles.imageCountBadge}>
          <Skeleton width={30} height={13} borderRadius={5} />
        </View>
      </View>

      {/* ── Right: Details Block ── */}
      <View style={styles.detailsContainer}>
        {/* Title + Favorite icon row */}
        <View style={styles.topHeaderRow}>
          <Skeleton width="70%" height={14} borderRadius={4} />
          <Skeleton width={20} height={20} borderRadius={10} />
        </View>

        {/* Location row */}
        <View style={styles.locationRow}>
          <Skeleton width={12} height={12} borderRadius={6} />
          <Skeleton width="48%" height={11} borderRadius={4} />
        </View>

        {/* Category tag */}
        <Skeleton width={62} height={10} borderRadius={4} style={{ marginTop: 2 }} />

        {/* Metrics row: IRR badge + MIN INVEST column */}
        <View style={styles.metricsRow}>
          <Skeleton width={54} height={24} borderRadius={8} />
          <View style={styles.minInvestCol}>
            <Skeleton width={28} height={8} borderRadius={3} style={{ marginBottom: 5 }} />
            <Skeleton width={66} height={14} borderRadius={4} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    height: 124,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(225, 227, 228, 0.6)",
  },
  imageWrapper: {
    width: 124,
    height: "100%",
    position: "relative",
  },
  statusBadge: {
    position: "absolute",
    top: 6,
    left: 6,
  },
  imageCountBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
  },
  detailsContainer: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  topHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginTop: 4,
  },
  minInvestCol: {
    alignItems: "flex-end",
  },
});
