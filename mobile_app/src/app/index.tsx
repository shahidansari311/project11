import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";

export default function AuthScreen() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<"login" | "register">("login");
  const [regToken, setRegToken] = useState<string>("");
  const { isGuest, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isGuest) {
      router.replace("/(tabs)/home" as any);
    }
  }, [isLoading, isGuest, router]);

  if (isLoading) {
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
