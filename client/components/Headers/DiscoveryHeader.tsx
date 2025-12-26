import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native'
import React, { useRef } from 'react'
import { heightPercentageToDP as hp } from 'react-native-responsive-screen'
import FilterIcon from "@/assets/Svgs/funnel.svg"
import LocationIcon from "@/assets/Svgs/locate.svg";
import RefreshIcon from "@/assets/Svgs/refresh-ccw.svg";

interface DiscoveryHeaderProps {
  onFilterPress?: () => void;
  onLocationPress?: () => void;
  location?: {
    city: string;
    state: string;
    country: string;
    latitude?: number;
    longitude?: number;
  } | null;
  isLoadingLocation?: boolean;
}

export default function DiscoveryHeader({ onFilterPress, onLocationPress, location, isLoadingLocation = false }: DiscoveryHeaderProps) {
  const getLocationText = () => {
    if (isLoadingLocation) return 'Detecting your location...';

    if (!location) return 'Tap to set location';

    // Check if we have real GPS coordinates
    const hasRealCoords =
      location.latitude != null &&
      location.longitude != null &&
      location.latitude !== 0 &&
      location.longitude !== 0;

    // Optional: also trust city if it's clearly not a placeholder
    const hasGoodCity =
      location.city &&
      !['Nearby Area', 'Your Area', 'Unknown City'].includes(location.city.trim());

    if (hasRealCoords || hasGoodCity) {
      return `${location.city}, ${location.country}`;
    }

    return 'Tap to detect location';
  };

  const displayText = getLocationText();

  // Animation Value
  const rotation = useRef(new Animated.Value(0)).current;

  // Rotate animation function
  const triggerRotation = () => {
    rotation.setValue(0); // Reset animation
    Animated.timing(rotation, {
      toValue: 1,
      duration: 700,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  // Debounce function
  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    return (...args: any[]) => {
      if (timeoutId) return;
      func(...args);
      triggerRotation(); // 🔄 Trigger animation when clicked
      timeoutId = setTimeout(() => {
        timeoutId = undefined;
      }, delay);
    };
  };

  const debouncedLocationPress = onLocationPress
    ? debounce(onLocationPress, 4000)
    : undefined;

  // Interpolate rotation value
  const rotateStyle = {
    transform: [{
      rotate: rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
      })
    }]
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.targetStyle}
        onPress={debouncedLocationPress}
        activeOpacity={0.7}
      >
        <LocationIcon width={hp(2.2)} height={hp(2.2)} color="#8089ff" />

        <Text style={styles.targetStyleText} numberOfLines={1}>
          {displayText}
        </Text>

        {/* Animated refresh icon */}
        <Animated.View style={rotateStyle}>
          <RefreshIcon width={hp(1.8)} height={hp(1.8)} color="#8089ff" />
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity onPress={onFilterPress} activeOpacity={0.6}>
        <FilterIcon width={hp(2.2)} height={hp(2.2)} color="#8089ff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.15,
    borderBottomColor: "#eee",
    height: hp(7),
    paddingHorizontal: hp(2),
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row"
  },
  targetStyle: {
    flexDirection: "row",
    alignItems: 'center',
    gap: hp(1),
    justifyContent: "flex-start",
    flex: 1,
    marginRight: hp(2),
  },
  targetStyleText: {
    fontSize: hp(1.7),
    textTransform: "capitalize",
    flex: 1,
  }
})
