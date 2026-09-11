import { useState, useEffect, useRef } from "react";
import { View } from "react-native";
import { Colors } from "@/constants/colors";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

import LoginPage from "@/pages/Login";
import OtpPage from "@/pages/Otp";
import SplashScreen from "@/pages/Splash";

let hasAppLaunched = false;

export default function AuthScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [activePage, setActivePage] = useState<"login" | "otp">("login");
  const [phoneForOtp, setPhoneForOtp] = useState<string>("");
  const { isGuest, isLoading, userProfile } = useAuth();
  
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Wait until Auth Check is done
    if (!isLoading && !hasNavigated.current) {
      hasAppLaunched = true;
      if (!isGuest) {
        hasNavigated.current = true;
        // Logged in -> Route back to previous page or default role page
        if (returnTo) {
          router.replace(returnTo as any);
        } else if (userProfile?.role === "BUILDER") {
          router.replace("/(tabs)/builder-live" as any);
        } else {
          router.replace("/(tabs)/home" as any);
        }
      }
    }
  }, [isLoading, isGuest, userProfile, router, returnTo]);

  // Show Splash Screen ONLY on first app launch while auth state is resolving
  const isInitialLoading = isLoading && !hasAppLaunched;
  
  if (isInitialLoading) {
    return <SplashScreen />;
  }
  
  if (!isGuest) {
    // Already logged in, waiting for router.replace to kick in. Return blank screen to avoid flashing login or splash again.
    return <View style={{ flex: 1, backgroundColor: Colors.surface }} />;
  }

  return (
    <>
      {activePage === "login" && (
        <LoginPage 
          initialPhone={phoneForOtp}
          onSendOtp={(phone) => {
            setPhoneForOtp(phone);
            setActivePage("otp");
          }} 
        />
      )}
      {activePage === "otp" && (
        <OtpPage
          phone={phoneForOtp}
          onRegisterRequired={(token) => {
            setActivePage("login"); // Reset state so hardware back goes to login
            setPhoneForOtp(""); // Clear phone number too
            router.push({ pathname: "/register", params: { token } });
          }}
          onGoBack={() => setActivePage("login")}
        />
      )}
    </>
  );
}
