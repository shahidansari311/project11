import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { z } from "zod";
import * as SecureStore from "expo-secure-store";
import { Colors } from "@/constants/colors";

import AuthLayout from "@/components/AuthLayout";
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

  const registerOpacity = useRef(new Animated.Value(1)).current;

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
        email: email || "" 
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

  return (
    <AuthLayout>
      <Animated.View style={{ opacity: registerOpacity }}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Complete Profile</Text>
          <Text style={styles.headerSubtitle}>We need a few details to create your account.</Text>
        </View>

        <CustomInput 
          label="Full Name" 
          value={fullName} 
          onChange={(t: string) => { setFullName(t); if (nameError) setNameError(""); }} 
          error={nameError} 
          placeholder="Enter your full name" 
          autoCapitalize="words" 
        />
        
        <CustomInput 
          label="Email Address" 
          value={email} 
          onChange={(t: string) => { setEmail(t); if (emailError) setEmailError(""); }} 
          error={emailError} 
          placeholder="name@example.com (optional)" 
          keyboardType="email-address" 
          autoCapitalize="none" 
        />

        <View style={styles.termsRow}>
          <TouchableOpacity
            onPress={() => { setTermsAccepted(!termsAccepted); if (termsError) setTermsError(""); }}
            style={[styles.checkbox, termsAccepted ? styles.checkboxActive : (termsError ? styles.checkboxError : styles.checkboxDefault)]}
            activeOpacity={0.7}
          >
            {termsAccepted && <Text style={styles.checkboxCheck}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>
        {termsError ? <Text style={styles.termsErrorText}>{termsError}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, { opacity: fullName.trim().length >= 2 && termsAccepted ? 1 : 0.5, marginTop: 16 }]}
          onPress={handleRegister}
          disabled={fullName.trim().length < 2 || !termsAccepted || loading}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>{loading ? "Saving..." : "Continue"}</Text>
        </TouchableOpacity>

        {onGoBackToLogin && (
           <TouchableOpacity style={{ marginTop: 24, alignItems: "center" }} onPress={onGoBackToLogin}>
             <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary }}>
               Go back to Login
             </Text>
           </TouchableOpacity>
        )}
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  headerTextContainer: { alignItems: "center", marginBottom: 32 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: Colors.onSurface, marginBottom: 8, letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, textAlign: "center" },
  
  primaryButton: { width: "100%", height: 52, backgroundColor: Colors.primary, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 },
  primaryButtonText: { fontSize: 14, fontWeight: "600", color: Colors.onPrimary },
  
  termsRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8, marginTop: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkboxActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  checkboxDefault: { borderColor: Colors.border, backgroundColor: Colors.surfaceContainerLowest },
  checkboxError: { borderColor: Colors.error, backgroundColor: Colors.surfaceContainerLowest },
  checkboxCheck: { color: Colors.onPrimary, fontSize: 12, fontWeight: "700" },
  termsText: { flex: 1, marginLeft: 12, fontSize: 14, lineHeight: 20, color: Colors.onSurfaceVariant },
  termsLink: { color: Colors.primary, fontWeight: "500" },
  termsErrorText: { fontSize: 12, color: Colors.error, marginLeft: 32, marginBottom: 8, lineHeight: 16 },
});
