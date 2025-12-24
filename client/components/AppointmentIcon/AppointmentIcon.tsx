// components/AppointmentIcon/AppointmentIcon.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import AppointmentsIcon from "@/assets/Svgs/calendar-search.svg";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

interface AppointmentIconProps {
  pendingCount?: number;
  size?: number;
  onPress: () => void;
  showDot?: boolean;
  dotColor?: string;
}

export const AppointmentIcon: React.FC<AppointmentIconProps> = ({
  pendingCount = 0,
  size = hp(3),
  onPress,
  showDot = true,
  dotColor = '#FF9500', // Orange color for appointments (different from notifications)
}) => {
  const hasPending = pendingCount > 0;
  
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <AppointmentsIcon width={size} height={size} />
      
      {hasPending && showDot && (
        <View style={[
          styles.dot,
          { backgroundColor: dotColor },
          pendingCount > 0 && pendingCount < 10 ? styles.smallDot : styles.largeDot
        ]}>
          {pendingCount > 0 && pendingCount < 10 ? (
            <Text style={styles.countText}>{pendingCount}</Text>
          ) : pendingCount >= 10 ? (
            <Text style={styles.countText}>9+</Text>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Alternative simpler version with just a dot
export const AppointmentIconDot: React.FC<AppointmentIconProps> = ({
  pendingCount = 0,
  size = hp(3),
  onPress,
  dotColor = '#FF9500',
}) => {
  const hasPending = pendingCount > 0;
  
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <AppointmentsIcon width={size} height={size} />
      
      {hasPending && (
        <View style={[styles.simpleDot, { backgroundColor: dotColor }]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: hp(0.5),
  },
  dot: {
    position: 'absolute',
    top: -hp(0.5),
    right: -hp(0.5),
    borderRadius: hp(1),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: hp(1.5),
    minHeight: hp(1.5),
    borderWidth: 1,
    borderColor: '#FFF',
  },
  smallDot: {
    width: hp(1.5),
    height: hp(1.5),
  },
  largeDot: {
    width: hp(2),
    height: hp(2),
    padding: hp(0.3),
  },
  simpleDot: {
    position: 'absolute',
    top: -hp(0.5),
    right: -hp(0.5),
    width: hp(1),
    height: hp(1),
    borderRadius: hp(0.5),
    borderWidth: 1,
    borderColor: '#FFF',
  },
  countText: {
    color: '#FFF',
    fontSize: hp(0.9),
    fontWeight: 'bold',
  },
});