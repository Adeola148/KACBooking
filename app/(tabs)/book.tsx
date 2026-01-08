import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../../firebase/config";

const PASTOR_UID = "PASTOR_UID"; // replace later

const REASONS = [
  "Prayer",
  "Counselling",
  "Birthday prayer",
  "Career guidance",
  "Family matter",
  "Other",
];

type SlotItem = {
  id: string;
  startAt?: any;
  endAt?: any;
  status?: string;
  hostId?: string;
  location?: string;
};

function formatDateTime(ts: any) {
  const date = ts?.toDate ? ts.toDate() : null;
  if (!date) return "Unknown";

  const day = date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const time = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${day} • ${time}`;
}

export default function BookScreen() {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const slotsQuery = useMemo(() => {
    return query(
      collection(db, "slots"),
      where("status", "==", "open"),
      orderBy("startAt", "asc")
    );
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      slotsQuery,
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setSlots(items);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [slotsQuery]);

  const submitRequest = async () => {
    if (!selectedSlot) return;

    if (!reason) {
      Alert.alert("Missing reason", "Please select a reason for the meeting.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login required");
      return;
    }

    try {
      setSending(true);

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const profile = userSnap.exists() ? (userSnap.data() as any) : {};

      const firstName = String(profile.firstName || "").trim();
      const surname = String(profile.surname || "").trim();
      const email = String(profile.email || user.email || "").trim();
      const fullName = `${firstName} ${surname}`.trim() || "Unknown";

      const bookingId = `${selectedSlot.id}_${user.uid}`;

      await setDoc(doc(db, "bookings", bookingId), {
        userId: user.uid,
        hostId: selectedSlot.hostId || PASTOR_UID,
        slotId: selectedSlot.id,

        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
        location: selectedSlot.location || "Pastor’s Office",

        status: "pending",

        firstName,
        surname,
        fullName,
        email,

        reason,
        note,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "slots", selectedSlot.id), {
        status: "pending",
        updatedAt: serverTimestamp(),
      });

      Alert.alert("Request sent", "Your meeting request has been sent.");

      setSelectedSlot(null);
      setReason("");
      setNote("");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.message || "Failed to send request.");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book a Meeting</Text>
      <Text style={styles.subtitle}>
        Select an available time slot to request a meeting.
      </Text>

      {loading ? (
        <ActivityIndicator />
      ) : slots.length === 0 ? (
        <Text style={styles.empty}>No slots available.</Text>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Available Slot</Text>
              <Text>{formatDateTime(item.startAt)}</Text>
              <Text>{formatDateTime(item.endAt)}</Text>

              <Pressable
                style={styles.requestBtn}
                onPress={() => setSelectedSlot(item)}
              >
                <Text style={styles.requestText}>Request this slot</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      {/* REQUEST MODAL */}
      <Modal visible={!!selectedSlot} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request meeting</Text>

            <Text style={styles.modalLabel}>Reason</Text>
            {REASONS.map((r) => (
              <Pressable
                key={r}
                style={[
                  styles.reasonOption,
                  reason === r && styles.reasonSelected,
                ]}
                onPress={() => setReason(r)}
              >
                <Text>{r}</Text>
              </Pressable>
            ))}

            <Text style={styles.modalLabel}>Extra information (optional)</Text>
            <TextInput
              style={styles.textArea}
              value={note}
              onChangeText={setNote}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setSelectedSlot(null)}
                disabled={sending}
              >
                <Text>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.confirmBtn}
                onPress={submitRequest}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "900" }}>
                    Send request
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#666", marginBottom: 12 },
  empty: { marginTop: 30, textAlign: "center" },

  card: {
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontWeight: "800", marginBottom: 6 },
  requestBtn: {
    marginTop: 12,
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  requestText: { color: "#fff", fontWeight: "900" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "900", marginBottom: 12 },
  modalLabel: { fontWeight: "700", marginTop: 10, marginBottom: 6 },

  reasonOption: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#EEE",
    marginBottom: 6,
  },
  reasonSelected: {
    backgroundColor: "#CDEAFE",
  },

  textArea: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#EEE",
    borderRadius: 10,
  },
  confirmBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 10,
  },
});
