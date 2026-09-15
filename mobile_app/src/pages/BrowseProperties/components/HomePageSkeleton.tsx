import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Colors } from "@/constants/colors";
import Skeleton from "@/components/ui/Skeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.65);

export default function HomePageSkeleton() {
  return (
    <ScrollView
      style={styles.root}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 110 }}
    >
      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width={200} height={28} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width={180} height={14} borderRadius={4} />
      </View>

      {/* Popular Places */}
      <View style={styles.popularContainer}>
        <View style={styles.sectionHeaderRow}>
          <Skeleton width={130} height={22} borderRadius={4} />
          <Skeleton width={50} height={14} borderRadius={4} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={styles.popularScrollContent}
        >
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.horizontalCard, { width: CARD_WIDTH }]}>
              <Skeleton width="100%" height={160} borderRadius={0} />
              <View style={styles.horizontalCardBody}>
                <Skeleton width="80%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="60%" height={12} borderRadius={4} style={{ marginBottom: 12 }} />
                <View style={styles.horizontalCardFooter}>
                  <Skeleton width={70} height={20} borderRadius={4} />
                  <Skeleton width={60} height={16} borderRadius={4} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Company Trust Block */}
      <View style={styles.companyContainer}>
        <Skeleton width={200} height={20} borderRadius={4} style={{ marginBottom: 20, alignSelf: "center" }} />
        <View style={styles.featuresRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.featureItem}>
              <Skeleton width={48} height={48} borderRadius={24} style={{ marginBottom: 12 }} />
              <Skeleton width={70} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width={60} height={12} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Review block */}
      <View style={styles.reviewContainer}>
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map(i => (
            <Skeleton key={i} width={18} height={18} borderRadius={9} style={{ marginHorizontal: 2 }} />
          ))}
        </View>
        <Skeleton width="90%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="70%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
        <Skeleton width={140} height={12} borderRadius={4} />
      </View>

      {/* Explore All Button */}
      <Skeleton width="100%" height={52} borderRadius={16} style={styles.exploreBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  greetingContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  popularContainer: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  popularScrollContent: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 24,
  },
  horizontalCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  horizontalCardBody: {
    padding: 14,
  },
  horizontalCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  companyContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  featureItem: {
    flex: 1,
    alignItems: "center",
  },
  reviewContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: "center",
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  exploreBtn: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
});
