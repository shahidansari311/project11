import { Stack } from "expo-router";
import "../../global.css";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* ── Auth screens ── */}
      <Stack.Screen name="index" options={{ animation: "fade" }} />

      {/* ── Main app (tabs shell) ── */}
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />

      {/* ── Property detail — slides up from bottom ── */}
      <Stack.Screen
        name="property/[id]"
        options={{ animation: "slide_from_bottom", gestureEnabled: true }}
      />
    </Stack>
  );
}
