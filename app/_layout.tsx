import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect, useState } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { auth } from "../firebase/config";
import { BookingProvider } from "./context/BookingContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // ✅ Single auth listener (ONLY here)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // ✅ Single redirect logic (ONLY here)
  useEffect(() => {
    // Wait until navigation is mounted and auth check finished
    if (!navigationState?.key) return;
    if (!authReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    // Not logged in -> force auth
    if (!user && !inAuthGroup) {
      router.replace("/(auth)");
      return;
    }

    // Logged in -> block auth screens
    if (user && inAuthGroup) {
      router.replace("/(tabs)");
      return;
    }
  }, [authReady, user, segments, navigationState?.key, router]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <BookingProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
        </Stack>
        <StatusBar style="auto" />
      </BookingProvider>
    </ThemeProvider>
  );
}
