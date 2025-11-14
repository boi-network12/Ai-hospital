import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader'
import { router } from 'expo-router'
import { heightPercentageToDP as hp } from 'react-native-responsive-screen'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '@/Hooks/userHooks.d'

export default function ChangePassword() {
  const { updatePassword } = useUser();
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false);


  const handleSave = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      alert('New password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(oldPassword, newPassword);
      router.back();
    } catch (err: any) {
      throw new Error('Error', err)
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.ProfileDetailsContainer}>
      <GeneralSettingsHeader
        title="Change Password"
        returnBtn={() => router.back()}
      />

      <ScrollView
        bounces
        contentContainerStyle={styles.ScrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Text style={styles.label}>Old Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Enter old password"
              secureTextEntry={!showPassword}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.iconWrapper}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={hp(2.5)}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry={!showPassword}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.iconWrapper}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={hp(2.5)}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              secureTextEntry={!showPassword}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.iconWrapper}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={hp(2.5)}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: hp(2),
    paddingBottom: hp(5),
  },
  formContainer: {
    marginTop: hp(2),
  },
  label: {
    fontSize: hp(1.7),
    color: "#555",
    marginBottom: hp(0.5),
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: hp(1.5),
    marginBottom: hp(2),
    paddingHorizontal: hp(1.5),
    height: hp(6),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: hp(1.7),
    color: "#333",
  },
  iconWrapper: {
    padding: hp(0.5),
  },
  saveBtn: {
    backgroundColor: "rgba(128, 137, 255, 0.9)",
    height: hp(6),
    borderRadius: hp(10),
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(2),
    shadowColor: "#8089ff",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 2,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: hp(1.9),
    fontWeight: "600",
  },
})
