import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Skeleton from "@/components/ui/Skeleton";

export default function BuilderListSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { paddingTop: 16 }]}
    >
      {/* Header Skeleton (Matches Add Property page) */}
      <View style={styles.headerRow}>
        <View>
          <Skeleton width={200} height={28} borderRadius={6} style={{ marginBottom: 4 }} />
          <Skeleton width={150} height={14} borderRadius={4} />
        </View>
      </View>

      {/* List Cards Skeleton (Matches PropertyCard exactly) */}
      <View style={styles.listContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.cardContainer}>
            {/* Image side */}
            <View style={styles.imageWrapper}>
              <Skeleton width={124} height={124} borderRadius={0} />
            </View>

            {/* Details side */}
            <View style={styles.detailsContainer}>
              <View style={styles.topHeaderRow}>
                <Skeleton width="80%" height={16} borderRadius={4} />
                <Skeleton width={16} height={16} borderRadius={8} />
              </View>

              <Skeleton width="60%" height={12} borderRadius={4} style={{ marginTop: -2 }} />
              <Skeleton width="30%" height={10} borderRadius={2} style={{ marginTop: -2 }} />

              <View style={styles.metricsRow}>
                <Skeleton width={40} height={18} borderRadius={8} />
                <View style={{ alignItems: "flex-end" }}>
                  <Skeleton width={25} height={8} borderRadius={2} style={{ marginBottom: 4 }} />
                  <Skeleton width={50} height={14} borderRadius={4} />
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F3F4F6", // Matches builder-add
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  listContainer: {
    gap: 16,
  },
  cardContainer: {
    flexDirection: "row",
    height: 124,
    backgroundColor: "#FFFFFF",
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
    height: 124,
  },
  detailsContainer: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  topHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#E1E3E4",
  },
});
