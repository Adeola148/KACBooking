import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

function AuthGate() {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    // If not logged in and trying to access tabs → send to auth home
    if (!user && inTabsGroup) {
      router.replace("/(auth)");
      return;
    }

    // If logged in and trying to access auth pages → send to tabs home
    if (user && inAuthGroup) {
      router.replace("/(tabs)");
      return;
    }
  }, [user, initializing, segments, router]);

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <BookingProvider>
          {/* ✅ This enforces redirects based on auth */}
          <AuthGate />

          <Stack screenOptions={{ headerShown: false }}>
            {/* Route groups */}
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />

            {/* Optional modal */}
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          </Stack>

          <StatusBar style="auto" />
        </BookingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    zIndex: 999,
  },
});
