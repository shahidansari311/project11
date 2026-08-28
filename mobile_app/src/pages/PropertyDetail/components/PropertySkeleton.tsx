import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Colors } from "@/constants/colors";
import Skeleton from "@/components/ui/Skeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = 300;

export default function PropertyDetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.root}>
      {/* ── Hero Image Skeleton ── */}
      <View style={styles.heroWrapper}>
        <Skeleton width={SCREEN_WIDTH} height={HERO_HEIGHT} borderRadius={0} />

        {/* Back button skeleton — top-left */}
        <View style={styles.backBtnSkeleton}>
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>

        {/* Like button skeleton — top-right */}
        <View style={styles.likeBtnSkeleton}>
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>

        {/* Status badge skeleton — bottom-left */}
        <View style={styles.statusBadgeSkeleton}>
          <Skeleton width={68} height={22} borderRadius={11} />
        </View>
      </View>

      {/* ── Sliding Card ── */}
      <View style={styles.slidingCard}>
        {/* Card handle */}
        <View style={styles.cardHandle} />

        {/* ── Sticky Title Section ── */}
        <View style={styles.titleSection}>
          {/* Category badge */}
          <Skeleton width={88} height={22} borderRadius={12} style={{ marginBottom: 10 }} />
          {/* Property name */}
          <Skeleton width="80%" height={26} borderRadius={6} style={{ marginBottom: 4 }} />
          <Skeleton width="55%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
          {/* Location row */}
          <View style={styles.locationRow}>
            <Skeleton width={14} height={14} borderRadius={7} />
            <Skeleton width={110} height={13} borderRadius={4} />
          </View>
        </View>

        {/* ── Quick Stats Chips ── */}
        <View style={styles.quickStatsRow}>
          <Skeleton width={118} height={32} borderRadius={20} />
          <Skeleton width={118} height={32} borderRadius={20} />
        </View>

        {/* ── Highlight Grid (2 cards) ── */}
        <View style={styles.highlightGrid}>
          <Skeleton width="47%" height={84} borderRadius={20} />
          <Skeleton width="47%" height={84} borderRadius={20} />
        </View>

        {/* ── Investment Financials Card ── */}
        <View style={styles.financialsCard}>
          {/* Section header */}
          <Skeleton width={170} height={18} borderRadius={4} style={{ marginBottom: 18 }} />

          {/* Spec rows */}
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.specRow, i === 2 && { borderBottomWidth: 0 }]}>
              <Skeleton width={36} height={36} borderRadius={12} />
              <View style={styles.specLabelCol}>
                <Skeleton width="54%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width="36%" height={11} borderRadius={4} />
              </View>
              <Skeleton width={58} height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  // ── Hero ──
  heroWrapper: {
    width: "100%",
    height: HERO_HEIGHT,
    position: "relative",
    backgroundColor: Colors.surfaceContainerHighest,
  },
  backBtnSkeleton: {
    position: "absolute",
    top: 6,
    left: 16,
  },
  likeBtnSkeleton: {
    position: "absolute",
    top: 6,
    right: 16,
  },
  statusBadgeSkeleton: {
    position: "absolute",
    bottom: 34,
    left: 16,
  },
  // ── Card ──
  slidingCard: {
    marginTop: -20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: Colors.surface,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 14,
  },
  // ── Sticky Title ──
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  // ── Stats ──
  quickStatsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  highlightGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  // ── Financials ──
  financialsCard: {
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(225, 227, 228, 0.8)",
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  specLabelCol: {
    flex: 1,
    marginLeft: 12,
  },
});
