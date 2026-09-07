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
import { Ionicons } from "@expo/vector-icons";
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
});

import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from 'react-native-svg';
import { Colors } from "@/constants/colors";

import CustomInput from "@/components/CustomInput";
import BouncingDots from "@/components/BouncingDots";
import api from "@/utils/api";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";

const GoogleLogo = ({ width = 20, height = 20 }) => (
  <Svg width={width} height={height} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </Svg>
);

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
  const [googleError, setGoogleError] = useState("");
  
  // Custom Top Toast State
  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: insets.top + 20, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start();
  }, [insets.top]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const topContentHeight = useRef(new Animated.Value(1)).current; // 1 = full size, 0 = hidden
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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
    if (!isGoogle && !termsAccepted) {
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
      if (!isGoogle && msg.toLowerCase().includes("email")) {
        setEmailError(msg);
      } else if (isGoogle) {
        showToast(msg);
      } else {
        setTermsError(msg);
        setPopupErrorMsg(msg);
        setShowErrorPopup(true);
      }
    } finally {
      setLoading(false);
    }
  }, [fullName, email, termsAccepted, registrationToken, router, refreshFavorites]);

  const handleGoogleAuth = async () => {
    try {
      setIsGoogleLoading(true);
      if (googleError) setGoogleError("");
      await GoogleSignin.hasPlayServices();
      try { await GoogleSignin.signOut(); } catch (e) {} // Force account picker
      const userInfo = await GoogleSignin.signIn();
      if (userInfo?.data?.idToken) {
        await handleRegister(true, userInfo.data.idToken);
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // user cancelled the login flow
            break;
          case statusCodes.IN_PROGRESS:
            // operation (e.g. sign in) is in progress already
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // play services not available or outdated
            console.error("Play services not available");
            break;
          default:
            console.error("Google sign in error", error);
        }
      } else {
        console.error("Unknown error during Google sign in", error);
      }
    } finally {
      setIsGoogleLoading(false);
    }
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
                  disabled={loading || isGoogleLoading}
                  activeOpacity={0.9}
                >
                  {isGoogleLoading ? (
                    <BouncingDots label="Connecting to Google" color="#3C4043" />
                  ) : (
                    <>
                      <View style={{ marginRight: 12 }}>
                        <GoogleLogo width={22} height={22} />
                      </View>
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
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

      {/* Top Toast */}
      <Animated.View style={[styles.topToast, { transform: [{ translateY: toastAnim }] }]}>
        <Ionicons name="alert-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.topToastText}>{toastMsg}</Text>
      </Animated.View>
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
  
  googleButton: { width: "100%", height: 52, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DADCE0", borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  googleButtonText: { fontSize: 15, fontWeight: "500", color: "#3C4043" },

  popupOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  popupContainer: { width: "80%", backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  popupHeader: { alignItems: "center", marginBottom: 16 },
  popupTitle: { fontSize: 18, fontWeight: "700", color: Colors.onSurface, marginTop: 8 },
  popupMessage: { fontSize: 14, color: Colors.onSurfaceVariant, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  popupButton: { width: "100%", paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 8, alignItems: "center" },
  popupButtonText: { color: Colors.onPrimary, fontSize: 14, fontWeight: "600" },

  topToast: { position: "absolute", top: 0, left: 20, right: 20, backgroundColor: Colors.error, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, zIndex: 9999 },
  topToastText: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
});