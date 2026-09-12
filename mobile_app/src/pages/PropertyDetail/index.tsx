/**
 * PropertyDetailPage — Clean, Standard, 100% Interactive Luxury UI
 * ─────────────────────────────────────────────────────────────────────────────
 * Standard, smooth ScrollView layout with zero locked elements.
 * Extracted into smaller, modular components.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Colors } from "@/constants/colors";
import { useAuth } from "../../contexts/AuthContext";

import { propertyService } from "../../services/property.service";
import { investmentService } from "../../services/investment.service";
import { Property, InvestmentInfo, PLACEHOLDER_IMAGE } from "../BrowseProperties/data";
import LoginPromptModal from "@/components/LoginPromptModal";
import FavoriteButton from "@/components/ui/FavoriteButton";
import ImageViewing from "react-native-image-viewing";

import PropertyDetailSkeleton from "./components/PropertySkeleton";
import PropertyHeroBanner from "./components/PropertyHeroBanner";
import PropertyTitle from "./components/PropertyTitle";
import PropertyHighlights from "./components/PropertyHighlights";
import PropertyFinancials from "./components/PropertyFinancials";
import PropertyPriceGraph from "./components/PropertyPriceGraph";
import InvestNowPanel from "./components/InvestNowPanel";
import BuilderActionPanel from "./components/BuilderActionPanel";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function PropertyDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuth();
  const isBuilder = userProfile?.role === "BUILDER";
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);

  // Card starts at y=280 in scroll content (HERO=300, marginTop=-20).
  // Stop card top just below floating header bottom (46px from scroll top) + 16px buffer.
  // 280 - 46 - 16 = 218 — device-independent (works for both Android & iPhone).
  const MAX_SCROLL_Y = 218;

  // Inner card height: fills screen from max-scroll position down to bottom
  const CARD_HEIGHT = SCREEN_HEIGHT - insets.top - 62;

  const innerScrollRef = useRef<ScrollView>(null);
  const isScrollingToTab = useRef(false);
  const [sectionLayouts, setSectionLayouts] = useState({
    overview: 0,
    financials: 0,
    trends: 0,
  });

  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTabPress = (tab: "overview" | "financials" | "trends") => {
    setActiveTab(tab);
    if (innerScrollRef.current && sectionLayouts[tab] !== undefined) {
      isScrollingToTab.current = true;
      innerScrollRef.current.scrollTo({ y: sectionLayouts[tab], animated: true });
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      scrollTimeout.current = setTimeout(() => {
        isScrollingToTab.current = false;
      }, 500);
    }
  };

  const [property, setProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "financials" | "trends">("overview");
  const [userUnitsOwned, setUserUnitsOwned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [investmentInfo, setInvestmentInfo] = useState<InvestmentInfo | null>(null);
  const [investInfoLoading, setInvestInfoLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync("refresh_token");
      setIsGuest(!token);
    } catch (e) {
      setIsGuest(true);
    }
  };

  const loadInvestmentInfo = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setInvestInfoLoading(true);
      const res = await investmentService.getPropertyInvestmentInfo(id);
      if (res?.data) setInvestmentInfo(res.data);
    } catch (e) {
      // Silent fail — not critical
    } finally {
      setInvestInfoLoading(false);
    }
  }, [id]);

  const loadProperty = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    try {
      const res = await propertyService.getPropertyById(id);
      if (res && res.data) {
        setProperty(res.data);
      }
      // Also fetch user investment if logged in
      const token = await SecureStore.getItemAsync("refresh_token");
      if (token) {
        const invRes = await investmentService.getMyInvestments({ status: "APPROVED", limit: 100 });
        if (invRes?.data?.investments) {
          const owned = invRes.data.investments
            .filter(i => i.propertyId === id)
            .reduce((sum, i) => sum + i.units, 0);
          setUserUnitsOwned(owned);
        }
      }
    } catch (error) {
      console.error("Failed to fetch property details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchData = useCallback(async (isRefresh = false) => {
    await Promise.all([
      checkAuthStatus(),
      loadProperty(isRefresh),
      loadInvestmentInfo(isRefresh)
    ]);
  }, [loadProperty, loadInvestmentInfo]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData(true);
    setIsRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading && !isRefreshing) {
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.surface }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Floating Header — back button only ── */}
      <View style={[styles.floatingHeader, { top: insets.top + 6 }]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.glassNavBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* ── Main Scroll View ── */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onScrollEndDrag={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          if (y > MAX_SCROLL_Y) {
            scrollViewRef.current?.scrollTo({ y: MAX_SCROLL_Y, animated: true });
          }
        }}
        onMomentumScrollEnd={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          if (y > MAX_SCROLL_Y) {
            scrollViewRef.current?.scrollTo({ y: MAX_SCROLL_Y, animated: true });
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            progressViewOffset={insets.top + 50}
          />
        }
      >
        <Animated.View style={{ zIndex: 0, transform: [{ 
            translateY: scrollY.interpolate({
                inputRange: [-100, 0, 1000],
                outputRange: [0, 0, 500],
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

          {/* ── Like button overlaid on hero image (bottom-right) ── */}
          <View style={styles.heroLikeBtn} pointerEvents="box-none">
            <FavoriteButton
              propertyId={property.id}
              size={22}
              isGuest={isGuest}
              onRequireLogin={() => setShowLoginPrompt(true)}
            />
          </View>
        </Animated.View>

        {/* ── Overlapping Detail Sheet Card ── */}
        <View style={[styles.slidingCard, { zIndex: 1, height: CARD_HEIGHT }]}>
          {/* Card Handle */}
          <View style={styles.cardHandle} />

          {/* Sticky property title — stays visible while details scroll */}
          <PropertyTitle property={property} userUnitsOwned={userUnitsOwned} />
          
          {/* ── Custom Tab Bar (Sticky) ── */}
          <View style={styles.tabBar}>
            {(['overview', 'financials', 'trends'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                onPress={() => handleTabPress(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Inner independently-scrollable content */}
          <ScrollView
            ref={innerScrollRef}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
            scrollEventThrottle={16}
            onScroll={(e) => {
              if (isScrollingToTab.current) return;
              const y = e.nativeEvent.contentOffset.y;
              
              let nextTab: "overview" | "financials" | "trends" = "overview";
              if (y >= sectionLayouts.trends - 50) {
                nextTab = 'trends';
              } else if (y >= sectionLayouts.financials - 50) {
                nextTab = 'financials';
              }
              
              setActiveTab((prev) => prev !== nextTab ? nextTab : prev);
            }}
          >

            {/* ── Sections ── */}
            <View onLayout={(e) => {
              const y = e.nativeEvent.layout.y;
              setSectionLayouts(prev => ({ ...prev, overview: y }));
            }}>
              <PropertyHighlights property={property} />
            </View>
            
            <View onLayout={(e) => {
              const y = e.nativeEvent.layout.y;
              setSectionLayouts(prev => ({ ...prev, financials: y }));
            }}>
              <PropertyFinancials property={property} />
            </View>
            
            <View onLayout={(e) => {
              const y = e.nativeEvent.layout.y;
              setSectionLayouts(prev => ({ ...prev, trends: y }));
            }}>
              <PropertyPriceGraph priceHistory={property.priceHistory} />
            </View>
          </ScrollView>
        </View>
      </Animated.ScrollView>

      {/* ── Docked Bottom Panel ── */}
      <View
        style={[
          styles.investPanelContainer,
          { paddingBottom: Math.max(insets.bottom + 10, 16), paddingTop: 10 },
        ]}
      >
        {isBuilder ? (
          <BuilderActionPanel property={property} onUpdate={() => fetchData(true)} />
        ) : (
          <InvestNowPanel
            propertyId={id}
            investmentInfo={investmentInfo}
            isLoading={investInfoLoading}
            isGuest={isGuest}
            onRequireLogin={() => setShowLoginPrompt(true)}
            onSuccess={loadInvestmentInfo}
          />
        )}
      </View>

      {/* ── Login Prompt Modal ── */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
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
    </KeyboardAvoidingView>
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
    marginTop: -20,
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
  // ── Invest Now Panel ──
  investPanelContainer: {
    backgroundColor: "transparent",
  },
  // ── Like button on hero image ──
  heroLikeBtn: {
    position: 'absolute',
    top: 6,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 15,
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
  },
  ownershipBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ECFDF5",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    marginBottom: 8,
    marginTop: -4,
  },
  ownershipLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ownershipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  ownershipBtn: {
    backgroundColor: "#059669",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ownershipBtnText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.outline,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: "800",
  },
});
