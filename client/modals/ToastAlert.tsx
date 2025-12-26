// src/components/modals/ToastAlert.tsx
import React, { useRef, useEffect, useCallback } from "react";
import {
  Animated,
  Text,
  StyleSheet,
  Dimensions,
  Vibration,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type ToastType = "info" | "success" | "error" | "warning";

interface ToastAlertProps {
  visible: boolean;
  message: string;
  type: ToastType;
  onHide: () => void;
  duration?: number;
}

// Subtle colors for minimalistic look
const typeColors: Record<ToastType, string> = {
  info: "rgba(50, 115, 220, 0.9)",       // soft blue
  success: "rgba(45, 180, 100, 0.9)",    // soft green
  error: "rgba(220, 50, 50, 0.9)",       // soft red
  warning: "rgba(220, 160, 20, 0.9)",    // soft yellow
};

export const ToastAlert: React.FC<ToastAlertProps> = ({
  visible,
  message,
  type,
  onHide,
  duration = 3000,
}) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const dismissWithAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  }, [translateY, opacity, scale, onHide]);

  useEffect(() => {
    if (visible) {
      translateX.setValue(0);
      opacity.setValue(1);
      scale.setValue(0.95);

      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        useNativeDriver: true,
      }).start();

      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }).start();

      hideTimer.current = setTimeout(() => {
        dismissWithAnimation();
      }, duration);
    } else {
      translateY.setOffset(-150);
      translateY.setValue(0);
    }

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible, duration, dismissWithAnimation, translateY, translateX, opacity, scale]);

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY, velocityY } = event.nativeEvent;
      const swipeThreshold = 100;
      const shouldDismissHorizontally = Math.abs(translationX) > swipeThreshold;
      const shouldDismissUp = translationY < -50 && Math.abs(velocityY) > 500;

      if (shouldDismissHorizontally || shouldDismissUp) {
        Vibration.vibrate(50);
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: translationX > 0 ? width : -width,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true }).start();
      }
    }
  };

  if (!visible) return null;

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safe}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        minPointers={1}
        maxPointers={1}
      >
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: typeColors[type],
              opacity,
              transform: [{ translateY }, { translateX }, { scale }],
            },
          ]}
        >
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </PanGestureHandler>
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
    alignItems: "center",
  },
  container: {
    marginHorizontal: hp(3),
    marginTop: hp(2),
    paddingHorizontal: hp(2),
    paddingVertical: hp(1),
    borderRadius: hp(1),
    minWidth: width - hp(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    color: "#fff",
    fontSize: hp(1.3),
    fontWeight: "600",
    textAlign: "left",
    lineHeight: hp(2.6),
  },
});
