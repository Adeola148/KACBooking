import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebase/config";

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSignup = async () => {
    setErrorText(null);

    if (!email || !password || !confirmPassword) {
      setErrorText("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorText("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorText("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/(tabs)");
    } catch {
      setErrorText("Unable to create account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Sign up to book meetings on MeetPastor.
          </Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#000"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#000"
            style={styles.input}
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
          />

          <TextInput
            placeholder="Confirm password"
            placeholderTextColor="#000"
            style={styles.input}
            value={confirmPassword}
            secureTextEntry={!showPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={styles.toggle}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Text style={styles.toggleText}>
              {showPassword ? "Hide password" : "Show password"}
            </Text>
          </TouchableOpacity>

          {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
                <Text style={styles.buttonText}> Creating…</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.link} onPress={() => router.push("/login")}>
            Already have an account? Login
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    color: "#000",
  },
  toggle: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  toggleText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  error: {
    color: "#D32F2F",
    textAlign: "center",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: "#007AFF",
  },
});
