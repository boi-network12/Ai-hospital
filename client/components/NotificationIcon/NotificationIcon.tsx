// components/NotificationIcon/NotificationIcon.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import NotIcon from "@/assets/Svgs/bell.svg";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

interface NotificationIconProps {
  unreadCount?: number;
  size?: number;
  onPress: () => void;
  showDot?: boolean;
  dotColor?: string;
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({
  unreadCount = 0,
  size = hp(3),
  onPress,
  showDot = true,
  dotColor = '#FF3B30', // Red color for dot
}) => {
  const hasUnread = unreadCount > 0;
  
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <NotIcon width={size} height={size} />
      
      {hasUnread && showDot && (
        <View style={[
          styles.dot,
          { backgroundColor: dotColor },
          unreadCount > 0 && unreadCount < 10 ? styles.smallDot : styles.largeDot
        ]}>
          {unreadCount > 0 && unreadCount < 10 ? (
            <Text style={styles.countText}>{unreadCount}</Text>
          ) : unreadCount >= 10 ? (
            <Text style={styles.countText}>9+</Text>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Alternative simpler version with just a dot (no count)
export const NotificationIconDot: React.FC<NotificationIconProps> = ({
  unreadCount = 0,
  size = hp(3),
  onPress,
  dotColor = '#FF3B30',
}) => {
  const hasUnread = unreadCount > 0;
  
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <NotIcon width={size} height={size} />
      
      {hasUnread && (
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
    fontSize: hp(1),
    fontWeight: 'bold',
  },
});