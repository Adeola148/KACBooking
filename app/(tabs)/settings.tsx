import { useRouter } from "expo-router";
import { deleteUser, signOut } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebase/config";

export default function SettingsScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(false);

  // 🔴 DEV FORCE LOGOUT (TEMP)
  const devLogout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      router.replace("/(auth)");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to log out");
    } finally {
      setLoading(false);
    }
  };

  // ❗ Real delete account (already works)
  const handleDeleteAccount = async () => {
    if (!user) return;

    Alert.alert(
      "Delete account",
      "This permanently deletes your account. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteUser(user);
              router.replace("/(auth)");
            } catch (err: any) {
              Alert.alert(
                "Re-login required",
                "Please log out and log back in, then retry."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      {/* 🔴 TEMP DEV BUTTON */}
      <TouchableOpacity
        style={[styles.devButton, loading && { opacity: 0.6 }]}
        onPress={devLogout}
        disabled={loading}
      >
        <Text style={styles.devText}>
          DEV: Reset session (Log out)
        </Text>
      </TouchableOpacity>

      {/* REAL DELETE */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.deleteText}>Delete account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  devButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  devText: {
    color: "#fff",
    fontWeight: "700",
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "red",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteText: {
    color: "red",
    fontWeight: "600",
  },
});
