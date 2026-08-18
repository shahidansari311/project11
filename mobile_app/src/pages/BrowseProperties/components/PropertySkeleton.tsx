import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import Skeleton from "@/components/ui/Skeleton";

export default function PropertySkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={192} width="100%" borderRadius={0} />
      <View style={styles.content}>
        <Skeleton width="60%" height={24} borderRadius={4} />
        <Skeleton width="40%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <Skeleton width="30%" height={40} borderRadius={4} />
          <Skeleton width="40%" height={40} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  content: {
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
