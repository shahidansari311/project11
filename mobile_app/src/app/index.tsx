import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

import AuthLayout from "@/components/AuthLayout";
import LoginPage from "@/pages/Login";
import OtpPage from "@/pages/Otp";
import RegisterPage from "@/pages/Register";
import SplashScreen from "@/pages/Splash";

let hasAppLaunched = false;

export default function AuthScreen() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<"login" | "otp" | "register">("login");
  const [phoneForOtp, setPhoneForOtp] = useState<string>("");
  const [regToken, setRegToken] = useState<string>("");
  const { isGuest, isLoading } = useAuth();
  const [isSplashFinished, setIsSplashFinished] = useState(hasAppLaunched);

  // Enforce a minimum display time for the splash screen
  useEffect(() => {
    if (hasAppLaunched) return;

    const timer = setTimeout(() => {
      hasAppLaunched = true;
      setIsSplashFinished(true);
    }, 2500); // 2.5 seconds
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Wait until both Auth Check is done AND Splash Timer has finished
    if (!isLoading && isSplashFinished) {
      if (!isGuest) {
        // Logged in -> Route to Main App
        router.replace("/(tabs)/home" as any);
      }
    }
  }, [isLoading, isGuest, isSplashFinished, router]);

  // Show Splash Screen ONLY on first app launch while auth state is resolving
  const isInitialLoading = isLoading && !hasAppLaunched;
  
  if (isInitialLoading || !isSplashFinished) {
    return <SplashScreen />;
  }

  return (
    <AuthLayout>
      {activePage === "login" && (
        <LoginPage 
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
            setRegToken(token);
            setActivePage("register");
          }}
          onGoBack={() => setActivePage("login")}
        />
      )}
      {activePage === "register" && (
        <RegisterPage 
          registrationToken={regToken}
          onGoBackToLogin={() => setActivePage("login")} 
        />
      )}
    </AuthLayout>
  );
}
