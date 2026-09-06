import { View, Text, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { Property } from "../../BrowseProperties/data";
import { formatLocationText, parseLocation } from "@/utils/formatLocation";

interface PropertyTitleProps {
  property: Property;
  userUnitsOwned?: number;
}

export default function PropertyTitle({ property, userUnitsOwned = 0 }: PropertyTitleProps) {
  const router = useRouter();
  const locationText = formatLocationText(property.location);

  const parsedLoc = parseLocation(property.location);
  const hasCoordinates = parsedLoc && parsedLoc.latitude && parsedLoc.longitude;

  const handleOpenMap = () => {
    if (hasCoordinates) {
      const lat = parsedLoc.latitude;
      const lng = parsedLoc.longitude;
      Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
    }
  };

  return (
    <View style={styles.titleSection}>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryBadgeText}>{property.category.toUpperCase()}</Text>
      </View>

      <Text style={styles.titleText}>{property.title}</Text>

      <View style={styles.locationContainer}>
        <Ionicons name="location" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
        <Text style={styles.locationText}>{locationText}</Text>
      </View>

      <View style={styles.actionRow}>
        {hasCoordinates && (
          <TouchableOpacity 
            style={styles.mapButton} 
            onPress={handleOpenMap}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={14} color={Colors.primary} />
            <Text style={styles.mapButtonText}>View on Google Maps</Text>
          </TouchableOpacity>
        )}

        {userUnitsOwned > 0 && (
          <TouchableOpacity 
            style={styles.ownershipBadge}
            onPress={() => router.push("/(tabs)/portfolio")}
            activeOpacity={0.8}
          >
            <Ionicons name="briefcase" size={12} color="#059669" />
            <Text style={styles.ownershipBadgeText}>You own {userUnitsOwned} units</Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.onPrimary,
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
  locationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginLeft: 4,
    flex: 1,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    marginLeft: 6,
  },
  ownershipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  ownershipBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    marginLeft: 4,
  },
});
