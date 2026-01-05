import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebase/config";

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const displayName = useMemo(() => {
    const name = user?.displayName?.trim();
    if (name && name.length > 0) return name;

    const email = user?.email?.trim();
    if (email) return email.split("@")[0];

    return "there";
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)");
    } catch (e: any) {
      Alert.alert("Logout failed", e?.message ?? "Please try again.");
    }
  };

  const handleBookMeeting = () => {
    router.push("/(tabs)/explore");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>Welcome, {displayName} 👋</Text>

          <TouchableOpacity onPress={handleLogout} activeOpacity={0.8} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>

        {/* Card 1 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meet Pastor Randolph</Text>
          <Text style={styles.cardText}>
            Book a one-to-one meeting for prayer, guidance, or spiritual direction. A member of the
            team will confirm your request.
          </Text>
        </View>

        {/* Card 2 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Upcoming Meeting</Text>
          <Text style={styles.cardText}>You don’t have any meetings scheduled this week.</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.button} onPress={handleBookMeeting} activeOpacity={0.9}>
          <Text style={styles.buttonText}>Book a Meeting</Text>
        </TouchableOpacity>

        <View style={{ height: 18 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight ?? 12 : 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },

  greeting: {
    flex: 1,
    fontSize: 32,
    fontWeight: "900",
    color: "#111",
  },

  logoutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F1F1F1",
  },
  logoutText: {
    fontWeight: "800",
    color: "#111",
    fontSize: 14,
  },

  card: {
    backgroundColor: "#F7F7F8",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
  },

  button: {
    backgroundColor: "#000",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});
