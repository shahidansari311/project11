import React, { useState, useRef, useCallback } from "react";
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

const loginPhoneSchema = z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number.");

function BouncingDots({ label }: { label: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const makeBounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -7, duration: 280, easing: (t) => t * t * (3 - 2 * t), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 280, easing: (t) => t * t * (3 - 2 * t), useNativeDriver: true }),
          Animated.delay(Math.max(0, 900 - delay - 560)),
        ])
      );

    const a1 = makeBounce(dot1, 0);
    const a2 = makeBounce(dot2, 150);
    const a3 = makeBounce(dot3, 300);
    a1.start(); a2.start(); a3.start();

    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.loadingRow}>
      <Text style={styles.primaryButtonText}>{label}</Text>
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.bounceDot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

interface LoginPageProps {
  onSendOtp: (phone: string) => void;
}

export default function LoginPage({ onSendOtp }: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
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
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Welcome</Text>
        <Text style={styles.headerSubtitle}>Access your institutional real estate portfolio.</Text>
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

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Secure access via Institutional Authentication</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerTextContainer: { alignItems: "center", marginBottom: 32 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: Colors.onSurface, marginBottom: 8, letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, textAlign: "center" },
  
  inputWrapper: { marginBottom: 24 },
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

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  bounceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.onPrimary },
  
  footerContainer: { marginTop: 40, alignItems: "center" },
  footerText: { fontSize: 11, fontWeight: "600", color: Colors.onSurfaceVariant },
});
