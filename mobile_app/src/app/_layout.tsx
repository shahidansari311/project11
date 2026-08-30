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

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground
        console.log("App Lifecycle: FOREGROUND -> Resuming heavy operations");
      } else if (nextAppState === "background") {
        // App has gone to the background (Point 8, 20)
        console.log("App Lifecycle: BACKGROUND -> Pausing operations to prevent Battery Drain");
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
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
            </Stack>
          </FavoritesProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
