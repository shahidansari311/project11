import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "@/utils/api";
import { Colors } from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const OTP_LENGTH = 6;

/**
 * Register Screen
 * ───────────────
 * Matches the design from files/register/screen.png exactly.
 * – Full Name, Email, Mobile Number fields
 * – 6-digit OTP verification section with auto-advance
 * – Terms checkbox
 * – Sign Up button
 */
export default function RegisterScreen() {
  const router = useRouter();

  // ── Form State ───────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(
    ["", "", "", "", "", ""]
  );
  const [termsAccepted, setTermsAccepted] = useState(false);

  // ── Error State ──────────────────────────────────
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [termsError, setTermsError] = useState("");

  // OTP input refs for auto-advance
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // ── Validation ───────────────────────────────────
  const validateAll = (): boolean => {
    let valid = true;

    // Name
    if (fullName.trim().length === 0) {
      setNameError("Please enter your full name.");
      valid = false;
    } else if (fullName.trim().length < 2) {
      setNameError("Name is too short. Please enter your full name.");
      valid = false;
    } else {
      setNameError("");
    }

    // Email
    if (email.trim().length === 0) {
      setEmailError("Please enter your email address.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("This doesn't look like a valid email. Please check it.");
      valid = false;
    } else {
      setEmailError("");
    }

    // Mobile
    const digits = mobile.replace(/\D/g, "");
    if (digits.length === 0) {
      setMobileError("Please enter your mobile number.");
      valid = false;
    } else if (digits.length < 10) {
      setMobileError("Mobile number is too short. Please enter all 10 digits.");
      valid = false;
    } else if (digits.length > 10) {
      setMobileError("Mobile number is too long. It should be exactly 10 digits.");
      valid = false;
    } else if (!/^[6-9]/.test(digits)) {
      setMobileError("Indian mobile numbers start with 6, 7, 8, or 9.");
      valid = false;
    } else {
      setMobileError("");
    }

    // OTP
    const otpJoined = otpValues.join("");
    if (otpJoined.length === 0) {
      setOtpError("Please enter the verification code sent to your phone.");
      valid = false;
    } else if (otpJoined.length < 6) {
      setOtpError("Verification code must be 6 digits. Please fill all boxes.");
      valid = false;
    } else {
      setOtpError("");
    }

    // Terms
    if (!termsAccepted) {
      setTermsError("You must agree to the Terms and Privacy Policy to sign up.");
      valid = false;
    } else {
      setTermsError("");
    }

    return valid;
  };

  const handleMobileChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 10);
    setMobile(digits);
    if (mobileError) setMobileError("");
  };

  const handleNameChange = (text: string) => {
    setFullName(text);
    if (nameError) setNameError("");
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError("");
  };

  // ── OTP Handlers ─────────────────────────────────
  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otpValues];
    newOtp[index] = text;
    setOtpValues(newOtp);
    if (otpError) setOtpError("");

    // Auto-advance to next input
    if (text.length === 1 && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && otpValues[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── Navigation ───────────────────────────────────
  const navigateToLogin = () => {
    router.back();
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      setMobileError("Please enter a valid 10-digit mobile number first.");
      return;
    }
    try {
      await api.post("/auth/user/send-otp", { phone: mobile });
      setOtpError("OTP sent successfully!"); // Using otpError as a quick status message area for now
    } catch (err: any) {
      setMobileError(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleSignUp = async () => {
    if (!validateAll()) return;
    
    try {
      const response = await api.post("/auth/user/verify-otp", { phone: mobile, otp: otpValues.join("") });
      const { token, refreshToken } = response.data.data;
      
      await SecureStore.setItemAsync("access_token", token);
      await SecureStore.setItemAsync("refresh_token", refreshToken);
      
      router.replace("/home");
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ─── Hero Image (Top 33%) ───────────────────── */}
      <View
        style={{
          width: "100%",
          height: SCREEN_WIDTH * 0.33 + 100,
          position: "relative",
        }}
      >
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD7jZ0K5gCx8MSO2wSH8-dHA30nHbmnzaMbR0wbVU9eM99MsebRJQJ5ZsFmNFGkbX8pinzbT3N48WkYARzAguNtFMyzOpzcqCR4bsRS2LoF1yFg65vC6S5E5aUJG-YYJxg2hRHANuoAD_MM9WxfeU6MY26W6iS21cFHgO6SAusiPmtfI4D5IOcjxYv0lMCN4fM_kgZJpDhomwS61Wi0TpMIRoC9MrW-bx0B6AWmMzDwPNrRCpZmHTsL",
          }}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
          }}
          resizeMode="cover"
        />
        {/* Gradient overlay */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "70%",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />

        {/* Close Button (Top Left) */}
        <TouchableOpacity
          onPress={navigateToLogin}
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 56 : 44,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.85)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18, color: Colors.onSurface }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Form Container ─────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: Colors.surfaceContainerLowest,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            marginTop: -40,
            shadowColor: Colors.onSurface,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 5,
          }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 48,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ──────────────────────────────── */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "600",
                color: Colors.onSurface,
                marginBottom: 8,
                letterSpacing: -0.22,
              }}
            >
              Create an Account
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Colors.onSurfaceVariant,
                lineHeight: 20,
              }}
            >
              Join Silverreal Estate to start investing.
            </Text>
          </View>

          {/* ── Segmented Toggle ────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              padding: 4,
              backgroundColor: Colors.surfaceContainerLowest,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              marginBottom: 24,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: "transparent",
                alignItems: "center",
              }}
              onPress={navigateToLogin}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: Colors.primary,
                }}
              >
                Log In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: Colors.primaryContainer,
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: Colors.onPrimary,
                }}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Full Name ───────────────────────────── */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: Colors.onSurface,
                marginBottom: 8,
                letterSpacing: 0.24,
              }}
            >
              Full Name
            </Text>
            <TextInput
              style={{
                height: 52,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: nameError ? Colors.error : Colors.border,
                backgroundColor: Colors.surfaceContainerLowest,
                fontSize: 14,
                color: Colors.onSurface,
              }}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.outlineVariant}
              value={fullName}
              onChangeText={handleNameChange}
              autoCapitalize="words"
            />
            {nameError ? (
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.error,
                  marginTop: 6,
                  lineHeight: 16,
                }}
              >
                {nameError}
              </Text>
            ) : null}
          </View>

          {/* ── Email Address ───────────────────────── */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: Colors.onSurface,
                marginBottom: 8,
                letterSpacing: 0.24,
              }}
            >
              Email Address
            </Text>
            <TextInput
              style={{
                height: 52,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: emailError ? Colors.error : Colors.border,
                backgroundColor: Colors.surfaceContainerLowest,
                fontSize: 14,
                color: Colors.onSurface,
              }}
              placeholder="name@example.com"
              placeholderTextColor={Colors.outlineVariant}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={handleEmailChange}
            />
            {emailError ? (
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.error,
                  marginTop: 6,
                  lineHeight: 16,
                }}
              >
                {emailError}
              </Text>
            ) : null}
          </View>

          {/* ── Mobile Number ───────────────────────── */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: Colors.onSurface,
                marginBottom: 8,
                letterSpacing: 0.24,
              }}
            >
              Mobile Number
            </Text>
            <View
              style={{
                flexDirection: "row",
                height: 52,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: mobileError ? Colors.error : Colors.border,
                backgroundColor: Colors.surfaceContainerLowest,
                overflow: "hidden",
              }}
            >
              {/* Country code prefix */}
              <View
                style={{
                  paddingHorizontal: 16,
                  justifyContent: "center",
                  borderRightWidth: 1,
                  borderRightColor: mobileError ? Colors.error : Colors.border,
                  backgroundColor: Colors.surfaceContainerLow,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: Colors.onSurfaceVariant,
                    fontWeight: "500",
                  }}
                >
                  +91
                </Text>
              </View>
              <TextInput
                style={{
                  flex: 1,
                  paddingHorizontal: 16,
                  fontSize: 14,
                  color: Colors.onSurface,
                }}
                placeholder="Enter 10-digit number"
                placeholderTextColor={Colors.outlineVariant}
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={handleMobileChange}
              />
            </View>
            {mobileError ? (
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.error,
                  marginTop: 6,
                  lineHeight: 16,
                }}
              >
                {mobileError}
              </Text>
            ) : null}
          </View>

          {/* ── Divider — Security ───────────────────── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 8,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: Colors.divider,
              }}
            />
            <Text
              style={{
                marginHorizontal: 16,
                fontSize: 12,
                fontWeight: "500",
                color: Colors.onSurfaceVariant,
                letterSpacing: 0.24,
              }}
            >
              Security
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: Colors.divider,
              }}
            />
          </View>

          {/* ── OTP Verification Section ────────────── */}
          <View
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: Colors.surfaceContainerLow,
              borderWidth: 1,
              borderColor: "rgba(191,200,204,0.5)",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: Colors.onSurface,
                  letterSpacing: 0.24,
                }}
              >
                Verification Code
              </Text>
              <TouchableOpacity onPress={handleSendOtp}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: Colors.primaryContainer,
                    letterSpacing: 0.24,
                  }}
                >
                  Send OTP
                </Text>
              </TouchableOpacity>
            </View>

            {/* 6 OTP boxes */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => {
                    otpRefs.current[i] = ref;
                  }}
                  style={{
                    flex: 1,
                    height: 56,
                    textAlign: "center",
                    fontSize: 20,
                    fontWeight: "600",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceContainerLowest,
                    color: Colors.onSurface,
                  }}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={otpValues[i]}
                  onChangeText={(text) => handleOtpChange(text, i)}
                  onKeyPress={(e) => handleOtpKeyPress(e, i)}
                  selectTextOnFocus
                />
              ))}
            </View>
          {otpError ? (
            <Text
              style={{
                fontSize: 12,
                color: Colors.error,
                marginTop: 6,
                marginBottom: 8,
                lineHeight: 16,
              }}
            >
              {otpError}
            </Text>
          ) : null}
          </View>

          {/* ── Terms Checkbox ──────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginTop: 8,
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              onPress={() => setTermsAccepted(!termsAccepted)}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: termsAccepted
                  ? Colors.primaryContainer
                  : Colors.border,
                backgroundColor: termsAccepted
                  ? Colors.primaryContainer
                  : Colors.surfaceContainerLowest,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
              }}
              activeOpacity={0.7}
            >
              {termsAccepted && (
                <Text style={{ color: Colors.onPrimary, fontSize: 12, fontWeight: "700" }}>
                  ✓
                </Text>
              )}
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 14,
                lineHeight: 20,
                color: Colors.onSurfaceVariant,
              }}
            >
              I agree to the{" "}
              <Text
                style={{
                  color: Colors.primaryContainer,
                  fontWeight: "500",
                }}
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                style={{
                  color: Colors.primaryContainer,
                  fontWeight: "500",
                }}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
          {termsError ? (
            <Text
              style={{
                fontSize: 12,
                color: Colors.error,
                marginTop: 4,
                marginLeft: 32,
                lineHeight: 16,
              }}
            >
              {termsError}
            </Text>
          ) : null}

          {/* ── Sign Up Button ──────────────────────── */}
          <TouchableOpacity
            style={{
              width: "100%",
              height: 52,
              backgroundColor: Colors.primaryContainer,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 16,
              shadowColor: Colors.onSurface,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={handleSignUp}
            activeOpacity={0.9}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: Colors.onPrimary,
              }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>

          {/* Bottom spacing */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
