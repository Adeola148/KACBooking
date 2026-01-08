import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

// ✅ Use RELATIVE import to avoid Metro alias resolution issues
import BackIconButton from "../../components/BackIconButton";

export default function Signup() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(() => {
    if (!firstName.trim()) return false;
    if (!surname.trim()) return false;
    if (!email.trim()) return false;
    if (password.length < 8) return false;
    if (password !== confirmPassword) return false;
    return true;
  }, [firstName, surname, email, password, confirmPassword]);

  const handleSignup = async () => {
    setErrorMsg("");

    if (!canSubmit) {
      setErrorMsg("Please complete all fields correctly.");
      return;
    }

    try {
      setLoading(true);

      // 1) Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = cred.user;

      // 2) Store displayName on Auth profile (optional)
      await updateProfile(user, {
        displayName: `${firstName.trim()} ${surname.trim()}`,
      });

      // 3) Store profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName: firstName.trim(),
        surname: surname.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
      });

      // 4) Go to tabs
      router.replace("/(tabs)");
    } catch (err: any) {
      console.log("SIGNUP ERROR:", err);

      const msg =
        err?.code === "auth/email-already-in-use"
          ? "This email is already in use. Try logging in instead."
          : err?.code === "auth/invalid-email"
          ? "That email address looks invalid."
          : err?.code === "auth/weak-password"
          ? "Password is too weak. Use at least 8 characters."
          : err?.message || "Signup failed. Please try again.";

      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ✅ Header row with Back button */}
        <View style={styles.headerRow}>
          <BackIconButton />
          <Text style={styles.headerTitle}>Sign Up</Text>
          <View style={{ width: 34 }} />
        </View>

        <Text style={styles.subtitle}>
          Create an account to book meetings on MeetPastor.
        </Text>

        <Text style={styles.label}>First name</Text>
        <TextInput
          placeholder="John"
          placeholderTextColor="#999"
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={styles.label}>Surname</Text>
        <TextInput
          placeholder="Doe"
          placeholderTextColor="#999"
          style={styles.input}
          value={surname}
          onChangeText={setSurname}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="example@email.com"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password (min 8 characters)</Text>
        <TextInput
          placeholder="••••••••"
          placeholderTextColor="#999"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Re-enter password</Text>
        <TextInput
          placeholder="••••••••"
          placeholderTextColor="#999"
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.link} onPress={() => router.push("/login")}>
          Already have an account? Login
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    color: "#000",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 18,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  error: {
    marginTop: 8,
    color: "#B00020",
    fontSize: 14,
    fontWeight: "600",
  },
  link: {
    marginTop: 18,
    textAlign: "center",
    color: "#007AFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
