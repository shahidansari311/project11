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
      <Stack.Screen 
        name="index" 
        options={{ animation: "fade" }} 
      />
      <Stack.Screen
        name="home"
        options={{
          animation: "fade",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="property/[id]"
        options={{
          animation: "slide_from_bottom",
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
