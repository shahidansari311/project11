import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Colors } from "@/constants/colors";

import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";

export default function AuthScreen() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<"login" | "register">("login");
  const [regToken, setRegToken] = useState<string>("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("refresh_token");
        if (token) {
          router.replace("/(tabs)/home" as any);
          return;
        }
      } catch (e) {
        // ignore errors reading from secure store
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
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
