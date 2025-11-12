// src/components/modals/ToastAlert.tsx
import React from "react";
import {
  Animated,
  Text,
  StyleSheet,
} from "react-native";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { SafeAreaView } from "react-native-safe-area-context";

type ToastType = "info" | "success" | "error" | "warning";

interface ToastAlertProps {
  visible: boolean;
  message: string;
  type: ToastType;
  onHide: () => void;
}

/** Your original border colours → now used as background */
const typeColors: Record<ToastType, string> = {
  info: "#007bff",
  success: "#28a745",
  error: "#dc3545",
  warning: "#ffc107",
};

export const ToastAlert: React.FC<ToastAlertProps> = ({
  visible,
  message,
  type,
  onHide,
}) => {
  const translateY = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    if (visible) {
      // slide in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      // auto-hide after 3 s
      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }).start(onHide);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, translateY, onHide]);

  if (!visible) return null;

  return (
    <SafeAreaView pointerEvents="none" style={styles.safe}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: typeColors[type], transform: [{ translateY }] },
        ]}
      >
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  container: {
    marginHorizontal: hp(2),
    marginTop: hp(1),
    paddingHorizontal: hp(2.5),
    paddingVertical: hp(1.8),
    borderRadius: hp(1.2),
    alignItems: "center",
  },
  message: {
    color: "#fff",
    fontSize: hp(1.7),
    fontWeight: "600",
  },
});