import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../firebase/config";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          setFirstName(snap.data().firstName || "");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.greeting}>
        Welcome, {firstName || "there"} 👋
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meet Pastor Randolph</Text>
        <Text style={styles.cardText}>
          Book a one-to-one meeting for prayer, guidance, or spiritual direction.
          A member of the team will confirm your request.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Upcoming Meeting</Text>
        <Text style={styles.cardText}>
          You don’t have any meetings scheduled this week.
        </Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Book a Meeting</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#000",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
