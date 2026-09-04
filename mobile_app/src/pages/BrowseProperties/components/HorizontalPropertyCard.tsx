import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Property, PLACEHOLDER_IMAGE } from "../data";
import { Colors } from "@/constants/colors";
import FavoriteButton from "@/components/ui/FavoriteButton";

interface HorizontalPropertyCardProps {
  property: Property;
  isGuest?: boolean;
  onRequireLogin?: () => void;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.65; // ~65% of screen width

export default function HorizontalPropertyCard({ 
  property, 
  isGuest, 
  onRequireLogin 
}: HorizontalPropertyCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/property/${property.id}`);
  };

  const imageUri = property.images?.[0] || PLACEHOLDER_IMAGE;
  
  // Format price helper
  const formatPrice = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9} 
      onPress={handlePress}
    >
      {/* ── Image Section ── */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image} 
          contentFit="cover" 
          transition={200}
        />
        
        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>
            {formatPrice(property.perUnitPrice)}<Text style={styles.priceUnit}>/unit</Text>
          </Text>
        </View>

        {/* Favorite Button */}
        <FavoriteButton 
          propertyId={property.id}
          size={18}
          isGuest={isGuest}
          onRequireLogin={onRequireLogin}
          style={styles.bookmarkBtn}
        />
      </View>

      {/* ── Details Section ── */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>

        {/* Pricing & Returns instead of Stars */}
        <View style={styles.metricsRow}>
          <View style={styles.irrBadge}>
            <Text style={styles.irrValue}>{property.targetReturn}% <Text style={styles.irrLabel}>IRR</Text></Text>
          </View>
          <Text style={styles.minInvestValue}>From {formatPrice(property.minInvestment)}</Text>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={Colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.location}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 20,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(225, 227, 228, 0.5)",
  },
  imageContainer: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "relative",
    overflow: "visible", // So bookmark can overlap if we want, though we'll keep it inside bounds for cleaner clipping
  },
  image: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  priceBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000",
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.outline,
  },
  bookmarkBtn: {
    position: "absolute",
    bottom: -18,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff", // White to let the heart color pop
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10,
    padding: 0, // Reset FavoriteButton's default padding to fit circle exactly
  },
  detailsContainer: {
    padding: 16,
    paddingTop: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 6,
    paddingRight: 30, // Leave room for the floating button
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  irrBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  irrValue: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  irrLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.outline,
  },
  minInvestValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.onSurfaceVariant,
    marginLeft: 4,
    flex: 1,
  },
});
