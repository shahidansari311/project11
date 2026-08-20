import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

import ImageCarousel from "@/components/ui/ImageCarousel";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { Property } from "../../BrowseProperties/data";

const HERO_HEIGHT = 300;

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "#10b981";
    case "COMING_SOON":
      return "#3b82f6";
    case "UNDER_REVIEW":
      return "#f59e0b";
    case "SOLD":
      return "#ef4444";
    default:
      return "#9ca3af";
  }
};

interface PropertyHeroBannerProps {
  property: Property;
  images: string[];
  insetsTop: number;
  screenWidth: number;
  isGuest: boolean;
  onBack: () => void;
  onRequireLogin: () => void;
  onImagePress: (index: number) => void;
}

export default function PropertyHeroBanner({
  property,
  images,
  insetsTop,
  screenWidth,
  isGuest,
  onBack,
  onRequireLogin,
  onImagePress,
}: PropertyHeroBannerProps) {
  const topInset = Math.max(insetsTop, 36);

  return (
    <View style={styles.heroGalleryContainer}>
      <ImageCarousel
        images={images}
        width={screenWidth}
        height={HERO_HEIGHT}
        showThumbnails={false}
        showArrowControls={true}
        sharedTransitionTagBase={`property-image-${property.id}`}
        onPress={onImagePress}
      />

      {/* Floating Glass Back Button (Top Left - Camera Notch Cleared) */}
      <TouchableOpacity
        style={[styles.glassNavBtn, { top: topInset + 6, left: 16 }]}
        onPress={onBack}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={20} color={Colors.onSurface} />
      </TouchableOpacity>

      {/* Floating Glass Favorite Button (Top Right - Camera Notch Cleared) */}
      <View style={[styles.glassNavBtn, { top: topInset + 6, right: 16 }]}>
        <FavoriteButton
          propertyId={property.id}
          size={20}
          isGuest={isGuest}
          onRequireLogin={onRequireLogin}
        />
      </View>

      {/* Glass Status Badge (Bottom Left) */}
      <View style={styles.heroStatusBadge}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(property.status) },
          ]}
        />
        <Text style={styles.statusLabel}>
          {property.status.replace("_", " ")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroGalleryContainer: {
    width: "100%",
    height: HERO_HEIGHT,
    position: "relative",
    backgroundColor: "#0d1b1e",
  },
  glassNavBtn: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  heroStatusBadge: {
    position: "absolute",
    bottom: 34,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    gap: 6,
    zIndex: 15,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#ffffff",
    textTransform: "uppercase",
  },
});
