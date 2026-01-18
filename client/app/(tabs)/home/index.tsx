import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { heightPercentageToDP as hp } from "react-native-responsive-screen"
import { Image } from 'expo-image';
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import MiddleDisplay from '@/components/HomeComponents/MiddleDisplay';
import { _MiddleDisplayContent } from '@/constants/ResolveDisplay';
import HomeWidget from '@/components/HomeComponents/HomeWidget';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import NetworkLatencyDisplay from '@/config/NetworkLatencyDisplay';
import { useUser } from '@/Hooks/userHooks.d';
import { useHydrationData } from '@/Hooks/useHydration.d';
import { useNotification } from '@/Hooks/notificationHook.d';
import { NotificationIcon } from '@/components/NotificationIcon/NotificationIcon';
import { useHealthcare } from '@/context/HealthContext';
import { AppointmentIconDot } from '@/components/AppointmentIcon/AppointmentIcon';
import Skeleton, { AvatarSkeleton, MiddleDisplaySkeleton, WidgetSkeleton } from '@/components/customs/HomeSkeletonLoading';

const blurhash = BLUR_HASH_PLACEHOLDER; 
const _middleDisplayContent = _MiddleDisplayContent;

// Bubble Loading Component
const BubbleLoading = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    };

    const animation1 = createAnimation(dot1, 0);
    const animation2 = createAnimation(dot2, 150);
    const animation3 = createAnimation(dot3, 300);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3]);

  const getOpacity = (dot: Animated.Value) => {
    return dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.Text 
        style={[
          styles.bubbleDot,
          { opacity: getOpacity(dot1) }
        ]}
      >
        .
      </Animated.Text>
      <Animated.Text 
        style={[
          styles.bubbleDot,
          { opacity: getOpacity(dot2) }
        ]}
      >
        .
      </Animated.Text>
      <Animated.Text 
        style={[
          styles.bubbleDot,
          { opacity: getOpacity(dot3) }
        ]}
      >
        .
      </Animated.Text>
    </View>
  );
};

// Alternative: Simple pulsing dots without Animated API
const SimpleBubbleLoading = () => {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={[
        styles.bubbleDot,
        { opacity: activeDot === 0 ? 1 : 0.3 }
      ]}>
        .
      </Text>
      <Text style={[
        styles.bubbleDot,
        { opacity: activeDot === 1 ? 1 : 0.3 }
      ]}>
        .
      </Text>
      <Text style={[
        styles.bubbleDot,
        { opacity: activeDot === 2 ? 1 : 0.3 }
      ]}>
        .
      </Text>
    </View>
  );
};

export default function HomePage() {
  const { user, loading: userLoading } = useUser();
  const hydration = useHydrationData();
  const { healthcare } = useHealthcare()
  const { unreadCount } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showBubble, setShowBubble] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check if all data is loaded
    if (!userLoading && user && healthcare) {
      setIsDataLoading(false);
    }
  }, [userLoading, user, healthcare]);

  // Add bubble effect for user name loading
  useEffect(() => {
    if (!userLoading && user?.name) {
      // Stop bubble animation when user data is loaded
      setShowBubble(false);
    } else {
      setShowBubble(true);
    }
  }, [userLoading, user]);

  const getPendingAppointmentsCount = () => {
    if (!isProfessional) return 0;
    return healthcare?.pendingAppointmentsCount || 0; 
  };

  const pendingAppointmentsCount = getPendingAppointmentsCount();
  const isProfessional = user?.role === "doctor" || user?.role === "nurse" || user?.role === "hospital";

  if (isDataLoading && isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style='dark' />
        <ScrollView bounces showsVerticalScrollIndicator={false}>
          {/* Header skeleton */}
          <View style={styles.topViewHeader}>
            <AvatarSkeleton />
            <View style={{ flexDirection: "row", gap: hp(2) }}>
              <Skeleton width={hp(3)} height={hp(3)} borderRadius={hp(1.5)} />
              {isProfessional && (
                <Skeleton width={hp(3)} height={hp(3)} borderRadius={hp(1.5)} />
              )}
            </View>
          </View>

          {/* Middle display skeleton */}
          <View style={styles.middleView}>
            <Skeleton width={hp(15)} height={hp(2)} style={{ marginBottom: hp(3) }} />
            <MiddleDisplaySkeleton />
          </View>

          {/* Widget skeleton */}
          <WidgetSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style='dark' />
      <ScrollView bounces showsVerticalScrollIndicator={false}>
        {/* for header display */}
        <View style={styles.topViewHeader}>
          <View>
            <Image
              source={user?.profile?.avatar || require('@/assets/images/avatar.png')}
              style={styles.headerImage}
              transition={1000}
              placeholder={{ blurhash }}
              contentFit='contain'
            />
            <View style={styles.greetingContainer}>
              <Text style={styles.headerText}>
                Hello, {user?.name?.split(' ')[0] || ''}
              </Text>
              {showBubble && <SimpleBubbleLoading />}
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hp(2) }}>
            <NotificationIcon
              unreadCount={unreadCount}
              onPress={() => router.push("/notifications")}
              size={hp(2.5)}
              dotColor="#FF3B30"
            />
            {isProfessional && (
              <AppointmentIconDot
                pendingCount={pendingAppointmentsCount}
                onPress={() => router.push("/appointments")}
                size={hp(2.5)}
                dotColor="#FF9500"
              />
            )}
          </View>
        </View>

        {/* for the middle View */}
        <View style={styles.middleView}>
          <Text style={styles.middleHeaderText}>
            Your resolves
            <Text style={{
              fontWeight: "300",
              fontFamily: "Roboto-regular",
              fontSize: hp(1),
              marginLeft: hp(1.7)
            }}>
              <NetworkLatencyDisplay />
            </Text>
          </Text>

          <MiddleDisplay data={_middleDisplayContent} />
        </View>

        {/* widget for step, weather, hydration, time to bed */}
        <HomeWidget user={user} hydration={hydration} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: hp(2.5),
  },
  topViewHeader: {
    paddingRight: hp(1),
    marginTop: hp(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: "flex-start",
    marginBottom: hp(4),
  },
  headerImage: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(1.5),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#eee'
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: hp(3),
    fontWeight: '600',
    fontFamily: "Roboto-Medium",
    color: '#000',
    letterSpacing: 0,
  },
  bubbleDot: {
    fontSize: hp(4),
    fontWeight: '800',
    color: '#000',
    marginLeft: hp(0.3),
    marginTop: hp(-0.5), // Adjust for vertical alignment
  },
  middleView: {},
  middleHeaderText: {
    fontSize: hp(2),
    fontWeight: '700',
    fontFamily: "Roboto-Bold",
    color: '#888',
    letterSpacing: 0,
    textTransform: 'capitalize',
    marginBottom: hp(3)
  }
});