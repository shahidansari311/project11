import { Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { FavoritesProvider } from "../contexts/FavoritesContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../components/Toast";
import { ErrorBoundary } from "../components/ErrorBoundary";
import "../../global.css";

export default function RootLayout() {
  const appState = useRef(AppState.currentState);
  const backgroundTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground
        if (backgroundTimer.current) {
          clearTimeout(backgroundTimer.current);
          backgroundTimer.current = null;
          console.log("App Lifecycle: Returned quickly, cancelled background pause.");
        } else {
          console.log("App Lifecycle: FOREGROUND -> Resuming heavy operations");
        }
      } else if (nextAppState === "background") {
        // App has gone to the background (Point 8, 20)
        console.log("App Lifecycle: BACKGROUND detected, starting 3m grace period...");
        backgroundTimer.current = setTimeout(() => {
          console.log("App Lifecycle: 3m elapsed -> Pausing operations to prevent Battery Drain");
          backgroundTimer.current = null;
        }, 180000); // 3 minutes grace period
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (backgroundTimer.current) clearTimeout(backgroundTimer.current);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <FavoritesProvider>
            <Stack screenOptions={{ headerShown: false }}>
              {/* ── Auth screens ── */}
              <Stack.Screen name="index" options={{ animation: "fade" }} />

              {/* ── Main app (tabs shell) ── */}
              <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />

              {/* ── Property detail — fade animation for shared element transition ── */}
              <Stack.Screen
                name="property/[id]"
                options={{ animation: "fade", gestureEnabled: true }}
              />
              <Stack.Screen
                name="portfolio/[id]"
                options={{ animation: "fade", gestureEnabled: true }}
              />
            </Stack>
          </FavoritesProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
