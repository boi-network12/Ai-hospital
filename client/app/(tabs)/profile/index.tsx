import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import profilePicture from '@/assets/images/avatar.png';
import ProfileHeader from '@/components/Headers/ProfileHeader';
import CalenderIcon from '@/assets/Svgs/calendar-days.svg';
import MaleIcon from '@/assets/Svgs/mars.svg';
import FemaleIcon from '@/assets/Svgs/venus.svg';
import DropIcon from '@/assets/Svgs/droplet.svg';
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import { Image } from 'expo-image';
import ViewDetailsReports from '@/components/ProfileComponents/ViewDetailsReports';
import { useUser } from '@/Hooks/userHooks.d';

const blurhash = BLUR_HASH_PLACEHOLDER;

// Helper: calculate age from date of birth
const calculateAge = (dob?: string | null): string | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `${age} years`;
};

const getGenderIcon = (gender: string) => {
  if (gender.toLowerCase() === 'male') return MaleIcon;
  if (gender.toLowerCase() === 'female') return FemaleIcon;
  return null;
};

export default function ProfilePage() {
  const { user } = useUser();

  const ageText = useMemo(() => calculateAge(user?.profile?.dateOfBirth), [user?.profile?.dateOfBirth]);
  const genderText = user?.profile?.gender;
  const genotypeText = user?.profile?.genotype;

  const _topHeaderTag = useMemo(() => {
    const tags: { icon: any; text: string }[] = [];

    if (ageText) {
      tags.push({ icon: CalenderIcon, text: ageText });
    }

    if (genderText && genderText !== 'Prefer not to say') {
      tags.push({ icon: getGenderIcon(genderText), text: genderText });
    }

    if (genotypeText) {
      tags.push({ icon: DropIcon, text: genotypeText });
    }

    return tags;
  }, [ageText, genderText, genotypeText]);


  const firstName = user?.name?.split(' ')[0] || 'User';

  const TopHeader = () => (
    <View style={styles.TopHeaderContainer}>
      <Image
        source={user?.profile?.avatar ? { uri: user?.profile.avatar } : profilePicture}
        placeholder={blurhash}
        style={styles.imgAvatar}
      />
      <Text style={styles.TopHeaderText}>{firstName}</Text>

      {/* Only show tag container if there’s at least one tag */}
      {_topHeaderTag.length > 0 && (
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
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader 
         user={user}
      />
      <ScrollView
        bounces
        showsVerticalScrollIndicator={false}
      >
        {TopHeader()}
        <ViewDetailsReports 
           user={user}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  TopHeaderContainer: {
    paddingHorizontal: hp(2),
    paddingBottom: hp(1.5),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginTop: hp(1.5),
  },
  imgAvatar: {
    width: hp(10),
    aspectRatio: 1,
    borderRadius: hp(5),
    borderWidth: 0.5,
    borderColor: '#eee',
  },
  TopHeaderText: {
    fontFamily: 'Roboto-bold',
    marginTop: hp(1),
    fontWeight: '700',
    fontSize: hp(2.25),
    letterSpacing: hp(0.01),
  },
  TagFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hp(2),
    marginTop: hp(1.5),
  },
  TagFlexBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(0.4),
    backgroundColor: 'rgba(128, 137, 255, 0.1)',
    borderRadius: hp(0.5),
    padding: hp(0.6),
  },
  TagText: {
    fontSize: hp(1.5),
    color: '#8089ff',
  },
});
