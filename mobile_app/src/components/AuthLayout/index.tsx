import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Keyboard
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BRAND_NAME = "Silver Real Estate";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const router = useRouter();

  const arrowAnim = useRef(new Animated.Value(0)).current;
  const heroHeight = useRef(new Animated.Value(SCREEN_HEIGHT * 0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        Animated.timing(heroHeight, {
          toValue: SCREEN_HEIGHT * 0.35, // shrink image just enough to keep button visible
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        Animated.timing(heroHeight, {
          toValue: SCREEN_HEIGHT * 0.7,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [arrowAnim, heroHeight]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Hero Image */}
      <Animated.View style={[styles.heroContainer, { height: heroHeight }]}>
        <Image 
          source={{ uri: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop" }} 
          style={styles.heroImage} 
          resizeMode="cover" 
        />
        <View style={styles.heroOverlay} />
      <View style={styles.brandContainer}>
        <View style={styles.brandLogo}><Text style={styles.brandLogoText}>◆</Text></View>
        <Text style={styles.brandText}>{BRAND_NAME}</Text>
      </View>
      
      {/* Skip Login Button */}
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={() => router.replace("/(tabs)/home" as any)}
        activeOpacity={0.8}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
        <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
          <Ionicons name="arrow-forward" size={14} color={Colors.onPrimary} style={{ marginLeft: 4 }} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>

    {/* Content Container */}
    <View style={styles.flex1}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex1: { flex: 1 },
  heroContainer: { width: "100%", position: "relative" },
  heroImage: { width: "100%", height: "100%", position: "absolute" },
  heroOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.35)" },
  brandContainer: { position: "absolute", top: Platform.OS === "ios" ? 56 : 44, left: 24, flexDirection: "row", alignItems: "center", gap: 10, zIndex: 10 },
  brandLogo: { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  brandLogoText: { fontSize: 16, color: "#fff" },
  brandText: { color: "#ffffff", fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  
  skipButton: { 
    position: "absolute", 
    top: Platform.OS === "ios" ? 56 : 44, 
    right: 20, 
    zIndex: 10, 
    backgroundColor: Colors.primary, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center"
  },
  skipButtonText: { color: Colors.onPrimary, fontSize: 14, fontWeight: "600", letterSpacing: 0.3 },

  scrollView: { flex: 1, backgroundColor: Colors.surfaceContainerLowest, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, shadowColor: Colors.onSurface, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 8 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
});
