import { useState, useEffect, useRef } from "react";
import { View } from "react-native";
import { Colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

import LoginPage from "@/pages/Login";
import OtpPage from "@/pages/Otp";
import SplashScreen from "@/pages/Splash";

let hasAppLaunched = false;

export default function AuthScreen() {
  const router = useRouter();
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
        // Logged in -> Route to Main App based on role
        if (userProfile?.role === "BUILDER") {
          router.replace("/(tabs)/builder-live" as any);
        } else {
          router.replace("/(tabs)/home" as any);
        }
      }
    }
  }, [isLoading, isGuest, userProfile, router]);

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
            router.push({ pathname: "/register", params: { token } });
          }}
          onGoBack={() => setActivePage("login")}
        />
      )}
    </>
  );
}
