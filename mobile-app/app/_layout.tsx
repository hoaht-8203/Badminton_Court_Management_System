import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import "@/global.css";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { setBackgroundColorAsync } from "expo-system-ui";
import { Toasts } from "@backpackapp-io/react-native-toast";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const statusBarBg = colorScheme === "dark" ? "#000000" : "#ffffff";
  React.useEffect(() => {
    // Set root background for system surfaces (Android), keeps contrast consistent
    setBackgroundColorAsync(statusBarBg).catch(() => {});
  }, [statusBarBg]);
  return (
    <AuthProvider>
      <StatusBar style="auto" translucent />
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: statusBarBg }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="verify-email" options={{ headerShown: false }} />
          <Stack.Screen
            name="forgot-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="validate-forgot-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="blogs/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="booking-history"
            options={{ headerShown: false }}
          />
        </Stack>
        <Toasts />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
