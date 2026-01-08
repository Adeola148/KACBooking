import { Redirect, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

type GateState = "loading" | "signedOut" | "ready" | "needsProfile";

export default function AuthLayout() {
  const [gate, setGate] = useState<GateState>("loading");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setGate("signedOut");
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          setGate("needsProfile");
          return;
        }

        setGate("ready");
      } catch (e) {
        console.error("AUTH LAYOUT ERROR:", e);
        setGate("signedOut");
      }
    });

    return () => unsub();
  }, []);

  if (gate === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // ✅ If already fully authed, don’t show auth screens
  if (gate === "ready") {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise show auth stack normally
  return <Stack screenOptions={{ headerShown: false }} />;
}
