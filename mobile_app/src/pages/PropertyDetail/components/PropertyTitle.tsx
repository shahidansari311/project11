import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Property } from "../../BrowseProperties/data";

interface PropertyTitleProps {
  property: Property;
}

export default function PropertyTitle({ property }: PropertyTitleProps) {
  return (
    <View style={styles.titleSection}>
      <View style={styles.categoryBadge}>
        <Ionicons name="sparkles" size={12} color={Colors.primary} />
        <Text style={styles.categoryBadgeText}>{property.category}</Text>
      </View>

      <Text style={styles.titleText}>{property.title}</Text>

      <View style={styles.locationRow}>
        <Ionicons name="location-sharp" size={16} color={Colors.primary} />
        <Text style={styles.locationText}>{property.location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.onPrimaryContainer,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  titleText: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.onSurfaceVariant,
  },
});
