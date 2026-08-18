/**
 * (tabs)/_layout.tsx — The universal persistent app shell
 * ──────────────────────────────────────────────────────────
 * This is the ONLY place that renders AppHeader and AppTabBar.
 * They are mounted once and never unmount when switching tabs.
 *
 * Layout:
 *   <SafeAreaView>
 *     <AppHeader />              ← fixed, never re-renders
 *     <Stack> (tab content) </Stack>   ← only the content swaps
 *     <AppTabBar />              ← fixed, never re-renders
 *   </SafeAreaView>
 */

import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { Colors } from "@/constants/colors";
import { authService } from "../../services/auth.service";

import AppHeader from "@/components/layout/AppHeader";
import AppTabBar from "@/components/layout/AppTabBar";

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isGuest, setIsGuest] = useState(true);
  const [userProfileUrl, setUserProfileUrl] = useState<string | null>(null);

  // Determine which tab is currently active from the URL segments.
  // segments looks like: ["(tabs)", "home"] or ["(tabs)", "profile"]
  const activeRouteName = segments[segments.length - 1] ?? "home";

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("refresh_token");
      if (!token) {
        setIsGuest(true);
        return;
      }
      setIsGuest(false);

      // Fetch profile to get image for header/tabbar
      const res = await authService.getProfile();
      if (res && res.data && res.data.profileUrl) {
        setUserProfileUrl(res.data.profileUrl);
      }
    } catch {
      // If fetching fails, fallback to generic icons
      setIsGuest(true);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleTabPress = useCallback(
    (routeName: string) => {
      if (routeName === activeRouteName) return;
      router.navigate(`/(tabs)/${routeName}` as any);
    },
    [router, activeRouteName]
  );

  const handleProfilePress = useCallback(() => {
    router.navigate("/(tabs)/profile" as any);
  }, [router]);

  const handleLoginPress = useCallback(() => {
    router.replace("/");
  }, [router]);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Persistent Header — never unmounts ── */}
      <AppHeader
        isGuest={isGuest}
        userProfileUrl={userProfileUrl}
        onLoginPress={handleLoginPress}
        onProfilePress={handleProfilePress}
      />

      {/* ── Tab Content — only this area swaps ── */}
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false, animation: "none" }}>
          <Stack.Screen name="home" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="profile" />
        </Stack>
      </View>

      {/* ── Persistent Tab Bar — never unmounts ── */}
      {!isGuest && (
        <AppTabBar
          activeRouteName={activeRouteName}
          userProfileUrl={userProfileUrl}
          onTabPress={handleTabPress}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
  },
});
