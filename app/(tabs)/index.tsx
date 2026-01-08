import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "../../firebase/config";

type BookingItem = {
  id: string;
  userId?: string;
  hostId?: string;
  slotId?: string;

  startAt?: any; // Firestore Timestamp
  endAt?: any;

  status?: "pending" | "approved" | "denied" | "cancelled" | string;

  reason?: string;
  note?: string;

  createdAt?: any;
};

function formatDate(ts: any) {
  const date = ts?.toDate ? ts.toDate() : null;
  if (!date) return "Date not set";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(ts: any) {
  const date = ts?.toDate ? ts.toDate() : null;
  if (!date) return "Time not set";

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStartOfTodayTimestamp() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  return Timestamp.fromDate(start);
}

export default function HomeScreen() {
  const user = auth.currentUser;

  const [profileLoading, setProfileLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(true);

  const [displayName, setDisplayName] = useState<string>("there");
  const [nextBooking, setNextBooking] = useState<BookingItem | null>(null);

  // ✅ Query: get the user's most recent booking that isn't cancelled/denied
  // - We order by createdAt DESC so pending requests show immediately
  // - Then we can display status and (if available) start/end time
  const bookingQuery = useMemo(() => {
    if (!user) return null;

    return query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(1)
    );
  }, [user?.uid]);

  // Load profile name
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);

        if (!user) {
          setDisplayName("there");
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          const firstName = (data.firstName || "").trim();
          setDisplayName(firstName || "there");
        } else {
          setDisplayName("there");
        }
      } catch (e) {
        console.error(e);
        setDisplayName("there");
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user?.uid]);

  // Load latest booking
  useEffect(() => {
    if (!bookingQuery) {
      setBookingLoading(false);
      setNextBooking(null);
      return;
    }

    setBookingLoading(true);

    const unsub = onSnapshot(
      bookingQuery,
      (snap) => {
        if (snap.empty) {
          setNextBooking(null);
          setBookingLoading(false);
          return;
        }

        const d = snap.docs[0];
        const data = { id: d.id, ...(d.data() as any) } as BookingItem;

        // ✅ If it's denied/cancelled, treat as "no upcoming"
        if (data.status === "denied" || data.status === "cancelled") {
          setNextBooking(null);
        } else {
          setNextBooking(data);
        }

        setBookingLoading(false);
      },
      (err) => {
        console.error(err);
        setNextBooking(null);
        setBookingLoading(false);
      }
    );

    return () => unsub();
  }, [bookingQuery]);

  const loading = profileLoading || bookingLoading;

  const statusCopy = (status?: string) => {
    if (!status || status === "pending") return "Your request – Awaiting confirmation ⏳";
    if (status === "approved") return "Upcoming meeting – Confirmed ✅";
    if (status === "denied") return "Request declined ❌";
    if (status === "cancelled") return "Booking cancelled ❌";
    return `Status: ${status}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          {profileLoading ? "Welcome..." : `Welcome, ${displayName} 👋`}
        </Text>

        <Text style={styles.title}>Meet Pastor Randolph</Text>
        <Text style={styles.subtitle}>
          Request a meeting and we’ll confirm your booking as soon as possible.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upcoming</Text>

        {loading ? (
          <View style={styles.rowCenter}>
            <ActivityIndicator />
            <Text style={styles.helperText}>Loading your bookings…</Text>
          </View>
        ) : !nextBooking ? (
          <Text style={styles.cardText}>No meetings scheduled yet.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{statusCopy(nextBooking.status)}</Text>
            </View>

            {/* Show date/time only if startAt/endAt exist */}
            {nextBooking.startAt ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(nextBooking.startAt)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(nextBooking.startAt)} – {formatTime(nextBooking.endAt)}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.cardText}>
                Time will appear here once your slot is confirmed.
              </Text>
            )}

            {nextBooking.reason ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reason</Text>
                <Text style={styles.detailValue}>{nextBooking.reason}</Text>
              </View>
            ) : null}

            {nextBooking.note ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>Your note</Text>
                <Text style={styles.noteText}>{nextBooking.note}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.smallHint}>
        <Text style={styles.smallHintText}>
          Tip: After you request a slot, you’ll see “Awaiting confirmation” here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 18,
  },
  welcome: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },

  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  helperText: {
    color: "#666",
    fontSize: 13,
  },

  pill: {
    alignSelf: "flex-start",
    backgroundColor: "#111",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
    width: 70,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: "#111",
    fontWeight: "800",
    textAlign: "right",
  },

  noteBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },

  smallHint: {
    marginTop: 14,
    paddingHorizontal: 6,
  },
  smallHintText: {
    fontSize: 12,
    color: "#777",
  },
});
