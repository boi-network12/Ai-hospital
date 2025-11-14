import { StyleSheet, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader'
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { router } from 'expo-router'
import EmailChangeForm from '@/components/EmailChange/EmailChangeForm';
import { useUser } from '@/Hooks/userHooks.d';

export default function EmailChange() {
  const { user, updateEmail} = useUser();
  const [currentEmail] = useState(user?.email ?? '');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------
  const validate = (): boolean => {
    if (!newEmail) {
      setError('New email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError('Enter a valid email address');
      return false;
    }
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setError('New email must be different from current email');
      return false;
    }
    if (newEmail !== confirmEmail) {
      setError('Emails do not match');
      return false;
    }
    setError(null);
    return true;
  };

  // -----------------------------------------------------------------
  // Submit handler
  // -----------------------------------------------------------------
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await updateEmail(newEmail.trim().toLowerCase());
      router.back();
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to update email';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  if (!user) {
    // Should never happen because the provider guarantees a user when auth.isAuth
    return null;
  }

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
        <EmailChangeForm
            currentEmail={currentEmail}
            newEmail={newEmail}
            setNewEmail={setNewEmail}
            confirmEmail={confirmEmail}
            setConfirmEmail={setConfirmEmail}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
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