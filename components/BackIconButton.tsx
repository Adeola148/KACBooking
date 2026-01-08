import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

export default function BackIconButton() {
  const router = useRouter();

  return (
    <Pressable style={styles.button} onPress={() => router.back()}>
      <Ionicons name="chevron-back" size={28} color="#000" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 6,
  },
});
