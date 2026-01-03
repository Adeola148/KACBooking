import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useState } from "react";

export default function BookingScreen() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>KAC Booking</Text>
        <Text style={styles.subtitle}>
          Book a meeting with Apostle Randolph
        </Text>

        <Text style={styles.description}>
          Fill in the form below and a member of the team will confirm your request.
        </Text>

        {/* Full Name */}
        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />

        {/* Contact */}
        <Text style={styles.label}>Contact (email or phone)</Text>
        <TextInput
          style={styles.input}
          placeholder="Email or phone number"
          value={contact}
          onChangeText={setContact}
        />

        {/* Reason */}
        <Text style={styles.label}>Reason for meeting</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Briefly explain the reason"
          value={reason}
          onChangeText={setReason}
          multiline
        />

        {/* Date */}
        <Text style={styles.label}>Preferred date</Text>
        <TextInput
          style={styles.input}
          placeholder="Select a date"
          value={date}
          onChangeText={setDate}
        />

        {/* Submit */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Submit Request</Text>
        </TouchableOpacity>
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
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
