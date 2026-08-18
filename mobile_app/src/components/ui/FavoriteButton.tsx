import React from "react";
import { TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useFavorites } from "../../contexts/FavoritesContext";

interface FavoriteButtonProps {
  propertyId: string;
  size?: number;
  style?: any;
  isGuest?: boolean;
  onRequireLogin?: () => void;
}

export default function FavoriteButton({ propertyId, size = 24, style, isGuest, onRequireLogin }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(propertyId);
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (isGuest && onRequireLogin) {
      onRequireLogin();
      return;
    }

    // Simple pop animation
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start();

    toggleFavorite(propertyId);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[styles.button, style]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={favorited ? "heart" : "heart-outline"}
          size={size}
          color={favorited ? Colors.error : Colors.onSurfaceVariant}
          style={styles.icon}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  }
});
