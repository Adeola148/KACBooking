import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type ToastType = "success" | "error" | "info";

type Props = {
  visible: boolean;
  message: string;
  type?: ToastType;
  durationMs?: number;
  onHide: () => void;
};

export default function Toast({
  visible,
  message,
  type = "info",
  durationMs = 2500,
  onHide,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    translateY.setValue(10);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 10,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }, durationMs);

    return () => clearTimeout(t);
  }, [visible, durationMs, onHide, opacity, translateY]);

  if (!visible) return null;

  const bg =
    type === "success" ? "#0F9D58" : type === "error" ? "#D90429" : "#111";

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: bg, opacity, transform: [{ translateY }] },
        ]}
      >
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    alignItems: "center",
  },
  toast: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  text: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
    fontSize: 14,
  },
});
