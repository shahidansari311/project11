import React from "react";
import { View, Text, StatusBar, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

/**
 * Home Screen — Simple landing after Login / Register
 */
export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace("/");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.surfaceContainerLowest,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surfaceContainerLowest} />
      <Text
        style={{
          fontSize: 22,
          fontWeight: "600",
          color: Colors.onSurface,
          letterSpacing: -0.2,
          marginBottom: 32,
        }}
      >
        Logged In ✓
      </Text>

      <TouchableOpacity
        onPress={handleLogout}
        style={{
          paddingVertical: 14,
          paddingHorizontal: 32,
          backgroundColor: Colors.primaryContainer,
          borderRadius: 12,
        }}
        activeOpacity={0.9}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: Colors.onPrimary,
          }}
        >
          Log Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
