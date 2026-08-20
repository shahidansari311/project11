import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

import ImageCarousel from "@/components/ui/ImageCarousel";
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
  onImagePress: (index: number) => void;
}

export default function PropertyHeroBanner({
  property,
  images,
  insetsTop,
  screenWidth,
  onImagePress,
}: PropertyHeroBannerProps) {
  const topInset = insetsTop;

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
