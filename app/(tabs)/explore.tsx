import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/config";

// ✅ IMPORTANT: Replace with Pastor account UID (Firebase Auth UID)
const PASTOR_UID = "PASTOR_UID";

// ✅ Pastor access code (temporary gate)
const ACCESS_CODE = "KAC2025";

// ✅ Avoid string literals inside JSX (prevents text-watcher false warnings)
const SEG = {
  REQUESTS: "requests",
  SLOTS: "slots",
  HISTORY: "history",
} as const;

type SegmentKey = (typeof SEG)[keyof typeof SEG];

type BookingDoc = {
  id: string;
  userId?: string;
  hostId?: string;
  slotId?: string;
  status?: "pending" | "approved" | "denied" | "cancelled" | string;

  firstName?: string;
  surname?: string;
  fullName?: string;
  email?: string;
  contact?: string;

  reason?: string;
  note?: string;
  location?: string;

  startAt?: any;
  endAt?: any;
  createdAt?: any;
};

type SlotDoc = {
  id: string;
  hostId?: string;
  status?: "open" | "pending" | "approved" | "closed" | string;
  location?: string;
  startAt?: any;
  endAt?: any;
  createdAt?: any;
};

type LocationKey = "office" | "unit11" | "unit12" | "main";

const SEGMENTS: Array<{ key: SegmentKey; label: string }> = [
  { key: SEG.REQUESTS, label: "Requests" },
  { key: SEG.SLOTS, label: "Slots" },
  { key: SEG.HISTORY, label: "History" },
];

const LOCATIONS: Array<{ key: LocationKey; label: string }> = [
  { key: "office", label: "Pastor’s Office" },
  { key: "unit11", label: "Unit 11" },
  { key: "unit12", label: "Unit 12" },
  { key: "main", label: "Main Church" },
];

function safeToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts?.toDate) return ts.toDate();
  return null;
}

function formatShort(ts: any) {
  const d = safeToDate(ts);
  if (!d) return "—";
  const day = d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} • ${time}`;
}

function parseDateTime(input: string): Date | null {
  // Accept: "2026-01-06 14:30" OR "2026-01-06T14:30"
  const cleaned = input.trim().replace(" ", "T");
  const d = new Date(cleaned);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default function PastorScreen() {
  // Access
  const [accessCode, setAccessCode] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);

  // Segments
  const [segment, setSegment] = useState<SegmentKey>(SEG.REQUESTS);

  // Data state
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [requests, setRequests] = useState<BookingDoc[]>([]);
  const [slots, setSlots] = useState<SlotDoc[]>([]);
  const [history, setHistory] = useState<BookingDoc[]>([]);

  // Create slot form
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [slotLocationKey, setSlotLocationKey] = useState<LocationKey>("office");
  const [creatingSlot, setCreatingSlot] = useState(false);

  // Approve/Deny working state
  const [workingId, setWorkingId] = useState<string | null>(null);

  const slotLocationLabel =
    LOCATIONS.find((l) => l.key === slotLocationKey)?.label ?? "Pastor’s Office";

  // Queries
  const requestsQuery = useMemo(() => {
    return query(
      collection(db, "bookings"),
      where("hostId", "==", PASTOR_UID),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
  }, []);

  const slotsQuery = useMemo(() => {
    return query(
      collection(db, "slots"),
      where("hostId", "==", PASTOR_UID),
      orderBy("startAt", "asc")
    );
  }, []);

  const historyQuery = useMemo(() => {
    return query(
      collection(db, "bookings"),
      where("hostId", "==", PASTOR_UID),
      where("status", "in", ["approved", "denied", "cancelled"]),
      orderBy("createdAt", "desc")
    );
  }, []);

  // Load Requests
  useEffect(() => {
    if (!isAuthed) return;

    setLoadingRequests(true);
    const unsub = onSnapshot(
      requestsQuery,
      (snap) => {
        const items: BookingDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setRequests(items);
        setLoadingRequests(false);
      },
      (err) => {
        console.error(err);
        setRequests([]);
        setLoadingRequests(false);
      }
    );

    return () => unsub();
  }, [isAuthed, requestsQuery]);

  // Load Slots
  useEffect(() => {
    if (!isAuthed) return;

    setLoadingSlots(true);
    const unsub = onSnapshot(
      slotsQuery,
      (snap) => {
        const items: SlotDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setSlots(items);
        setLoadingSlots(false);
      },
      (err) => {
        console.error(err);
        setSlots([]);
        setLoadingSlots(false);
      }
    );

    return () => unsub();
  }, [isAuthed, slotsQuery]);

  // Load History
  useEffect(() => {
    if (!isAuthed) return;

    setLoadingHistory(true);
    const unsub = onSnapshot(
      historyQuery,
      (snap) => {
        const items: BookingDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setHistory(items);
        setLoadingHistory(false);
      },
      (err) => {
        console.error(err);
        setHistory([]);
        setLoadingHistory(false);
      }
    );

    return () => unsub();
  }, [isAuthed, historyQuery]);

  const handlePastorLogin = () => {
    if (accessCode.trim() === ACCESS_CODE) {
      setIsAuthed(true);
      setAccessCode("");
      setSegment(SEG.REQUESTS);
      return;
    }
    Alert.alert("Incorrect code", "Please try again.");
  };

  const bookingDisplayName = (b: BookingDoc) => {
    const full = (b.fullName || "").trim();
    if (full) return full;

    const first = (b.firstName || "").trim();
    const sur = (b.surname || "").trim();
    const combined = `${first} ${sur}`.trim();
    if (combined) return combined;

    return "Member";
  };

  const approveBooking = async (booking: BookingDoc) => {
    try {
      setWorkingId(booking.id);

      await updateDoc(doc(db, "bookings", booking.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const slotId = booking.slotId;
      if (slotId) {
        const slotRef = doc(db, "slots", slotId);
        const slotSnap = await getDoc(slotRef);
        if (slotSnap.exists()) {
          await updateDoc(slotRef, {
            status: "approved",
            updatedAt: serverTimestamp(),
          });
        }
      }

      Alert.alert("Approved ✅", "Booking approved.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Could not approve booking.");
    } finally {
      setWorkingId(null);
    }
  };

  const denyBooking = async (booking: BookingDoc) => {
    try {
      setWorkingId(booking.id);

      await updateDoc(doc(db, "bookings", booking.id), {
        status: "denied",
        deniedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const slotId = booking.slotId;
      if (slotId) {
        const slotRef = doc(db, "slots", slotId);
        const slotSnap = await getDoc(slotRef);
        if (slotSnap.exists()) {
          await updateDoc(slotRef, {
            status: "open",
            updatedAt: serverTimestamp(),
          });
        }
      }

      Alert.alert("Denied ❌", "Booking denied.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Could not deny booking.");
    } finally {
      setWorkingId(null);
    }
  };

  const createSlot = async () => {
    const startDate = parseDateTime(startInput);
    const endDate = parseDateTime(endInput);

    if (!startDate || !endDate) {
      Alert.alert("Invalid date/time", "Use format: 2026-01-06 14:00");
      return;
    }
    if (endDate <= startDate) {
      Alert.alert("Invalid time range", "End must be after start.");
      return;
    }

    try {
      setCreatingSlot(true);

      await addDoc(collection(db, "slots"), {
        hostId: PASTOR_UID,
        status: "open",
        location: slotLocationLabel,
        startAt: Timestamp.fromDate(startDate),
        endAt: Timestamp.fromDate(endDate),
        createdAt: serverTimestamp(),
      });

      setStartInput("");
      setEndInput("");

      Alert.alert("Slot created ✅", "Your slot is now available for booking.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Could not create slot.");
    } finally {
      setCreatingSlot(false);
    }
  };

  const SegmentedTabs = () => (
    <View style={styles.segmentWrap}>
      {SEGMENTS.map((s) => {
        const active = segment === s.key;
        return (
          <Pressable
            key={s.key}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
            onPress={() => setSegment(s.key)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const RequestsView = () => (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.sectionTitle}>Pending requests</Text>
      <Text style={styles.sectionSubtitle}>Approve or deny new booking requests.</Text>

      {loadingRequests ? (
        <View style={styles.centerRow}>
          <ActivityIndicator />
          <Text style={styles.helperText}>Loading requests…</Text>
        </View>
      ) : requests.length === 0 ? (
        <Text style={styles.emptyText}>No pending requests right now.</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {requests.map((b) => (
            <View key={b.id} style={styles.card}>
              <Text style={styles.cardTitle}>{bookingDisplayName(b)}</Text>

              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Email</Text>
                <Text style={styles.kValue}>{(b.email || "").trim() || "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Contact</Text>
                <Text style={styles.kValue}>{(b.contact || "").trim() || "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>When</Text>
                <Text style={styles.kValue}>
                  {formatShort(b.startAt)} → {formatShort(b.endAt)}
                </Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Reason</Text>
                <Text style={styles.kValue}>{(b.reason || "").trim() || "—"}</Text>
              </View>

              {b.note ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Note</Text>
                  <Text style={styles.noteText}>{b.note}</Text>
                </View>
              ) : null}

              <View style={styles.actionRow}>
                <Pressable
                  style={[
                    styles.actionBtn,
                    styles.approveBtn,
                    workingId === b.id && styles.btnDisabled,
                  ]}
                  onPress={() => approveBooking(b)}
                  disabled={workingId === b.id}
                >
                  {workingId === b.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionText}>Approve</Text>
                  )}
                </Pressable>

                <Pressable
                  style={[
                    styles.actionBtn,
                    styles.denyBtn,
                    workingId === b.id && styles.btnDisabled,
                  ]}
                  onPress={() => denyBooking(b)}
                  disabled={workingId === b.id}
                >
                  <Text style={styles.actionTextDark}>Deny</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const SlotsView = () => (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.sectionTitle}>Availability slots</Text>
      <Text style={styles.sectionSubtitle}>Create and review your available times.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create a new slot</Text>

        <Text style={styles.fieldLabel}>Start (YYYY-MM-DD 14:00)</Text>
        <TextInput
          value={startInput}
          onChangeText={setStartInput}
          placeholder="2026-01-06 14:00"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>End (YYYY-MM-DD 15:00)</Text>
        <TextInput
          value={endInput}
          onChangeText={setEndInput}
          placeholder="2026-01-06 15:00"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Location</Text>

        <View style={styles.pillsRow}>
          {LOCATIONS.map((loc) => {
            const active = slotLocationKey === loc.key;
            return (
              <Pressable
                key={loc.key}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSlotLocationKey(loc.key)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {loc.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.primaryBtn, creatingSlot && styles.btnDisabled]}
          onPress={createSlot}
          disabled={creatingSlot}
        >
          {creatingSlot ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Create Slot</Text>
          )}
        </Pressable>
      </View>

      {loadingSlots ? (
        <View style={styles.centerRow}>
          <ActivityIndicator />
          <Text style={styles.helperText}>Loading slots…</Text>
        </View>
      ) : slots.length === 0 ? (
        <Text style={styles.emptyText}>No slots yet. Create one above.</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {slots.map((s) => (
            <View key={s.id} style={styles.card}>
              <Text style={styles.cardTitle}>Slot</Text>

              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Start</Text>
                <Text style={styles.kValue}>{formatShort(s.startAt)}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>End</Text>
                <Text style={styles.kValue}>{formatShort(s.endAt)}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Location</Text>
                <Text style={styles.kValue}>{(s.location || "").trim() || "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Status</Text>
                <Text style={styles.kValue}>{(s.status || "open").toString()}</Text>
              </View>

              <Text style={styles.mutedSmall}>ID: {s.id}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const HistoryView = () => (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.sectionTitle}>Past decisions</Text>
      <Text style={styles.sectionSubtitle}>Approved/denied bookings appear here.</Text>

      {loadingHistory ? (
        <View style={styles.centerRow}>
          <ActivityIndicator />
          <Text style={styles.helperText}>Loading history…</Text>
        </View>
      ) : history.length === 0 ? (
        <Text style={styles.emptyText}>No history yet.</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {history.map((b) => (
            <View key={b.id} style={styles.card}>
              <Text style={styles.cardTitle}>{bookingDisplayName(b)}</Text>

              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Status</Text>
                <Text style={styles.kValue}>{(b.status || "—").toString()}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>When</Text>
                <Text style={styles.kValue}>
                  {formatShort(b.startAt)} → {formatShort(b.endAt)}
                </Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Reason</Text>
                <Text style={styles.kValue}>{(b.reason || "").trim() || "—"}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (!isAuthed) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled">
            <Text style={styles.bigTitle}>Pastor Dashboard</Text>
            <Text style={styles.bigSubtitle}>Enter access code to manage slots and requests.</Text>

            <Text style={styles.fieldLabel}>Access code</Text>
            <TextInput
              value={accessCode}
              onChangeText={setAccessCode}
              placeholder="Enter code"
              placeholderTextColor="#999"
              style={styles.input}
              secureTextEntry
            />

            <Pressable style={styles.primaryBtn} onPress={handlePastorLogin}>
              <Text style={styles.primaryBtnText}>Login</Text>
            </Pressable>

            <Text style={styles.mutedSmall}>
              For testing: <Text style={{ fontWeight: "900" }}>{ACCESS_CODE}</Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.bigTitle}>Welcome, Pastor Randolph</Text>
        <Text style={styles.bigSubtitle}>Manage requests, slots and history.</Text>

        <SegmentedTabs />

        {/* ✅ No string literals inside JSX now */}
        {segment === SEG.REQUESTS ? <RequestsView /> : null}
        {segment === SEG.SLOTS ? <SlotsView /> : null}
        {segment === SEG.HISTORY ? <HistoryView /> : null}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  authWrap: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    justifyContent: "center",
  },

  container: { padding: 20, paddingTop: 26 },

  bigTitle: { fontSize: 28, fontWeight: "900", color: "#111", marginBottom: 6 },
  bigSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },

  segmentWrap: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    padding: 6,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  segmentBtnActive: { backgroundColor: "#111" },
  segmentText: { fontSize: 13, fontWeight: "900", color: "#111" },
  segmentTextActive: { color: "#fff" },

  sectionTitle: { fontSize: 18, fontWeight: "900", marginBottom: 6, color: "#111" },
  sectionSubtitle: { fontSize: 13, color: "#666", lineHeight: 18, marginBottom: 12 },

  card: { backgroundColor: "#F4F4F4", borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111", marginBottom: 10 },

  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  kLabel: { fontSize: 13, color: "#666", fontWeight: "800", width: 70 },
  kValue: { flex: 1, textAlign: "right", fontSize: 13, color: "#111", fontWeight: "800" },

  noteBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginTop: 6,
  },
  noteTitle: { fontSize: 12, fontWeight: "900", color: "#111", marginBottom: 4 },
  noteText: { fontSize: 13, color: "#333", lineHeight: 18 },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  approveBtn: { backgroundColor: "#111" },
  denyBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#111" },
  actionText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  actionTextDark: { color: "#111", fontSize: 14, fontWeight: "900" },

  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#111",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  fieldLabel: { fontSize: 13, fontWeight: "800", color: "#111", marginBottom: 6 },

  primaryBtn: {
    backgroundColor: "#111",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },

  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  pillActive: { backgroundColor: "#111", borderColor: "#111" },
  pillText: { fontSize: 12, fontWeight: "900", color: "#111" },
  pillTextActive: { color: "#fff" },

  centerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  helperText: { fontSize: 13, color: "#666", fontWeight: "700" },

  emptyText: { fontSize: 13, color: "#666", lineHeight: 18, marginTop: 8, fontWeight: "700" },

  mutedSmall: { marginTop: 10, fontSize: 12, color: "#777", lineHeight: 16 },

  btnDisabled: { opacity: 0.6 },
});
