import { Stack } from "expo-router";
import "../../global.css";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="home"
        options={{
          animation: "fade",
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
