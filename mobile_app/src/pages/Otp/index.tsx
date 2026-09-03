import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Keyboard,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

import OtpBoxes from "@/components/OtpBoxes";
import api from "@/utils/api";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";

const OTP_LENGTH = 6;

function BouncingDots({ label }: { label: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

interface OtpPageProps {
  phone: string;
  onRegisterRequired: (token: string) => void;
  onGoBack: () => void;
}

export default function OtpPage({ phone, onRegisterRequired, onGoBack }: OtpPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [showResendSuccess, setShowResendSuccess] = useState(false);
  
  const { refreshFavorites } = useFavorites();
  const { refreshAuth } = useAuth();

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = useCallback((text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (!cleaned) {
      setOtp(prev => { const n = [...prev]; n[index] = ""; return n; });
      return;
    }
    if (cleaned.length > 1) {
      const pastedOtp = cleaned.slice(0, OTP_LENGTH).split("");
      setOtp(prev => {
        const n = [...prev];
        pastedOtp.forEach((char, i) => { if (index + i < OTP_LENGTH) n[index + i] = char; });
        return n;
      });
      if (otpError) setOtpError("");
      const nextIndex = Math.min(index + pastedOtp.length, OTP_LENGTH - 1);
      otpRefs.current[nextIndex]?.focus();
      if (index + pastedOtp.length >= OTP_LENGTH) Keyboard.dismiss();
      return;
    }
    setOtp(prev => { const n = [...prev]; n[index] = cleaned; return n; });
    if (otpError) setOtpError("");
    if (index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    } else {
      Keyboard.dismiss();
    }
  }, [otpError]);

  const handleOtpKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
      setOtp(prev => { const n = [...prev]; n[index - 1] = ""; return n; });
    }
  }, [otp]);

  const handleVerifyOtp = useCallback(async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post("/auth/user/verify-otp", { phone, otp: fullOtp });
      const { token, refreshToken, isNewUser, registrationToken } = response.data.data;
      
      if (isNewUser && onRegisterRequired) {
        onRegisterRequired(registrationToken);
      } else {
        await SecureStore.setItemAsync("access_token", token);
        await SecureStore.setItemAsync("refresh_token", refreshToken);
        refreshFavorites();
        await refreshAuth();
        router.replace("/(tabs)/home" as any);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Invalid OTP";
      setOtpError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [otp, phone, router, onRegisterRequired, refreshFavorites]);

  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0) return;
    try {
      await api.post("/auth/user/resend-otp", { phone });
      setResendTimer(60);
      setShowResendSuccess(true);
      setTimeout(() => setShowResendSuccess(false), 2500);
    } catch (err: any) {
      const msg: string = err.response?.data?.message || "Failed to resend OTP.";
      const cooldownMatch = msg.match(/(\d+)\s*second/);
      if (cooldownMatch) {
        const remaining = parseInt(cooldownMatch[1], 10);
        setResendTimer(remaining);
      } else {
        setOtpError(msg);
      }
    }
  }, [resendTimer, phone]);

  const handleCancelAndEdit = useCallback(() => {
    api.post("/auth/user/cancel-otp", { phone }).catch(() => {});
    onGoBack();
  }, [phone, onGoBack]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Verify Identity</Text>
        <Text style={styles.headerSubtitle}>Enter the code to continue.</Text>
      </View>

      <View style={styles.otpSentContainer}>
        <View>
          <Text style={styles.otpSentLabel}>OTP sent to</Text>
          <Text style={styles.otpSentValue}>+91 {phone}</Text>
        </View>
        <TouchableOpacity onPress={handleCancelAndEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 16 }}>
        <View style={styles.otpHeaderRow}>
          <Text style={styles.otpLabel}>One-Time Password</Text>
        </View>
        <OtpBoxes values={otp} refs={otpRefs} onChange={handleOtpChange} onKeyPress={handleOtpKeyPress} hasError={!!otpError} />
        {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
        
        <View style={styles.resendContainer}>
          <Text style={styles.resendPromptText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResendOtp} disabled={resendTimer > 0}>
            <Text style={[styles.resendText, resendTimer > 0 && { color: Colors.onSurfaceVariant }]}>
              {resendTimer > 0 ? `Resend in 00:${resendTimer.toString().padStart(2, '0')}` : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        </View>
        {showResendSuccess && (
          <View style={styles.resendSuccessContainer}>
            <Ionicons name="checkmark-circle" size={14} color="#2e7d32" />
            <Text style={styles.resendSuccessText}>OTP sent successfully</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { opacity: loading ? 0.75 : otp.join('').length === 6 ? 1 : 0.5 }]}
        onPress={handleVerifyOtp}
        disabled={otp.join('').length !== 6 || loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <BouncingDots label="Verifying" />
        ) : (
          <Text style={styles.primaryButtonText}>Verify OTP</Text>
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
  
  otpSentContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: Colors.surfaceContainerLow, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  otpSentLabel: { fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 4 },
  otpSentValue: { fontSize: 16, fontWeight: "600", color: Colors.onSurface },
  editButtonText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  
  otpHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  otpLabel: { fontSize: 12, fontWeight: "500", color: Colors.onSurface, letterSpacing: 0.24 },
  resendContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24 },
  resendPromptText: { fontSize: 13, color: Colors.onSurfaceVariant },
  resendText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  resendSuccessContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8, gap: 4 },
  resendSuccessText: { fontSize: 12, fontWeight: "500", color: "#2e7d32" },
  
  errorText: { fontSize: 12, color: Colors.error, marginTop: 6, lineHeight: 16 },
  primaryButton: { width: "100%", height: 52, backgroundColor: Colors.primary, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 },
  primaryButtonText: { fontSize: 14, fontWeight: "600", color: Colors.onPrimary },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  bounceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.onPrimary },
  
  footerContainer: { marginTop: 40, alignItems: "center" },
  footerText: { fontSize: 11, fontWeight: "600", color: Colors.onSurfaceVariant },
});
