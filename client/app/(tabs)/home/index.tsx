import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { heightPercentageToDP as hp } from "react-native-responsive-screen"
import { Image } from 'expo-image';
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import NotIcon from "@/assets/Svgs/bell.svg";
import MiddleDisplay from '@/components/HomeComponents/MiddleDisplay';
import { _MiddleDisplayContent } from '@/constants/ResolveDisplay';
import HomeWidget from '@/components/HomeComponents/HomeWidget';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import NetworkLatencyDisplay from '@/config/NetworkLatencyDisplay';
import { useUser } from '@/Hooks/userHooks.d';
import { useHydrationData } from '@/Hooks/useHydration.d';

const blurhash = BLUR_HASH_PLACEHOLDER; 

const _middleDisplayContent = _MiddleDisplayContent;

export default function HomePage() {
  const { user } = useUser();
  const hydration = useHydrationData();


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style='auto' />
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

          <TouchableOpacity onPress={() => router.push("/notifications")}>
            <NotIcon width={hp(2.5)} height={hp(3)} />
          </TouchableOpacity>
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