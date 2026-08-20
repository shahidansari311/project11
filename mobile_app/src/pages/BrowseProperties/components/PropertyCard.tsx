/**
 * PropertyCard — Compact Horizontal Layout with Swipeable Images
 * ──────────────────────────────────────────────────────────────────
 * Image carousel on left (swipeable), details on right.
 * 100% preserved logic, zero breaking changes.
 */

import React, { memo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Colors } from "@/constants/colors";
import { Property, PLACEHOLDER_IMAGE } from "../data";
import FavoriteButton from "@/components/ui/FavoriteButton";

interface PropertyCardProps {
  property: Property;
  isGuest?: boolean;
  onRequireLogin?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE": return "#10b981";
    case "COMING_SOON": return "#3b82f6";
    case "UNDER_REVIEW": return "#f59e0b";
    case "SOLD": return "#ef4444";
    default: return "#9ca3af";
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const IMAGE_WIDTH = 124;

export default memo(function PropertyCard({
  property,
  isGuest = false,
  onRequireLogin,
}: PropertyCardProps) {
  const router = useRouter();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const imagesList = property.images && property.images.length > 0
    ? property.images
    : [PLACEHOLDER_IMAGE];

  const handleScroll = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / IMAGE_WIDTH);
    if (index !== activeImageIndex && index >= 0 && index < imagesList.length) {
      setActiveImageIndex(index);
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* ── Left Side Image (Swipeable Carousel) ── */}
      <View style={styles.imageWrapper}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {imagesList.map((imgUrl, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.9}
              onPress={() => router.push(`/property/${property.id}`)}
            >
              <Image
                source={{ uri: imgUrl }}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status Badge */}
        <View style={styles.statusBadge} pointerEvents="none">
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(property.status) }]} />
          <Text style={styles.statusLabel}>{property.status.replace("_", " ")}</Text>
        </View>

        {/* Image Index Counter Badge */}
        {imagesList.length > 1 && (
          <View style={styles.imageCountBadge} pointerEvents="none">
            <Ionicons name="images-outline" size={10} color="#ffffff" />
            <Text style={styles.imageCountText}>
              {activeImageIndex + 1}/{imagesList.length}
            </Text>
          </View>
        )}
      </View>

      {/* ── Right Side Details ── */}
      <TouchableOpacity
        style={styles.detailsContainer}
        activeOpacity={0.88}
        onPress={() => router.push(`/property/${property.id}`)}
      >
        {/* Header: Title + Favorite */}
        <View style={styles.topHeaderRow}>
          <Text style={styles.titleText} numberOfLines={1}>
            {property.title}
          </Text>
          <FavoriteButton
            propertyId={property.id}
            size={16}
            style={styles.favoriteBtn}
            isGuest={isGuest}
            onRequireLogin={onRequireLogin}
          />
        </View>

        {/* Location Row */}
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={12} color={Colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.location}
          </Text>
        </View>

        {/* Category Chip */}
        <View style={styles.categoryRow}>
          <Text style={styles.categoryTag}>{property.category}</Text>
        </View>

        {/* Footer Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.irrBadge}>
            <Text style={styles.irrLabel}>IRR </Text>
            <Text style={styles.irrValue}>{property.targetReturn}%</Text>
          </View>

          <View style={styles.minInvestCol}>
            <Text style={styles.minInvestLabel}>FROM</Text>
            <Text style={styles.minInvestValue}>{formatCurrency(property.minInvestment)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    height: 124,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: "hidden",

    // Soft Elevation Shadow
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,

    borderWidth: 1,
    borderColor: "rgba(225, 227, 228, 0.6)",
  },

  // ── Image Section (Left) ──
  imageWrapper: {
    width: IMAGE_WIDTH,
    height: "100%",
    position: "relative",
  },
  image: {
    width: IMAGE_WIDTH,
    height: 124,
  },
  statusBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 99,
    gap: 4,
    zIndex: 10,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  imageCountBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    zIndex: 10,
  },
  imageCountText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ffffff",
  },

  // ── Details Section (Right) ──
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
  titleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  favoriteBtn: {
    padding: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: -2,
  },
  locationText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  categoryRow: {
    marginTop: -2,
  },
  categoryTag: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  irrBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  irrLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.onPrimaryContainer,
  },
  irrValue: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.onPrimaryContainer,
  },
  minInvestCol: {
    alignItems: "flex-end",
  },
  minInvestLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  minInvestValue: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.onSurface,
  },
});
