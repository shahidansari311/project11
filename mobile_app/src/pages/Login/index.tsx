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

// ── Staggered bouncing dots — 3 circles that wave up/down with 150ms stagger
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
import { useRouter } from "expo-router";
import { z } from "zod";
import * as SecureStore from "expo-secure-store";
import { Colors } from "@/constants/colors";

import AuthLayout from "@/components/AuthLayout";
import OtpBoxes from "@/components/OtpBoxes";
import { Ionicons } from "@expo/vector-icons";
import api from "@/utils/api";

const OTP_LENGTH = 6;
const loginPhoneSchema = z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number.");

interface LoginPageProps {
  onRegisterRequired?: (token: string) => void;
}

export default function LoginPage({ onRegisterRequired }: LoginPageProps) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [showResendSuccess, setShowResendSuccess] = useState(false);

  // Phone Step State
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // OTP Step State
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const otpOpacity = useRef(new Animated.Value(0)).current;
  const otpTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

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
      
      setResendTimer(60);
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }).start(() => {
        setStep("otp");
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        
        Animated.parallel([
          Animated.timing(otpOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(otpTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to send OTP. Try again.";
      setPhoneError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [phone, phoneError, fadeAnim, otpOpacity, otpTranslateY]);

  const handleOtpChange = useCallback((text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (!cleaned) {
      setOtp(prev => { const n = [...prev]; n[index] = ""; return n; });
      return;
    }
    if (cleaned.length > 1) {
      // Paste flow
      const pastedOtp = cleaned.slice(0, OTP_LENGTH).split("");
      setOtp(prev => {
        const n = [...prev];
        pastedOtp.forEach((char, i) => { if (index + i < OTP_LENGTH) n[index + i] = char; });
        return n;
      });
      if (otpError) setOtpError("");
      const nextIndex = Math.min(index + pastedOtp.length, OTP_LENGTH - 1);
      otpRefs.current[nextIndex]?.focus();
      // Dismiss keyboard if paste fills all 6 slots
      if (index + pastedOtp.length >= OTP_LENGTH) Keyboard.dismiss();
      return;
    }
    // Single digit flow
    setOtp(prev => { const n = [...prev]; n[index] = cleaned; return n; });
    if (otpError) setOtpError("");
    if (index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    } else {
      // Last box filled — dismiss keyboard
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
        // Save tokens securely for existing user
        await SecureStore.setItemAsync("access_token", token);
        await SecureStore.setItemAsync("refresh_token", refreshToken);
        router.replace("/home");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Invalid OTP";
      setOtpError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [otp, phone, router, onRegisterRequired]);

  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0) return;

    try {
      await api.post("/auth/user/resend-otp", { phone });
      setResendTimer(60);
      setShowResendSuccess(true);
      setTimeout(() => setShowResendSuccess(false), 2500);
    } catch (err: any) {
      const msg: string = err.response?.data?.message || "Failed to resend OTP.";

      // If backend says "Please wait N second(s)...", parse N and restart the timer
      const cooldownMatch = msg.match(/(\d+)\s*second/);
      if (cooldownMatch) {
        const remaining = parseInt(cooldownMatch[1], 10);
        setResendTimer(remaining); // restarts the countdown from the correct value
      } else {
        setOtpError(msg);
      }
    }
  }, [resendTimer, phone]);

  // Called by the Edit button — silently clears the DB OTP record so
  // re-entering the same phone number has no cooldown.
  const handleCancelAndEdit = useCallback(async () => {
    // Fire-and-forget: don't block the UI on this
    api.post("/auth/user/cancel-otp", { phone }).catch(() => {});
    setStep("phone");
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setResendTimer(0);
  }, [phone]);

  return (
    <AuthLayout>
      <Animated.View style={{ opacity: fadeAnim }}>
        {step === "phone" && (
          <View>
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
          </View>
        )}

        {step === "otp" && (
          <View>
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

            <Animated.View style={{ opacity: otpOpacity, transform: [{ translateY: otpTranslateY }], marginBottom: 16 }}>
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
            </Animated.View>

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
          </View>
        )}

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Secure access via Institutional Authentication</Text>
        </View>

      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  headerTextContainer: { alignItems: "center", marginBottom: 32 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: Colors.onSurface, marginBottom: 8, letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, textAlign: "center" },
  
  // Inputs
  inputWrapper: { marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: "500", color: Colors.onSurface, marginBottom: 8, letterSpacing: 0.24 },
  inputFieldContainer: { flexDirection: "row", alignItems: "center", height: 48, borderBottomWidth: 1 },
  inputFieldDefault: { borderBottomColor: Colors.border },
  inputFieldError: { borderBottomColor: Colors.error },
  inputText: { flex: 1, fontSize: 16, color: Colors.onSurface, fontWeight: "500" },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 6, lineHeight: 16 },
  
  phoneInputContainer: { flexDirection: "row", alignItems: "center", height: 48, borderBottomWidth: 1 },
  flagIcon: { fontSize: 20, marginRight: 12 },
  countryCode: { fontSize: 16, color: Colors.onSurface, fontWeight: "500", marginRight: 12 },
  
  otpSentContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: Colors.surfaceContainerLow, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  otpSentLabel: { fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 4 },
  otpSentValue: { fontSize: 16, fontWeight: "600", color: Colors.onSurface },
  editButtonText: { fontSize: 14, fontWeight: "600", color: Colors.primaryContainer },
  
  otpHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  otpLabel: { fontSize: 12, fontWeight: "500", color: Colors.onSurface, letterSpacing: 0.24 },
  resendContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24 },
  resendPromptText: { fontSize: 13, color: Colors.onSurfaceVariant },
  resendText: { fontSize: 13, fontWeight: "600", color: Colors.primaryContainer },
  resendSuccessContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8, gap: 4 },
  resendSuccessText: { fontSize: 12, fontWeight: "500", color: "#2e7d32" },
  
  primaryButton: { width: "100%", height: 52, backgroundColor: Colors.primaryContainer, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 },
  primaryButtonText: { fontSize: 14, fontWeight: "600", color: Colors.onPrimary },

  // ── Bouncing dots loader ──
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  bounceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.onPrimary },
  
  footerContainer: { marginTop: 40, alignItems: "center" },
  footerText: { fontSize: 11, fontWeight: "600", color: Colors.onSurfaceVariant },
});
