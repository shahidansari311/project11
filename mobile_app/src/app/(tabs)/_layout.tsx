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

import { useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, StatusBar, BackHandler } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAuth } from "../../contexts/AuthContext";

import AppHeader from "@/components/layout/AppHeader";
import AppTabBar from "@/components/layout/AppTabBar";

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isGuest, userProfile } = useAuth();
  const userProfileUrl = userProfile?.profileUrl || null;

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Determine which tab is currently active from the URL segments.
  // segments looks like: ["(tabs)", "home"] or ["(tabs)", "builder-live"]
  const activeRouteName = segments[segments.length - 1] ?? "home";
  const tabHistoryRef = useRef<string[]>([activeRouteName]);

  // Track tab history whenever activeRouteName changes
  useEffect(() => {
    const history = tabHistoryRef.current;
    if (history[history.length - 1] !== activeRouteName) {
      history.push(activeRouteName);
    }
  }, [activeRouteName]);

  // Handle hardware back button
  useEffect(() => {
    const onBackPress = () => {
      const isBuilder = userProfile?.role === "BUILDER";
      const homeTab = isBuilder ? "builder-live" : "home";

      // If user is on the root Home/Live tab, back exits the app
      if (activeRouteName === homeTab) {
        BackHandler.exitApp();
        return true;
      }

      // Pop active route from history stack
      const history = tabHistoryRef.current;
      while (history.length > 0 && history[history.length - 1] === activeRouteName) {
        history.pop();
      }

      // Navigate to previous tab or default homeTab
      const prevTab = history.pop();
      if (prevTab && prevTab !== activeRouteName) {
        router.navigate(`/(tabs)/${prevTab}` as any);
      } else {
        router.navigate(`/(tabs)/${homeTab}` as any);
      }
      return true;
    };

    const backSub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backSub.remove();
  }, [activeRouteName, userProfile?.role, router]);

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

  const pathname = usePathname();

  const handleLoginPress = useCallback(() => {
    router.replace({ pathname: "/", params: { returnTo: pathname } });
  }, [router, pathname]);

  // Guests are allowed to browse the home screen.
  // Certain features like Portfolio or Profile will prompt them to log in when interacted with.

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Persistent Header — never unmounts ── */}
      <AppHeader
        isGuest={isGuest}
        role={userProfile?.role}
        userProfileUrl={userProfileUrl}
        onLoginPress={handleLoginPress}
        onProfilePress={handleProfilePress}
      />

      {/* ── Tab Content — only this area swaps ── */}
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false, animation: "none" }}>
          <Stack.Screen name="home" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="explore" />
          <Stack.Screen name="portfolio" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="builder-live" />
          <Stack.Screen name="builder-pending" />
          <Stack.Screen name="builder-drafts" />
          <Stack.Screen name="builder-rejected" />
          <Stack.Screen name="builder-add" />
        </Stack>
      </View>

      {/* ── Persistent Tab Bar — hidden when keyboard is open ── */}
      {!isKeyboardVisible && (
        <AppTabBar
          activeRouteName={activeRouteName}
          userProfileUrl={userProfileUrl}
          role={userProfile?.role}
          isGuest={isGuest}
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
