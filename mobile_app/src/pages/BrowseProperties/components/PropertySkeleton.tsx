import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import Skeleton from "@/components/ui/Skeleton";

export default function PropertySkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={200} width="100%" borderRadius={20} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Skeleton width="65%" height={22} borderRadius={6} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
        <Skeleton width="45%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <Skeleton width="35%" height={36} borderRadius={8} />
          <Skeleton width="45%" height={36} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 18,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(225, 227, 228, 0.5)",
  },
  content: {
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
