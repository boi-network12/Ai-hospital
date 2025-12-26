import { StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { SafeAreaView } from 'react-native-safe-area-context';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';
import { useRouter } from 'expo-router';
import HeaderSection from '@/components/ProfileDetail/HeaderSection';
import OtherDetailsDisplay from '@/components/ProfileDetail/OtherDetailsDisplay';
import { useUser } from '@/Hooks/userHooks.d';
import { useAuth } from '@/Hooks/authHook.d';
import { useToast } from '@/Hooks/useToast.d';

export default function ProfileDetails() {
  const router = useRouter();
  const { user, updateAvatar } = useUser();
  const { deleteAccount } = useAuth();
  const { showAlert } = useToast()

  if (!user) return;

  return (
    <SafeAreaView style={styles.ProfileDetailsContainer}>
      <GeneralSettingsHeader 
         title="Profile Details"
         returnBtn={() => router.back()}
      />
      <ScrollView bounces
         contentContainerStyle={styles.ScrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <HeaderSection 
          user={user}
          updateAvatar={updateAvatar}
          showAlert={showAlert}
        />
        {/*  */}
        <OtherDetailsDisplay 
           user={user}
           deleteAccount={deleteAccount}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  ProfileDetailsContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  ScrollContainer: {
    backgroundColor: "#fcfcfc",
    paddingHorizontal: hp(2)
  }
})