import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
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
import { auth } from "../../firebase/config";

export default function Signup() {
  const router = useRouter();

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation helpers
  const minPasswordLen = 8;

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length > 0 &&
      surname.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= minPasswordLen &&
      confirmPassword.length >= minPasswordLen &&
      password === confirmPassword &&
      !loading
    );
  }, [firstName, surname, email, password, confirmPassword, loading]);

  const handleSignup = async () => {
    if (loading) return;

    const f = firstName.trim();
    const s = surname.trim();
    const e = email.trim();

    if (!f || !s) {
      alert("Please enter your first name and surname.");
      return;
    }

    if (!e) {
      alert("Please enter your email.");
      return;
    }

    if (password.length < minPasswordLen) {
      alert(`Password must be at least ${minPasswordLen} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1) Create the user
      const cred = await createUserWithEmailAndPassword(auth, e, password);

      // 2) Save name on the Firebase Auth user profile
      await updateProfile(cred.user, {
        displayName: `${f} ${s}`,
      });

      // 3) Go into the app
      router.replace("/(tabs)");
    } catch (error: any) {
      alert(error?.message ?? "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to book meetings on MeetPastor.</Text>

          <View style={styles.card}>
            {/* First Name */}
            <Text style={styles.label}>First Name</Text>
            <TextInput
              placeholder="Jonathan"
              placeholderTextColor="#9AA0A6"
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              editable={!loading}
            />

            {/* Surname */}
            <Text style={styles.label}>Surname</Text>
            <TextInput
              placeholder="Smith"
              placeholderTextColor="#9AA0A6"
              style={styles.input}
              value={surname}
              onChangeText={setSurname}
              autoCapitalize="words"
              editable={!loading}
            />

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="jono.3k@gmail.com"
              placeholderTextColor="#9AA0A6"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder={`Min ${minPasswordLen} characters`}
              placeholderTextColor="#9AA0A6"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
            />

            {/* Confirm Password */}
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              placeholder="Re-enter password"
              placeholderTextColor="#9AA0A6"
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
            />

            {/* Show password */}
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              disabled={loading}
              style={styles.showRow}
            >
              <Text style={styles.showText}>
                {showPassword ? "Hide password" : "Show password"}
              </Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.button, !canSubmit ? styles.buttonDisabled : null]}
              onPress={handleSignup}
              disabled={!canSubmit}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Login link */}
            <Text style={styles.link} onPress={() => router.push("/login")}>
              Already have an account? Login
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    justifyContent: "center",
  },

  container: {
    width: "100%",
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#111",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 18,
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#F7F7F8",
    borderRadius: 20,
    padding: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    fontSize: 16,
    color: "#111",
  },

  showRow: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 14,
  },

  showText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 6,
  },

  buttonDisabled: {
    opacity: 0.35,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },

  link: {
    marginTop: 18,
    textAlign: "center",
    color: "#007AFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
