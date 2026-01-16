// components/SkeletonLoading.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

interface SkeletonProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: any;
}

const Skeleton = ({ width, height, borderRadius = hp(1), style }: SkeletonProps) => {
  const opacity = useSharedValue(0.5);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.ease }),
      -1,
      true
    );

    return () => {
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const AvatarSkeleton = () => (
  <View style={styles.avatarContainer}>
    <Skeleton width={hp(5)} height={hp(5)} borderRadius={hp(1.5)} />
    <Skeleton width={hp(12)} height={hp(2)} style={{ marginTop: hp(1) }} />
  </View>
);

export const MiddleDisplaySkeleton = () => (
  <View style={styles.middleDisplayContainer}>
    <Skeleton width={hp(18)} height={hp(20)} borderRadius={hp(1.5)} />
    <Skeleton width={hp(18)} height={hp(20)} borderRadius={hp(1.5)} />
    <Skeleton width={hp(18)} height={hp(20)} borderRadius={hp(1.5)} />
    <Skeleton width={hp(18)} height={hp(20)} borderRadius={hp(1.5)} />
  </View>
);

export const WidgetSkeleton = () => (
  <View style={styles.widgetContainer}>
    <Skeleton width="47%" height={hp(18)} borderRadius={hp(1)} />
    <Skeleton width="47%" height={hp(18)} borderRadius={hp(1)} />
    <Skeleton width="47%" height={hp(18)} borderRadius={hp(1)} />
    <Skeleton width="47%" height={hp(18)} borderRadius={hp(1)} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  avatarContainer: {
    marginBottom: hp(2),
  },
  middleDisplayContainer: {
    flexDirection: 'row',
    gap: hp(2),
  },
  widgetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: hp(2),
    marginTop: hp(3),
  },
});

export default Skeleton;