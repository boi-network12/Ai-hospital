import React, { useEffect, useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { router } from 'expo-router';
import { SettingsType } from '@/types/notification';
import { useUser } from '@/Hooks/userHooks.d';
import { useToast } from '@/Hooks/useToast.d';
import { debounce } from 'lodash';

export default function NotificationPage() {
  const { user, updateNotifications, refreshUser } = useUser();
  const { showAlert } = useToast();
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<SettingsType>({
    pushNotifications: true,
    emailNotifications: false,
    smsAlerts: false,
    appUpdates: true,
    reminders: true,
  });

  // === Load from user ===
  useEffect(() => {
    if (user?.notificationSettings) {
      setSettings((prev) => ({
        ...prev,
        pushNotifications: user.notificationSettings?.pushNotifications ?? true,
        emailNotifications: user.notificationSettings?.emailNotifications ?? false,
        smsAlerts: user.notificationSettings?.smsNotifications ?? false,
      }));
    }
  }, [user]);

  // === Debounced save (300ms) ===
  const debouncedSave = useMemo(() => {
    return debounce(async (payload: any) => {
      setSaving(true);
      try {
        await updateNotifications(payload);
        await refreshUser();
        showAlert({ message: 'Saved!', type: 'success' });
      } catch (err: any) {
        showAlert({ message: err.message || 'Failed to save', type: 'error' });
      } finally {
        setSaving(false);
      }
    }, 300);
  }, [updateNotifications, refreshUser, showAlert]);

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);


  // === Toggle handler ===
  const handleToggle = (key: keyof SettingsType) => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));

    // Only save backend fields
    if (['pushNotifications', 'emailNotifications', 'smsAlerts'].includes(key)) {
      const payload: any = {};
      if (key === 'pushNotifications') payload.pushNotifications = newValue;
      if (key === 'emailNotifications') payload.emailNotifications = newValue;
      if (key === 'smsAlerts') payload.smsNotifications = newValue;

      debouncedSave(payload);
    }
  };

  const sections = [
    {
      title: 'General Notifications',
      items: [
        { label: 'Push Notifications', key: 'pushNotifications' as const },
        { label: 'Email Notifications', key: 'emailNotifications' as const },
        { label: 'SMS Alerts', key: 'smsAlerts' as const },
      ],
    },
    {
      title: 'App Preferences',
      items: [
        { label: 'App Updates', key: 'appUpdates' as const },
        { label: 'Reminders', key: 'reminders' as const },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <GeneralSettingsHeader title="Notification Settings" returnBtn={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <View key={item.key} style={styles.row}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.subLabel}>
                    {item.label === 'Push Notifications'
                      ? 'Receive alerts instantly in-app'
                      : item.label === 'Email Notifications'
                      ? 'Stay updated via your email'
                      : item.label === 'SMS Alerts'
                      ? 'Get short messages for important updates'
                      : item.label === 'App Updates'
                      ? 'Be notified about new versions'
                      : 'Receive friendly reminders'}
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: '#ddd', true: '#8089FF' }}
                  thumbColor={settings[item.key] ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="#ddd"
                  onValueChange={() => handleToggle(item.key)}
                  value={settings[item.key]}
                />
              </View>
            ))}
          </View>
        ))}

        {/* Spacer for fixed button */}
        <View style={{ height: hp(12) }} />
      </ScrollView>

      {/* Fixed Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={() => debouncedSave.flush()} // Force save if needed
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// === Styles ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: {
    paddingHorizontal: hp(2),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: hp(2),
    padding: hp(2),
    marginBottom: hp(2),
    borderWidth: 0.5,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp(1.5),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.3),
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  labelContainer: { flex: 1, marginRight: hp(2) },
  label: {
    fontSize: hp(1.8),
    color: '#333',
    fontWeight: '500',
  },
  subLabel: {
    fontSize: hp(1.5),
    color: '#888',
    marginTop: hp(0.3),
  },
  footer: {
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
    backgroundColor: '#8089FF',
    height: hp(6.5),
    borderRadius: hp(10),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8089FF',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: {
    color: '#fff',
    fontSize: hp(2),
    fontWeight: '600',
  },
});