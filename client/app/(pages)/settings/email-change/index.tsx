import { StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader'
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { router } from 'expo-router'
import EmailChangeForm from '@/components/EmailChange/EmailChangeForm';

export default function EmailChange() {
  return (
    <SafeAreaView style={styles.ProfileDetailsContainer}>
      <GeneralSettingsHeader
          title="Change Email"
          returnBtn={() => router.back()}
      />
      <ScrollView bounces
          contentContainerStyle={styles.ScrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <EmailChangeForm />
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