/**
 * PropertyCard — Single investment property listing card
 * ────────────────────────────────────────────────────────
 * Layout (top → bottom):
 *  ┌──────────────────────────────────┐
 *  │  [Hero Image]                    │
 *  │  [Status Badge]   [❤ Favourite]  │  ← overlaid on image
 *  │  [Title]                         │  ← overlaid on image (bottom)
 *  │  [📍 Location]                   │
 *  ├──────────────────────────────────┤
 *  │  Target IRR        Min Investment│
 *  │  14.5%             $25,000       │
 *  ├──────────────────────────────────┤
 *  │  👥 124 Investors  📐 $450/sqft  │
 *  └──────────────────────────────────┘
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { Property, PLACEHOLDER_IMAGE } from "../data";

interface PropertyCardProps {
  property: Property;
  isGuest?: boolean;
  onRequireLogin?: () => void;
}

const CARD_WIDTH = Dimensions.get("window").width - 32; // 16px gutter each side

const getStatusColor = (status: string) => {
  switch(status) {
    case 'AVAILABLE': return '#10b981'; // Green
    case 'COMING_SOON': return '#3b82f6'; // Blue
    case 'UNDER_REVIEW': return '#f59e0b'; // Orange
    case 'SOLD': return '#ef4444'; // Red
    default: return '#9ca3af'; // Gray
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

export default function PropertyCard({ property, isGuest = false, onRequireLogin }: PropertyCardProps) {
  const router = useRouter();
  const [isFavourite, setIsFavourite] = useState(false);
  
  const imageUrl = property.images && property.images.length > 0 ? property.images[0] : PLACEHOLDER_IMAGE;

  const handleFavouritePress = () => {
    if (isGuest && onRequireLogin) {
      onRequireLogin();
      return;
    }
    setIsFavourite((prev) => !prev);
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9} 
      onPress={() => router.push(`/property/${property.id}`)}
    >
      {/* ── Hero Image Section ── */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
        />

        {/* Status Badge — top left */}
        <View style={styles.statusBadge}>
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor(property.status) }]}
          />
          <Text style={styles.statusLabel}>{property.status.replace("_", " ")}</Text>
        </View>

        {/* Favourite Button — top right */}
        <TouchableOpacity
          style={styles.favouriteButton}
          onPress={handleFavouritePress}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isFavourite ? "heart" : "heart-outline"}
            size={20}
            color={isFavourite ? "#ef4444" : "#ffffff"}
          />
        </TouchableOpacity>

        {/* Title + Location — bottom left overlay */}
        <View style={styles.titleOverlay}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {property.title}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.9)" />
            <Text style={styles.locationText} numberOfLines={1}>
              {property.location}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Stats Section ── */}
      <View style={styles.statsContainer}>
        {/* IRR + Min Investment */}
        <View style={styles.statsTopRow}>
          <View>
            <Text style={styles.statLabel}>Target IRR</Text>
            <Text style={styles.statValuePrimary}>{property.targetReturn}%</Text>
          </View>
          <View style={styles.statRight}>
            <Text style={styles.statLabel}>Min Investment</Text>
            <Text style={styles.statValueDark}>{formatCurrency(property.minInvestment)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Investors + Size */}
        <View style={styles.statsBottomRow}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={16} color={Colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{property.investors} Investors</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="resize-outline" size={16} color={Colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{property.totalSize}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: "hidden",
    // Card shadow
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },

  // ── Image ──
  imageContainer: {
    height: 192,
    width: "100%",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },

  // ── Status Badge ──
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    gap: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: Colors.onSurface,
  },

  // ── Favourite Button ──
  favouriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 99,
  },

  // ── Title + Location Overlay ──
  titleOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)", // Solid dark strip
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },

  // ── Stats ──
  statsContainer: {
    padding: 16,
  },
  statsTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
  },
  statRight: {
    alignItems: "flex-end",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.onSurfaceVariant,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  statValuePrimary: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: -0.4,
  },
  statValueDark: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.onSurface,
    letterSpacing: -0.4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginBottom: 14,
  },
  statsBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.onSurface,
  },
});
