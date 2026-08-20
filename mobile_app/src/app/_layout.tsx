import { Stack } from "expo-router";
import { FavoritesProvider } from "../contexts/FavoritesContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../components/Toast";
import "../../global.css";

export default function RootLayout() {
  return (
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
  );
}
