import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { z } from "zod";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

import CustomInput from "@/components/CustomInput";
import api from "@/utils/api";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";

const registerStep1Schema = z.object({
  fullName: z.string().trim().min(2, "Name is too short. Please enter your full name.").regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  email: z.string().trim().email("This doesn't look like a valid email. Please check it.").optional().or(z.literal("")),
});

interface RegisterPageProps {
  registrationToken?: string;
  onGoBackToLogin?: () => void;
}

export default function RegisterPage({ registrationToken, onGoBackToLogin }: RegisterPageProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const { refreshFavorites } = useFavorites();
  const { refreshAuth } = useAuth();

  // Register Step State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [termsError, setTermsError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = useCallback(async () => {
    const result = registerStep1Schema.safeParse({ fullName, email });
    if (!result.success) {
      const errors = result.error.format();
      if (errors.fullName?._errors.length) setNameError(errors.fullName._errors[0]);
      if (errors.email?._errors.length) setEmailError(errors.email._errors[0]);
      return;
    }
    if (!termsAccepted) {
      setTermsError("You must agree to the Terms and Privacy Policy.");
      return;
    }
    if (!registrationToken) {
      setTermsError("Session expired. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/user/register", {
        registrationToken,
        fullName,
        email: email || "",
      });

      const { token, refreshToken } = response.data.data;

      // Save tokens securely now that registration is complete
      await SecureStore.setItemAsync("access_token", token);
      await SecureStore.setItemAsync("refresh_token", refreshToken);

      // Refresh global favorites context with new token
      refreshFavorites();
      await refreshAuth();

      router.replace("/(tabs)/home" as any);
    } catch (error: any) {
      setTermsError(error.response?.data?.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fullName, email, termsAccepted, registrationToken, router, refreshFavorites]);

  const canContinue = fullName.trim().length >= 2 && termsAccepted && !loading;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top app bar — solid brand band instead of a photo, keeps this screen visually distinct from Login */}
      <View style={[styles.topBand, { paddingTop: (insets.top > 0 ? insets.top : 48) + 20 }]}>
        <Image source={require("@/assets/images/logo-glow.png")} style={styles.glowImage} resizeMode="contain" />

        <View style={styles.topBarRow}>
          {onGoBackToLogin ? (
            <TouchableOpacity style={styles.backButton} onPress={onGoBackToLogin} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={20} color={Colors.onPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>Step 2 of 2</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.flex1, { marginTop: -34, zIndex: 1 }]}>
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Avatar overlaps the band above, anchoring the form */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person-add" size={28} color={Colors.primary} />
              </View>
            </View>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Complete your profile</Text>
              <Text style={styles.headerSubtitle}>Just a couple of details to set up your account.</Text>
            </View>

            <CustomInput
              label="Full Name"
              icon="person-outline"
              value={fullName}
              onChange={(t: string) => { setFullName(t); if (nameError) setNameError(""); }}
              error={nameError}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />

            <CustomInput
              label="Email Address"
              icon="mail-outline"
              value={email}
              onChange={(t: string) => { setEmail(t); if (emailError) setEmailError(""); }}
              error={emailError}
              placeholder="name@example.com (optional)"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              onPress={() => { setTermsAccepted(!termsAccepted); if (termsError) setTermsError(""); }}
              style={styles.termsRow}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAccepted ? styles.checkboxActive : (termsError ? styles.checkboxError : styles.checkboxDefault)]}>
                {termsAccepted && <Ionicons name="checkmark" size={13} color={Colors.onPrimary} />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>
            {termsError ? <Text style={styles.termsErrorText}>{termsError}</Text> : null}
          </Animated.View>
        </ScrollView>

        {/* Sticky action bar */}
        <View style={[styles.actionBar, { paddingBottom: (insets.bottom > 0 ? insets.bottom : 24) + 16 }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { opacity: canContinue ? 1 : 0.5 }]}
            onPress={handleRegister}
            disabled={!canContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>{loading ? "Saving..." : "Continue"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex1: { flex: 1 },

  topBand: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 44,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  glowImage: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    opacity: 0.5
  },
  topBarRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  backButtonPlaceholder: { width: 36, height: 36 },
  stepPill: { backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  stepPillText: { color: Colors.onPrimary, fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 0, paddingBottom: 24, flexGrow: 1 },

  avatarWrapper: { alignItems: "center", marginTop: 0, marginBottom: 16 },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },

  headerTextContainer: { alignItems: "center", marginBottom: 28 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Colors.onSurface, marginBottom: 6, letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 19, textAlign: "center", paddingHorizontal: 12 },

  termsRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  checkboxDefault: { borderColor: Colors.border, backgroundColor: Colors.surfaceContainerLowest },
  checkboxError: { borderColor: Colors.error, backgroundColor: Colors.surfaceContainerLowest },
  termsText: { flex: 1, marginLeft: 12, fontSize: 13, lineHeight: 19, color: Colors.onSurfaceVariant },
  termsLink: { color: Colors.primary, fontWeight: "600" },
  termsErrorText: { fontSize: 12, color: Colors.error, marginLeft: 32, marginTop: 8, lineHeight: 16 },

  actionBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryButton: { width: "100%", height: 52, backgroundColor: Colors.primary, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { fontSize: 14, fontWeight: "600", color: Colors.onPrimary },
});