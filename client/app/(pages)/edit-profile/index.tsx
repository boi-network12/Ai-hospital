import { ActivityIndicator, ScrollView,StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useUser } from '@/Hooks/userHooks.d'
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function EditProfile() {
  const { user, updateProfile, loading: userLoading } = useUser();
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Local state for form
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    'profile.location.city': '',
    'profile.location.state': '',
    'profile.location.country': '',
    'profile.dateOfBirth': '',
    'profile.gender': '',
    'profile.bloodGroup': '',
    'profile.genotype': '',
    'profile.height': '',
    'profile.weight': '',
    'profile.specialization': '',
    'profile.department': '',
    'profile.bio': '',
    'emergencyContact.name': '',
    'emergencyContact.relationship': '',
    'emergencyContact.phoneNumber': '',
  });

  const [saving, setSaving] = useState(false);

  // Fill form when user loads
  useEffect(() => {
  if (user) {
    setForm({
      name: user.name || '',
      phoneNumber: user.phoneNumber || '',
      'profile.location.city': user.profile?.location?.city || '',
      'profile.location.state': user.profile?.location?.state || '',
      'profile.location.country': user.profile?.location?.country || '',
      'profile.dateOfBirth': user.profile?.dateOfBirth 
        ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0] 
        : '',
      'profile.gender': user.profile?.gender || 'Prefer not to say',
      'profile.bloodGroup': user.profile?.bloodGroup || '',
      'profile.genotype': user.profile?.genotype || '',
      'profile.height': user.profile?.height?.toString() || '',
      'profile.weight': user.profile?.weight?.toString() || '',
      'profile.specialization': user.profile?.specialization || '',
      'profile.department': user.profile?.department || '',
      'profile.bio': user.profile?.bio || '',
      'emergencyContact.name': user.emergencyContact?.name || '',
      'emergencyContact.relationship': user.emergencyContact?.relationship || '',
      'emergencyContact.phoneNumber': user.emergencyContact?.phoneNumber || '',
    });
  }
}, [user]);

  const handleSave = async () => {
  if (!user) return;

  // Filter out unchanged or empty fields
  const changedData: any = {};
  Object.keys(form).forEach((key) => {
    const newVal = form[key as keyof typeof form];
    const getDeepValue = (obj: any, path: string): any => {
      return path.split('.').reduce((acc, part) => {
        if (acc === null || acc === undefined) return undefined;
        return acc[part];
      }, obj);
    };
    let oldVal = getDeepValue(user, key)


    if (newVal !== oldVal && (newVal !== '' || oldVal === undefined)) {
      changedData[key] = newVal === '' ? null : newVal; 
    }
  });

  if (Object.keys(changedData).length === 0) {
    router.back();
    return;
  }

  setSaving(true);
  try {
    await updateProfile(changedData); // ← only send changed fields
    router.back();
  } catch (err: any) {
    console.log(err);
  } finally {
    setSaving(false);
  }
};

  if (userLoading || !user) {
      return (
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: hp(20) }} />
        </SafeAreaView>
      );
    }


  return (
    <SafeAreaView style={styles.container}>
      <GeneralSettingsHeader title="Edit Profile" returnBtn={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* === Personal Info === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <InputField
            label="Full Name"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
          />

          <InputField
            label="Phone Number"
            value={form.phoneNumber}
            onChangeText={(text) => setForm({ ...form, phoneNumber: text })}
            keyboardType="phone-pad"
          />

          {/* === Gender === */}
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderBtn,
                  form['profile.gender'] === g && styles.genderBtnActive,
                ]}
                onPress={() => setForm({ ...form, 'profile.gender': g })}
              >
                <Text style={[
                  styles.genderBtnText,
                  form['profile.gender'] === g && styles.genderBtnTextActive,
                ]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={form['profile.dateOfBirth'] ? styles.dateText : styles.placeholderText}>
              {form['profile.dateOfBirth'] || 'Select Date of Birth'}
            </Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            date={form['profile.dateOfBirth'] ? new Date(form['profile.dateOfBirth']) : new Date()}
            onConfirm={(date) => {
              setForm({ ...form, 'profile.dateOfBirth': date.toISOString().split('T')[0] });
              setShowDatePicker(false);
            }}
            onCancel={() => setShowDatePicker(false)}
            maximumDate={new Date()}
          />

          <InputField
            label="Blood Group"
            value={form['profile.bloodGroup']}
            onChangeText={(text) => setForm({ ...form, 'profile.bloodGroup': text })}
          />

          <InputField
            label="Genotype"
            value={form['profile.genotype']}
            onChangeText={(text) => setForm({ ...form, 'profile.genotype': text })}
          />

          <InputField
            label="Height (cm)"
            value={form['profile.height']}
            onChangeText={(text) => setForm({ ...form, 'profile.height': text })}
            keyboardType="numeric"
          />

          <InputField
            label="Weight (kg)"
            value={form['profile.weight']}
            onChangeText={(text) => setForm({ ...form, 'profile.weight': text })}
            keyboardType="numeric"
          />
        </View>

        {/* === Location === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <InputField
            label="City"
            value={form['profile.location.city']}
            onChangeText={(text) => setForm({ ...form, 'profile.location.city': text })}
          />

          <InputField
            label="State"
            value={form['profile.location.state']}
            onChangeText={(text) => setForm({ ...form, 'profile.location.state': text })}
          />

          <InputField
            label="Country"
            value={form['profile.location.country']}
            onChangeText={(text) => setForm({ ...form, 'profile.location.country': text })}
          />
        </View>

        {/* === Professional === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional</Text>

          <InputField
            label="Specialization"
            value={form['profile.specialization']}
            onChangeText={(text) => setForm({ ...form, 'profile.specialization': text })}
          />

          <InputField
            label="Department"
            value={form['profile.department']}
            onChangeText={(text) => setForm({ ...form, 'profile.department': text })}
          />

          <InputField
            label="Bio"
            value={form['profile.bio']}
            onChangeText={(text) => setForm({ ...form, 'profile.bio': text })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* === Emergency Contact === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>

          <InputField
            label="Name"
            value={form['emergencyContact.name']}
            onChangeText={(text) => setForm({ ...form, 'emergencyContact.name': text })}
          />

          <InputField
            label="Relationship"
            value={form['emergencyContact.relationship']}
            onChangeText={(text) => setForm({ ...form, 'emergencyContact.relationship': text })}
          />

          <InputField
            label="Phone Number"
            value={form['emergencyContact.phoneNumber']}
            onChangeText={(text) => setForm({ ...form, 'emergencyContact.phoneNumber': text })}
            keyboardType="phone-pad"
          />
        </View>

        {/* Spacer for fixed button */}
        <View style={{ height: hp(10) }} />
      </ScrollView>

      {/* === Save Button (Fixed Bottom) === */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Reusable Input Component
const InputField = ({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      placeholder={`Enter ${label.toLowerCase()}`}
      placeholderTextColor="#aaa"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: hp(2),
    paddingTop: hp(2),
    paddingBottom: hp(2),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(1.7),
    textTransform: 'uppercase',
    fontWeight: '600',
    color: '#999',
    marginBottom: hp(1.5),
    paddingLeft: hp(0.5),
  },
  inputContainer: {
    marginBottom: hp(2),
  },
  inputLabel: {
    fontSize: hp(1.8),
    color: '#666',
    marginBottom: hp(0.8),
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: hp(1.5),
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.5),
    fontSize: hp(2),
    backgroundColor: '#fcfcfc',
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: hp(1.5),
    height: hp(12),
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: hp(3),
    paddingVertical: hp(2),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: hp(1.8),
    borderRadius: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#aaa',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: hp(2.1),
    fontWeight: '600',
  },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: hp(2) },
  genderBtn: {
    paddingHorizontal: hp(2),
    paddingVertical: hp(1),
    borderRadius: hp(1),
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: hp(1),
    marginBottom: hp(1),
  },
  genderBtnActive: { backgroundColor: '#222', borderColor: '#007AFF' },
  genderBtnText: { color: '#555', fontSize: hp(1.8) },
  genderBtnTextActive: { color: '#fff', fontWeight: '600' },

  dateInput: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: hp(1.5),
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.8),
    backgroundColor: '#fcfcfc',
    justifyContent: 'center',
  },
  dateText: { fontSize: hp(2), color: '#222' },
  placeholderText: { fontSize: hp(2), color: '#aaa' },
});

