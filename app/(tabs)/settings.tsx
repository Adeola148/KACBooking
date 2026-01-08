import { useRouter } from "expo-router";
import { deleteUser, signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../../firebase/config";

type UserProfile = {
  firstName?: string;
  surname?: string;
  email?: string;
  phone?: string;
};

async function deleteUserBookings(uid: string) {
  // Delete ALL bookings that belong to the user
  const q = query(collection(db, "bookings"), where("userId", "==", uid));
  const snap = await getDocs(q);

  if (snap.empty) return;

  // Firestore batch limit is 500 ops per batch
  let batch = writeBatch(db);
  let opCount = 0;

  for (const d of snap.docs) {
    batch.delete(d.ref);
    opCount++;

    if (opCount === 450) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }
}

export default function SettingsScreen() {
  const router = useRouter();

  const user = auth.currentUser;
  const uid = user?.uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const email = user?.email ?? "—";

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = useMemo(
    () => confirmText.trim().toUpperCase() === "DELETE",
    [confirmText]
  );

  useEffect(() => {
    const loadProfile = async () => {
      if (!uid) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) setProfile(snap.data() as UserProfile);
        else setProfile(null);
      } catch (e) {
        console.error(e);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [uid]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);

      // AuthGate will redirect too, but this makes it instant
      router.replace("/(auth)");
    } catch (e: any) {
      Alert.alert("Logout failed", e?.message ?? "Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!uid || !auth.currentUser) {
      Alert.alert("No user", "You must be logged in to delete an account.");
      return;
    }
    if (!canDelete) return;

    try {
      setDeleting(true);

      // 1) Delete user-related data in Firestore
      //    (IMPORTANT: delete bookings first, then profile)
      await deleteUserBookings(uid);
      await deleteDoc(doc(db, "users", uid));

      // 2) Delete the Firebase Auth user
      await deleteUser(auth.currentUser);

      // 3) Go back to auth
      // AuthGate will also enforce this once auth becomes null
      router.replace("/(auth)");
    } catch (e: any) {
      const code = String(e?.code ?? "");
      const msg = e?.message ?? "Please try again.";

      if (code.includes("requires-recent-login")) {
        Alert.alert(
          "Re-login required",
          "For security, Firebase requires you to log in again before deleting your account.\n\nPlease log out, log back in, then try Delete again."
        );
      } else {
        Alert.alert("Delete failed", msg);
      }
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setConfirmText("");
    }
  };

  const firstName = (profile?.firstName ?? "—").trim() || "—";
  const surname = (profile?.surname ?? "—").trim() || "—";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Centered Header */}
        <View style={styles.headerWrap}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Manage your account and app preferences.
          </Text>
        </View>

        {/* Account Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>

          {profileLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Loading profile…</Text>
            </View>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>First name</Text>
                <Text style={styles.value}>{firstName}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Surname</Text>
                <Text style={styles.value}>{surname}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{email}</Text>
              </View>
            </>
          )}
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>

          <Pressable
            style={[styles.button, loggingOut && styles.buttonDisabled]}
            onPress={handleLogout}
            disabled={loggingOut || deleting}
          >
            {loggingOut ? (
              <View style={styles.inlineRow}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.buttonText}> Logging out…</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Log out</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.dangerButton, (loggingOut || deleting) && { opacity: 0.6 }]}
            onPress={() => setDeleteModalOpen(true)}
            disabled={loggingOut || deleting}
          >
            <Text style={styles.dangerText}>Delete account</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Delete Modal */}
      <Modal
        visible={deleteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete your account?</Text>

            <Text style={styles.modalText}>
              This permanently deletes your MeetPastor account and your stored profile data,
              including bookings. Type{" "}
              <Text style={{ fontWeight: "900" }}>DELETE</Text> to confirm.
            </Text>

            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Type DELETE"
              placeholderTextColor="#999"
              style={styles.input}
              autoCapitalize="characters"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setDeleteModalOpen(false);
                  setConfirmText("");
                }}
                disabled={deleting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalButton,
                  styles.modalDelete,
                  (!canDelete || deleting) && { opacity: 0.5 },
                ]}
                onPress={handleDeleteAccount}
                disabled={!canDelete || deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalDeleteText}>Delete</Text>
                )}
              </Pressable>
            </View>

            <Text style={styles.modalFootnote}>
              If you see “Re-login required”, log out and log back in, then retry.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },

  headerWrap: { paddingTop: 18, paddingBottom: 18, alignItems: "center" },
  title: { fontSize: 30, fontWeight: "900", textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
    maxWidth: 320,
    lineHeight: 18,
  },

  card: {
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", marginBottom: 10 },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  loadingText: { fontSize: 14, color: "#666", fontWeight: "700" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  label: { fontSize: 14, color: "#666", fontWeight: "700" },
  value: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
    flexShrink: 1,
    textAlign: "right",
  },

  button: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonDisabled: { opacity: 0.75 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  inlineRow: { flexDirection: "row", alignItems: "center" },

  dangerButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E24A4A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  dangerText: { color: "#E24A4A", fontSize: 16, fontWeight: "900" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18 },
  modalTitle: { fontSize: 22, fontWeight: "900", marginBottom: 8 },
  modalText: { fontSize: 14, color: "#444", lineHeight: 20, marginBottom: 12 },

  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#111",
    marginBottom: 12,
  },

  modalActions: { flexDirection: "row", gap: 10 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalCancel: { backgroundColor: "#F1F1F1" },
  modalCancelText: { fontSize: 16, fontWeight: "900", color: "#111" },
  modalDelete: { backgroundColor: "#E24A4A" },
  modalDeleteText: { fontSize: 16, fontWeight: "900", color: "#fff" },

  modalFootnote: { marginTop: 10, fontSize: 12, color: "#777", lineHeight: 16 },
});
