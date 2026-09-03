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

import AuthLayout from "@/components/AuthLayout";
import OtpBoxes from "@/components/OtpBoxes";
import BouncingDots from "@/components/BouncingDots";
import api from "@/utils/api";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";

const OTP_LENGTH = 6;

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
    <AuthLayout>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Verify your number</Text>
          <View style={styles.otpSentRow}>
            <Text style={styles.otpSentText}>OTP sent to +91 {phone}</Text>
            <TouchableOpacity onPress={handleCancelAndEdit} activeOpacity={0.7} style={styles.editIconBtn}>
              <Ionicons name="pencil" size={14} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <OtpBoxes values={otp} refs={otpRefs} onChange={handleOtpChange} onKeyPress={handleOtpKeyPress} hasError={!!otpError} />
          {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

          <View style={styles.resendContainer}>
            <Text style={styles.resendPromptText}>
              Didn't receive OTP?{" "}
              {resendTimer > 0 ? (
                <Text style={styles.resendText}>Resend in {resendTimer}s</Text>
              ) : (
                <Text style={styles.resendActionText} onPress={handleResendOtp}>Resend</Text>
              )}
            </Text>
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
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  headerTextContainer: { alignItems: "center", marginBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Colors.onSurface, marginBottom: 8 },
  otpSentRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 4 },
  otpSentText: { fontSize: 14, color: Colors.onSurfaceVariant },
  editIconBtn: { padding: 6, marginLeft: 2 },

  resendContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20 },
  resendPromptText: { fontSize: 13, color: Colors.onSurfaceVariant },
  resendText: { fontSize: 13, color: Colors.onSurfaceVariant },
  resendActionText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  resendSuccessContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8, gap: 4 },
  resendSuccessText: { fontSize: 12, fontWeight: "500", color: "#2e7d32" },

  errorText: { fontSize: 12, color: Colors.error, marginTop: 12, textAlign: "center", lineHeight: 16 },
  primaryButton: { width: "100%", height: 52, backgroundColor: Colors.primary, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { fontSize: 14, fontWeight: "600", color: Colors.onPrimary },
});

