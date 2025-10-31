import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import AntDesign from '@expo/vector-icons/AntDesign';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context'
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import { heightPercentageToDP as hp } from "react-native-responsive-screen"
import { router } from 'expo-router';

const blurhash = BLUR_HASH_PLACEHOLDER; 

export default function GetStartedPage() {
  return (
    <SafeAreaView style={[styles.GetStartedWrapper]}>
      <StatusBar style="auto" />
      <View style={styles.pillImgContainer}>
        <Image
          source={require('../assets/images/pillsDisplay.png')}
          placeholder={{ blurhash }}
          contentFit='contain'
          style={styles.pillsImgDisplay}
        />
      </View>
      <Text style={styles.getStartedText}>welcome to doc ai</Text>
      <View style={styles.handPillImgContainer}>
        <Image
          source={require('../assets/images/handWithPill.png')}
          contentFit='contain'
          style={styles.pillsImgDisplay}
        />
      </View>


      <TouchableOpacity style={styles.btnWrapper} onPress={() => router.push('/login')}>
        <BlurView intensity={100} style={styles.blurContainer}>
            <AntDesign name="arrow-right" size={hp(2)} color="black" />
        </BlurView>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  GetStartedWrapper: {
    backgroundColor: '#8089ff',
    flex: 1,
    position: 'relative',
  },
  pillsImgDisplay: {
    width: '100%',
    height: '100%',
  },
  pillImgContainer: {
    width: hp(10),
    height: hp(10),
    marginTop: hp(12),
    paddingLeft: hp(3)
  },
  handPillImgContainer: {
    width: hp(50),
    height: hp(50),
    position: 'absolute',
    bottom: 0,
    right: hp(-4),
  },
  getStartedText: {
    color: '#fff',
    fontSize: hp(6),
    textAlign: 'left',
    marginTop: hp(1),
    paddingHorizontal: hp(3),
    fontWeight: '500',
    fontFamily: 'Roboto',
    lineHeight: hp(6)
  },
  btnWrapper: {
    width: hp(8.5),
    height: hp(8.5),
    borderRadius: hp(2),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
    bottom: hp(10),
    left: hp(20),
  },
  blurContainer: {
    overflow: 'hidden',
    width: '55%',
    height: '55%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: hp(1),
  },
})