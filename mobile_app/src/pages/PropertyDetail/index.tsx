import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Colors } from "@/constants/colors";

import { propertyService } from "../../services/property.service";
import { Property, PLACEHOLDER_IMAGE } from "../BrowseProperties/data";
import LoginPromptModal from "@/components/LoginPromptModal";
import ImageCarousel from "@/components/ui/ImageCarousel";
import ImageViewing from "react-native-image-viewing";
import FavoriteButton from "@/components/ui/FavoriteButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

function PropertyDetailSkeleton({ onBack }: { onBack: () => void }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Animated.View style={[styles.skeletonBlock, { width: 120, height: 20, opacity }]} />
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} scrollEnabled={false}>
        <Animated.View style={[styles.skeletonBlock, { width: "100%", height: 280, borderRadius: 0, opacity }]} />
        <View style={styles.contentSection}>
          <Animated.View style={[styles.skeletonBlock, { width: "70%", height: 32, marginBottom: 12, opacity }]} />
          <Animated.View style={[styles.skeletonBlock, { width: "40%", height: 20, opacity }]} />
        </View>
        <View style={styles.divider} />
        <View style={styles.metricsContainer}>
          <Animated.View style={[styles.skeletonBlock, { flex: 1, height: 80, marginRight: 8, opacity }]} />
          <Animated.View style={[styles.skeletonBlock, { flex: 1, height: 80, marginLeft: 8, opacity }]} />
        </View>
        <View style={styles.metricsList}>
          <Animated.View style={[styles.skeletonBlock, { width: "100%", height: 20, marginBottom: 12, opacity }]} />
          <Animated.View style={[styles.skeletonBlock, { width: "100%", height: 20, marginBottom: 12, opacity }]} />
          <Animated.View style={[styles.skeletonBlock, { width: "100%", height: 20, opacity }]} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function PropertyDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
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
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Property not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images = property.images?.length > 0 ? property.images : [PLACEHOLDER_IMAGE];

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      {/* ── Fixed Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {property.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* ── Image Gallery ── */}
        <View style={styles.imageGalleryContainer}>
          <ImageCarousel
            images={images}
            height={280}
            showThumbnails={true}
            sharedTransitionTagBase={`property-image-${property.id}`}
            onPress={(index) => {
              setImageViewerIndex(index);
              setIsImageViewerVisible(true);
            }}
          />
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(property.status) }]} />
            <Text style={styles.statusLabel}>{property.status.replace("_", " ")}</Text>
          </View>
        </View>

        {/* ── Core Details ── */}
        <View style={styles.contentSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleInfo}>
              <Text style={styles.title}>{property.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={Colors.primary} />
                <Text style={styles.locationText}>{property.location}</Text>
              </View>
            </View>
            <View style={{ marginRight: 8 }}>
              <FavoriteButton 
                propertyId={property.id} 
                size={26}
                style={styles.favouriteButton}
                isGuest={isGuest}
                onRequireLogin={() => setShowLoginPrompt(true)}
              />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Key Metrics Grid ── */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Target IRR</Text>
            <Text style={styles.metricValuePrimary}>{property.targetReturn}%</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Min Investment</Text>
            <Text style={styles.metricValueDark}>{formatCurrency(property.minInvestment)}</Text>
          </View>
        </View>

        <View style={styles.metricsList}>
          <View style={styles.metricRow}>
            <Text style={styles.metricRowLabel}>Total Price</Text>
            <Text style={styles.metricRowValue}>{formatCurrency(property.totalPrice)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricRowLabel}>Total Size</Text>
            <Text style={styles.metricRowValue}>{property.totalSize}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricRowLabel}>Current Investors</Text>
            <Text style={styles.metricRowValue}>{property.investors}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricRowLabel}>Asset Category</Text>
            <Text style={styles.metricRowValue}>{property.category}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Description ── */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.descriptionText}>{property.description}</Text>
        </View>
        
        {/* Extra padding at the bottom for scrolling past the floating footer */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* ── Floating Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerPriceContainer}>
            <Text style={styles.footerPriceLabel}>Min. Investment</Text>
            <Text style={styles.footerPrice}>{formatCurrency(property.minInvestment)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.investButton} 
            activeOpacity={0.8}
            onPress={handleInvestPress}
          >
            <Text style={styles.investButtonText}>Invest Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Login Prompt Modal ── */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={() => {
          setShowLoginPrompt(false);
          router.push("/");
        }}
      />

      {/* ── Image Viewer Modal ── */}
      <ImageViewing
        images={images.map((img) => ({ uri: img }))}
        imageIndex={imageViewerIndex}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
        HeaderComponent={({ imageIndex }) => (
          <View style={{ paddingTop: Math.max(insets.top, 20), flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }}>
            <TouchableOpacity onPress={() => setIsImageViewerVisible(false)} style={{ padding: 8 }}>
              <Ionicons name="close" size={28} color="#fff" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }} />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
              {imageIndex + 1} / {images.length}
            </Text>
            <View style={{ width: 44 }} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  skeletonBlock: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.onPrimaryContainer,
    fontWeight: "600",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHighest,
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onSurface,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  // Gallery
  imageGalleryContainer: {
    width: "100%",
    backgroundColor: Colors.surfaceContainerHigh,
    position: "relative",
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: Colors.onSurface,
  },
  // Content
  contentSection: {
    padding: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleInfo: {
    flex: 1,
    paddingRight: 16,
  },
  favouriteButton: {
    padding: 8,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 99,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginHorizontal: 20,
  },
  // Metrics
  metricsContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.onSurfaceVariant,
    marginBottom: 6,
  },
  metricValuePrimary: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
  },
  metricValueDark: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  metricsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  metricRowLabel: {
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    fontWeight: "500",
  },
  metricRowValue: {
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: "600",
  },
  // Description
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    lineHeight: 24,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 32, // Extra padding from the very bottom
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerPriceContainer: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: "500",
    marginBottom: 2,
  },
  footerPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  investButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  investButtonText: {
    color: Colors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
