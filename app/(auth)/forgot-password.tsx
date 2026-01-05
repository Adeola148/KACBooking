import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import BackIconButton from "../../components/BackIconButton";
import Toast from "../../components/Toast";
import { auth } from "../../firebase/config";

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [emailFocused, setEmailFocused] = useState(false);

  const emailRef = useRef<TextInput>(null);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  // Shake animation
  const shakeX = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const setError = (msg: string) => {
    setErrorMsg(msg);
    triggerShake();
    showToast(msg, "error");
  };

  const handleReset = async () => {
    if (loading) return;

    Keyboard.dismiss();
    setErrorMsg("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());

      showToast("Reset link sent ✅ (check junk/spam)", "success");
      setTimeout(() => router.back(), 600);
    } catch (error: any) {
      const message =
        error?.code === "auth/user-not-found"
          ? "No user found with that email."
          : error?.message ?? "Reset failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = () => {
    const hasError = !!errorMsg;
    return [
      styles.input,
      emailFocused && styles.inputFocused,
      hasError && styles.inputError,
    ];
  };

  const animatedStyle = useMemo(
    () => ({
      transform: [{ translateX: shakeX }],
    }),
    [shakeX]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.topRow}>
            <BackIconButton onPress={() => router.back()} disabled={loading} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={animatedStyle}>
              <Text style={styles.title}>Reset Password</Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                ref={emailRef}
                placeholder="Enter your email"
                placeholderTextColor="#8A8A8A"
                style={getInputStyle()}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                value={email}
                editable={!loading}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />

              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.hint}>
                We’ll email you a link. If you don’t see it, check spam/junk.
              </Text>
            </Animated.View>
          </ScrollView>

          <Toast
            visible={toastVisible}
            message={toastMessage}
            type={toastType}
            onHide={() => setToastVisible(false)}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topRow: {
    position: "absolute",
    top: 56,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "flex-start",
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 24,
    color: "#000",
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#F7F7F7",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 14,
    color: "#000",
    fontSize: 16,
  },
  inputFocused: {
    borderColor: "#000",
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#D90429",
  },
  errorText: {
    color: "#D90429",
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  hint: {
    marginTop: 12,
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    lineHeight: 18,
  },
});
