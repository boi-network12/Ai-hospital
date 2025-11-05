import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import profilePicture from '@/assets/images/avatar.png';
import ProfileHeader from '@/components/Headers/ProfileHeader';
import CalenderIcon from '@/assets/Svgs/calendar-days.svg';
import MaleIcon from '@/assets/Svgs/mars.svg';
import FemaleIcon from '@/assets/Svgs/venus.svg';
import DropIcon from '@/assets/Svgs/droplet.svg';
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import { Image } from 'expo-image';

const blurhash = BLUR_HASH_PLACEHOLDER;

const getGenderIcon = (gender: string) => {
    if (gender.toLowerCase() === "male") {
      return MaleIcon;
    } else if (gender.toLowerCase() === "female") {
      return FemaleIcon;
    } else {
      return null;
    }
};

export default function ProfilePage() {
  const gender = "male";
  

  const _topHeaderTag = [
    {
      icon: CalenderIcon,
      text: "60 years"
    },
    {
      icon: getGenderIcon(gender),
      text: gender
    },
    {
      icon: DropIcon,
      text: "AB+"
    }
  ]
  

  const TopHeader = () => {
    return (
      <View style={styles.TopHeaderContainer}>
        <Image
          source={profilePicture}
          placeholder={blurhash}
          style={styles.imgAvatar}
        />
        <Text style={styles.TopHeaderText}>Jane</Text>
        <View style={styles.TagFlex}>
          {_topHeaderTag.map((item, index) => {
            const Icon = item.icon;

            return (
              <View key={index} style={styles.TagFlexBox}>
                {Icon && (
                  <Icon 
                    width={hp(1.9)}
                    height={hp(1.9)}
                    color="#8089ff"
                  />
                )}
                <Text style={styles.TagText}>{item.text}</Text>
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader />
      <ScrollView bounces 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ScrollViewUi}
        >
          {TopHeader()}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    flex: 1,
  },
  TopHeaderContainer: {
    paddingHorizontal: hp(2),
    alignItems: "center",
    justifyContent: 'center',
    flexDirection: 'column',
    marginTop: hp(1.5)
  },
  imgAvatar: {
    width: hp(10),
    aspectRatio: 1,
    borderRadius: hp(5),
    borderWidth: 0.5,
    borderColor: "#eee"
  },
  TopHeaderText: {
    fontFamily: "Roboto-bold",
    marginTop: hp(1),
    fontWeight: "700",
    fontSize: hp(2.25),
    letterSpacing: hp(0.01)
  },
  TagFlex: {
    flexDirection: "row",
    alignItems: 'center',
    gap: hp(2),
    marginTop: hp(1.5)
  },
  TagFlexBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    gap: hp(0.4),
    backgroundColor: "rgba(128, 137, 255, 0.1)",
    borderRadius: hp(0.5),
    padding: hp(0.6)
  },
  TagText: {
    fontSize: hp(1.5),
    color: '#8089ff',
  }
})