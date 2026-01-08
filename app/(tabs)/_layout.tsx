import { Redirect, Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type GateState = "loading" | "signedOut" | "needsProfile" | "ready";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const [gate, setGate] = useState<GateState>("loading");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setGate("signedOut");
          return;
        }

        // ✅ must have users/{uid} profile
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          setGate("needsProfile");
          return;
        }

        setGate("ready");
      } catch (e) {
        console.error("AUTH GATE ERROR:", e);
        setGate("signedOut");
      }
    });

    return () => unsub();
  }, []);

  // ✅ Smooth loading screen while we check auth/profile
  if (gate === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // ✅ Not logged in? -> go auth home
  if (gate === "signedOut") {
    return <Redirect href="/(auth)" />;
  }

  // ✅ Logged in but profile missing? -> force signup screen (or you can create a /complete-profile later)
  if (gate === "needsProfile") {
    return <Redirect href="/(auth)/signup" />;
  }

  // ✅ Allowed into the app
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="book"
        options={{
          title: "Book",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Pastor",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.crop.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
