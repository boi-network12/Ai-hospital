import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
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

export default function HomePage() {
  const { user, loading: userLoading } = useUser();
  const hydration = useHydrationData();
  const { healthcare } = useHealthcare()
  const { unreadCount } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);

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
      <ScrollView bounces 
          showsVerticalScrollIndicator={false}
        >
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
            <Text style={styles.headerText}>
              Hello, {user?.name?.split(' ')[0] || 'user'}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hp(2) }}>
             <NotificationIcon
                unreadCount={unreadCount}
                onPress={() => router.push("/notifications")}
                size={hp(2.5)}
                dotColor="#FF3B30" // Red dot
              />
            {isProfessional && (
                  <AppointmentIconDot
                    pendingCount={pendingAppointmentsCount}
                    onPress={() => router.push("/appointments")}
                    size={hp(2.5)}
                    dotColor="#FF9500" // Orange for appointments
                  />
            )}
          </View>
        </View>

        {/* for the middle View */}
        <View style={styles.middleView}>
          <Text style={styles.middleHeaderText}> Your resolves 
            <Text 
              style={{ 
                fontWeight: "300", 
                fontFamily: "Roboto-regular", 
                fontSize: hp(1), 
                marginLeft: hp(1.7)
              }}>
              <NetworkLatencyDisplay />
            </Text>
          </Text>

          {/*  */}
          <MiddleDisplay 
            data={_middleDisplayContent}
          />
        </View>

        {/* widget for step, weather, hydration, time to bed */}
        <HomeWidget 
           user={user}
           hydration={hydration}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
// app/(tabs)/home/index.tsx

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
  headerText: {
    fontSize: hp(3),
    fontWeight: '600',
    fontFamily: "Roboto-Medium",
    color: '#000',
    letterSpacing: 0,
  },
  middleView: {

  },
  middleHeaderText: {
    fontSize: hp(2),
    fontWeight: '700',
    fontFamily: "Roboto-Bold",
    color: '#888',
    letterSpacing: 0,
    textTransform: 'capitalize',
    marginBottom: hp(3)
  }
})