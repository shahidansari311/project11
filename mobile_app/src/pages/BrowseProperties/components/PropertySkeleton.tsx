import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import Skeleton from "@/components/ui/Skeleton";

export default function PropertySkeleton() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.imageWrapper}>
        <Skeleton width={124} height={124} borderRadius={0} />
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.topHeaderRow}>
          <Skeleton width="75%" height={16} borderRadius={4} />
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>

        <Skeleton width="50%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width={60} height={14} borderRadius={4} style={{ marginTop: 8 }} />

        <View style={styles.metricsRow}>
          <Skeleton width={50} height={20} borderRadius={6} />
          <Skeleton width={70} height={24} borderRadius={6} />
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
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginTop: 8,
  },
});
