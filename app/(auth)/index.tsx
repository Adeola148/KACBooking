import { useRouter } from "expo-router";
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AuthHome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
      />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.accent} />
          <Text style={styles.title}>MeetPastor</Text>
          <Text style={styles.subtitle}>
            Log in or create an account to book a meeting.
          </Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.secondaryButton}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.secondaryButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            By continuing, you agree to behave respectfully and keep appointments
            on time.
          </Text>
        </View>

        <Text style={styles.footerText}>Secure • Simple • Trusted</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F7F9", // subtle off-white background for premium feel
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 28, // moves content higher (less empty space)
    paddingBottom: 24,
  },

  header: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  accent: {
    width: 48,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#0A84FF", // iOS blue accent
    marginBottom: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#0A0A0A",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 21,
    color: "#4B5563",
    textAlign: "center",
    maxWidth: 320,
  },

  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#ECEEF2",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2, // Android shadow
  },

  primaryButton: {
    backgroundColor: "#0A0A0A",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  secondaryButton: {
    marginTop: 12,
    backgroundColor: "#F2F3F5",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
  },

  helperText: {
    marginTop: 14,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#6B7280",
    textAlign: "center",
  },

  footerText: {
    marginTop: "auto",
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12.5,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

