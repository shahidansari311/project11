import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { z } from "zod";
import { Colors } from "@/constants/colors";
import api from "@/utils/api";

import AuthLayout from "@/components/AuthLayout";
import BouncingDots from "@/components/BouncingDots";

const loginPhoneSchema = z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number.");

interface LoginPageProps {
  onSendOtp: (phone: string) => void;
}

export default function LoginPage({ onSendOtp }: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePhoneChange = useCallback((text: string) => {
    setPhone(text.replace(/\D/g, "").slice(0, 10));
    if (phoneError) setPhoneError("");
  }, [phoneError]);

  const handleSendOtp = useCallback(async () => {
    const result = loginPhoneSchema.safeParse(phone);
    if (!result.success) {
      setPhoneError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/user/send-otp", { phone });
      onSendOtp(phone);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to send OTP. Try again.";
      setPhoneError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [phone, phoneError, onSendOtp]);

  return (
    <AuthLayout>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Welcome back</Text>
          <Text style={styles.headerSubtitle}>Sign in to manage your portfolio.</Text>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <View style={[styles.phoneInputContainer, phoneError ? styles.inputFieldError : styles.inputFieldDefault]}>
            <Text style={styles.flagIcon}>🇮🇳</Text>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.inputText}
              placeholder="Enter mobile number"
              placeholderTextColor={Colors.outline}
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={handlePhoneChange}
            />
          </View>
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { opacity: loading ? 0.75 : phone.length === 10 ? 1 : 0.5 }]}
          onPress={handleSendOtp}
          disabled={phone.length !== 10 || loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <BouncingDots label="Sending OTP" />
          ) : (
            <Text style={styles.primaryButtonText}>Send OTP</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  headerTextContainer: { 
    alignItems: "center", 
    marginBottom: 24 
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Colors.onSurface, marginBottom: 8, letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, textAlign: "center" },

  inputWrapper: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: "500", color: Colors.onSurface, marginBottom: 8, letterSpacing: 0.24 },
  inputFieldDefault: { borderBottomColor: Colors.border },
  inputFieldError: { borderBottomColor: Colors.error },
  inputText: { flex: 1, fontSize: 16, color: Colors.onSurface, fontWeight: "500" },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 6, lineHeight: 16 },

  phoneInputContainer: { flexDirection: "row", alignItems: "center", height: 48, borderBottomWidth: 1 },
  flagIcon: { fontSize: 20, marginRight: 12 },
  countryCode: { fontSize: 16, color: Colors.onSurface, fontWeight: "500", marginRight: 12 },

  primaryButton: { width: "100%", height: 52, backgroundColor: Colors.primary, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 },
  primaryButtonText: { fontSize: 14, fontWeight: "600", color: Colors.onPrimary },
});