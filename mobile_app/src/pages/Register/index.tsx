import { useState, useCallback, useRef, useEffect } from "react";
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
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { z } from "zod";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Ionicons } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

import CustomInput from "@/components/CustomInput";
import api from "@/utils/api";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";

const registerStep1Schema = z.object({
  fullName: z.string().trim().min(2, "Name is too short. Please enter your full name.").regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  email: z.string().trim().email("Please enter a valid email address."),
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

  // Popup Error State
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMsg, setPopupErrorMsg] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const topContentHeight = useRef(new Animated.Value(1)).current; // 1 = full size, 0 = hidden
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Google OAuth Hook
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      handleRegister(true, response.authentication.idToken);
    }
  }, [response]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();

    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        Animated.timing(topContentHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        Animated.timing(topContentHeight, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleRegister = useCallback(async (isGoogle = false, googleIdToken?: string) => {
    if (!termsAccepted) {
      setTermsError("You must agree to the Terms and Privacy Policy.");
      setPopupErrorMsg("You must agree to the Terms and Privacy Policy.");
      setShowErrorPopup(true);
      return;
    }
    if (!registrationToken) {
      setTermsError("Session expired. Please login again.");
      setPopupErrorMsg("Session expired. Please login again.");
      setShowErrorPopup(true);
      return;
    }

    if (!isGoogle) {
      const result = registerStep1Schema.safeParse({ fullName, email });
      if (!result.success) {
        const errors = result.error.format();
        if (errors.fullName?._errors.length) setNameError(errors.fullName._errors[0]);
        if (errors.email?._errors.length) setEmailError(errors.email._errors[0]);
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = { registrationToken };
      if (isGoogle && googleIdToken) {
        payload.googleIdToken = googleIdToken;
      } else {
        payload.fullName = fullName;
        payload.email = email;
      }

      const response = await api.post("/auth/user/register", payload);

      const { token, refreshToken } = response.data.data;

      // Save tokens securely now that registration is complete
      await SecureStore.setItemAsync("access_token", token);
      await SecureStore.setItemAsync("refresh_token", refreshToken);

      // Refresh global favorites context with new token
      refreshFavorites();
      await refreshAuth();

      router.replace("/(tabs)/home" as any);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to register. Please try again.";
      if (msg.toLowerCase().includes("email")) {
        setEmailError(msg);
      } else {
        setTermsError(msg);
        setPopupErrorMsg(msg);
        setShowErrorPopup(true);
      }
    } finally {
      setLoading(false);
    }
  }, [fullName, email, termsAccepted, registrationToken, router, refreshFavorites]);

  const handleGoogleAuth = () => {
    // We don't require terms for Google OAuth anymore because we moved it below? 
    // Or we keep it? The layout puts Google button ABOVE terms now.
    // If we want terms for Google OAuth, they must check it first, which feels weird if it's below.
    // Let's remove the terms requirement for Google Auth here, or they check it. 
    // Actually, usually Google Auth implies terms acceptance if stated nearby, but let's keep the check if required.
    // Since the button is above the checkbox now, let's just trigger promptAsync directly. 
    // The backend can assume terms are accepted, or we can show a small text under the Google button.
    promptAsync();
  };

  const hasManualInput = fullName.trim().length > 0 || email.trim().length > 0;
  const canContinue = fullName.trim().length >= 2 && email.trim().length >= 5 && termsAccepted && !loading;

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

      <Animated.View style={[
        styles.flex1, 
        { 
          marginTop: topContentHeight.interpolate({ inputRange: [0, 1], outputRange: [0, -34] }), 
          zIndex: 1,
          overflow: isKeyboardVisible ? 'hidden' : 'visible'
        }
      ]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 20}
          style={styles.flex1}
        >
          <ScrollView
            style={[styles.flex1, { backgroundColor: "transparent" }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              
              <Animated.View style={{ 
                opacity: topContentHeight, 
                maxHeight: topContentHeight.interpolate({ inputRange: [0, 1], outputRange: [24, 400] }),
                overflow: 'hidden'
              }}>
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

              <View style={styles.googleSection}>
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleAuth}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <Ionicons name="logo-google" size={20} color={Colors.onSurface} style={{ marginRight: 8 }} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>
                <Text style={styles.googleTermsText}>
                  By continuing with Google, you agree to our Terms and Privacy Policy.
                </Text>
              </View>

              <View style={styles.orDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
            </Animated.View>

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
              placeholder="name@example.com (required)"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              onPress={() => { setTermsAccepted(!termsAccepted); if (termsError) setTermsError(""); }}
              style={styles.termsRow}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAccepted ? styles.checkboxActive : (termsError ? styles.checkboxError : styles.checkboxDefault)]}>
                {termsAccepted && <Ionicons name="checkmark" size={14} color={Colors.onPrimary} />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>
            {termsError ? <Text style={styles.termsErrorText}>{termsError}</Text> : null}

            {/* Action button now flows naturally at the end of the form */}
            {hasManualInput && (
              <TouchableOpacity
                style={[styles.primaryButton, { opacity: canContinue ? 1 : 0.5, marginTop: 32 }]}
                onPress={() => handleRegister(false)}
                disabled={!canContinue}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>{loading ? "Saving..." : "Continue manually"}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      </Animated.View>

      {/* Error Popup Modal */}
      {showErrorPopup && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <View style={styles.popupHeader}>
              <Ionicons name="alert-circle" size={32} color={Colors.error} />
              <Text style={styles.popupTitle}>Wait a minute</Text>
            </View>
            <Text style={styles.popupMessage}>{popupErrorMsg}</Text>
            <TouchableOpacity style={styles.popupButton} onPress={() => setShowErrorPopup(false)}>
              <Text style={styles.popupButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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

  termsRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  checkboxActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  checkboxDefault: { borderColor: Colors.border, backgroundColor: Colors.surfaceContainerLowest },
  checkboxError: { borderColor: Colors.error, backgroundColor: Colors.surfaceContainerLowest },
  termsText: { flex: 1, marginLeft: 10, fontSize: 13, lineHeight: 19, color: Colors.onSurfaceVariant },
  termsLink: { color: Colors.primary, fontWeight: "600" },
  termsErrorText: { fontSize: 12, color: Colors.error, marginLeft: 32, marginTop: 4, lineHeight: 16 },

  actionBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryButton: { width: "100%", height: 52, backgroundColor: Colors.primary, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { fontSize: 14, fontWeight: "600", color: Colors.onPrimary },
  
  googleSection: { alignItems: 'center' },
  googleTermsText: { fontSize: 11, color: Colors.onSurfaceVariant, textAlign: 'center', marginTop: 12, paddingHorizontal: 20 },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { marginHorizontal: 12, fontSize: 12, color: Colors.onSurfaceVariant, fontWeight: '600' },
  
  googleButton: { width: "100%", height: 52, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  googleButtonText: { fontSize: 14, fontWeight: "600", color: Colors.onSurface },

  popupOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  popupContainer: { width: "80%", backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  popupHeader: { alignItems: "center", marginBottom: 16 },
  popupTitle: { fontSize: 18, fontWeight: "700", color: Colors.onSurface, marginTop: 8 },
  popupMessage: { fontSize: 14, color: Colors.onSurfaceVariant, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  popupButton: { width: "100%", paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 8, alignItems: "center" },
  popupButtonText: { color: Colors.onPrimary, fontSize: 14, fontWeight: "600" },
});