/**
 * PropertyDetailPage — Clean, Standard, 100% Interactive Luxury UI
 * ─────────────────────────────────────────────────────────────────────────────
 * Standard, smooth ScrollView layout with zero locked elements.
 * Extracted into smaller, modular components.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Colors } from "@/constants/colors";

import { propertyService } from "../../services/property.service";
import { Property, PLACEHOLDER_IMAGE } from "../BrowseProperties/data";
import LoginPromptModal from "@/components/LoginPromptModal";
import FavoriteButton from "@/components/ui/FavoriteButton";
import ImageViewing from "react-native-image-viewing";

// Sub-components
import PropertyDetailSkeleton from "./components/PropertySkeleton";
import PropertyHeroBanner from "./components/PropertyHeroBanner";
import PropertyTitle from "./components/PropertyTitle";
import PropertyHighlights from "./components/PropertyHighlights";
import PropertyFinancials from "./components/PropertyFinancials";
import PropertyActionBar from "./components/PropertyActionBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PropertyDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync("refresh_token");
      setIsGuest(!token);
    } catch (e) {
      setIsGuest(true);
    }
  };

  const fetchProperty = useCallback(async () => {
    try {
      const res = await propertyService.getPropertyById(id);
      if (res && res.data) {
        setProperty(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch property details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    checkAuthStatus();
    fetchProperty();
  }, [fetchProperty]);

  const handleInvestPress = () => {
    if (isGuest) {
      setShowLoginPrompt(true);
    } else {
      // Dummy action for logged in users
    }
  };

  if (isLoading) {
    return <PropertyDetailSkeleton onBack={() => router.back()} />;
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={56} color={Colors.error} />
        <Text style={styles.errorText}>Property not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images = property.images?.length > 0 ? property.images : [PLACEHOLDER_IMAGE];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Floating Header ── */}
      <View style={[styles.floatingHeader, { top: insets.top + 6 }]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.glassNavBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        
        <View style={styles.glassNavBtn}>
          <FavoriteButton
            propertyId={property.id}
            size={20}
            isGuest={isGuest}
            onRequireLogin={() => setShowLoginPrompt(true)}
          />
        </View>
      </View>

      {/* ── Main Scroll View ── */}
      <Animated.ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ zIndex: 0, transform: [{ 
            translateY: scrollY.interpolate({
                inputRange: [-100, 0, 1000],
                outputRange: [0, 0, 500], // Extrapolate clamps negative values to 0, and uses 0.5x for positive
            }) 
        }] }}>
          <PropertyHeroBanner
            property={property}
            images={images}
            insetsTop={0}
            screenWidth={SCREEN_WIDTH}
            onImagePress={(index) => {
              setImageViewerIndex(index);
              setIsImageViewerVisible(true);
            }}
          />
        </Animated.View>

        {/* ── Overlapping Detail Sheet Card ── */}
        <View style={[styles.slidingCard, { zIndex: 1 }]}>
          {/* Card Handle */}
          <View style={styles.cardHandle} />

          <PropertyTitle property={property} />
          
          <PropertyHighlights property={property} />
          
          <PropertyFinancials property={property} />

          {/* Extra Bottom Scroll Padding */}
          <View style={{ height: 130 }} />
        </View>
      </Animated.ScrollView>

      <PropertyActionBar
        property={property}
        insetsBottom={insets.bottom}
        onInvestPress={handleInvestPress}
      />

      {/* ── Login Prompt Modal ── */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={() => {
          setShowLoginPrompt(false);
          router.push("/");
        }}
      />

      {/* ── Fullscreen Image Viewer Modal ── */}
      <ImageViewing
        images={images.map((img) => ({ uri: img }))}
        imageIndex={imageViewerIndex}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
        HeaderComponent={({ imageIndex }) => (
          <View style={styles.imageViewerHeader}>
            <TouchableOpacity onPress={() => setIsImageViewerVisible(false)} style={styles.imageViewerCloseBtn}>
              <Ionicons name="close" size={28} color="#fff" style={styles.imageViewerIconShadow} />
            </TouchableOpacity>
            <Text style={styles.imageViewerTitle}>
              {imageIndex + 1} / {images.length}
            </Text>
            <View style={{ width: 44 }} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: Colors.onSurface,
    marginTop: 12,
    marginBottom: 24,
    fontWeight: "600",
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 16,
  },
  backButtonText: {
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  scrollContainer: {
    flex: 1,
  },
  // ── Floating Header ──
  floatingHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  glassNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  // ── Overlapping Detail Sheet Card ──
  slidingCard: {
    marginTop: -24,
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
  // ── Image Viewer Modal Header ──
  imageViewerHeader: {
    paddingTop: 40, // rough safe area top
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
  },
  imageViewerCloseBtn: {
    padding: 8,
  },
  imageViewerIconShadow: {
    textShadowColor: 'rgba(0,0,0,0.5)', 
    textShadowOffset: { width: 0, height: 1 }, 
    textShadowRadius: 4,
  },
  imageViewerTitle: {
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold', 
    alignSelf: 'center', 
    textShadowColor: 'rgba(0,0,0,0.5)', 
    textShadowOffset: { width: 0, height: 1 }, 
    textShadowRadius: 4,
  }
});
