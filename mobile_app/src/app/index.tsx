import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import SplashScreen from "@/pages/Splash";

let hasAppLaunched = false;

export default function AuthScreen() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<"login" | "register">("login");
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

  // Show Splash Screen if auth is still loading, OR if minimum timer hasn't finished
  if (isLoading || !isSplashFinished) {
    return <SplashScreen />;
  }

  if (activePage === "login") {
    return (
      <LoginPage 
        onRegisterRequired={(token) => {
          setRegToken(token);
          setActivePage("register");
        }} 
      />
    );
  }

  return (
    <RegisterPage 
      registrationToken={regToken}
      onGoBackToLogin={() => setActivePage("login")} 
    />
  );
}
