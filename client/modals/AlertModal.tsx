// src/components/modals/AlertModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

interface AlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type: "info" | "success" | "error" | "warning";
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  confirmText = "OK",
  cancelText,
  onConfirm,
  onCancel,
  type,
}) => {
  const hasCancel = !!cancelText;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, scaleAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={hasCancel ? onCancel : onConfirm}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
            typeStyles[type],
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={[styles.buttonRow, !hasCancel && styles.singleButton]}>
            {hasCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const typeStyles: Record<
  "info" | "success" | "error" | "warning",
  object
> = {
  info: { borderColor: "#007bff" },
  success: { borderColor: "#28a745" },
  error: { borderColor: "#dc3545" },
  warning: { borderColor: "#ffc107" },
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: hp(1.5),
    padding: hp(3),
    width: "85%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 2,
  },
  title: {
    fontSize: hp(2.3),
    fontWeight: "700",
    color: "#333",
    marginBottom: hp(1),
    textAlign: "center",
  },
  message: {
    fontSize: hp(1.8),
    color: "#555",
    textAlign: "center",
    marginBottom: hp(2.5),
    lineHeight: hp(2.2),
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: hp(1.5),
    width: "100%",
  },
  singleButton: {
    justifyContent: "center",
  },
  confirmBtn: {
    backgroundColor: "#8089ff",
    paddingHorizontal: hp(3),
    paddingVertical: hp(1.2),
    borderRadius: hp(1),
    minWidth: hp(10),
  },
  confirmText: {
    color: "#fff",
    fontSize: hp(1.8),
    fontWeight: "600",
    textAlign: "center",
  },
  cancelBtn: {
    paddingHorizontal: hp(3),
    paddingVertical: hp(1.2),
    borderRadius: hp(1),
    borderWidth: 1,
    borderColor: "#ccc",
    minWidth: hp(10),
  },
  cancelText: {
    color: "#666",
    fontSize: hp(1.8),
    fontWeight: "500",
    textAlign: "center",
  },
});

export default AlertModal;
