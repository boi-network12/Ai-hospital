import { ScrollView, StyleSheet, View, Text, Switch } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader'
import { heightPercentageToDP as hp } from "react-native-responsive-screen"
import { router } from 'expo-router'
import { SettingsType } from '@/types/notification'


export default function NotificationPage() {
  const [settings, setSettings] = useState<SettingsType>({
    pushNotifications: true,
    emailNotifications: false,
    smsAlerts: false,
    appUpdates: true,
    reminders: true,
  })

  const handleToggle = (key: keyof SettingsType) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const sections: {
  title: string;
  items: { label: string; key: keyof SettingsType }[];
  }[] = [
    {
      title: "General Notifications",
      items: [
        { label: "Push Notifications", key: "pushNotifications" },
        { label: "Email Notifications", key: "emailNotifications" },
        { label: "SMS Alerts", key: "smsAlerts" },
      ],
    },
    {
      title: "App Preferences",
      items: [
        { label: "App Updates", key: "appUpdates" },
        { label: "Reminders", key: "reminders" },
      ],
    },
  ];


  return (
    <SafeAreaView style={styles.ProfileDetailsContainer}>
      <GeneralSettingsHeader
        title="Notification Settings"
        returnBtn={() => router.back()}
      />

      <ScrollView
        bounces
        contentContainerStyle={styles.ScrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, idx) => (
              <View key={idx} style={styles.row}>
                <View>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.subLabel}>
                    {item.label === "Push Notifications"
                      ? "Receive alerts instantly in-app"
                      : item.label === "Email Notifications"
                      ? "Stay updated via your email"
                      : item.label === "SMS Alerts"
                      ? "Get short messages for important updates"
                      : item.label === "App Updates"
                      ? "Be notified about new versions"
                      : "Receive friendly reminders"}
                  </Text>
                </View>

                <Switch
                  trackColor={{ false: "#ccc", true: "rgba(128, 137, 255, 0.5)" }}
                  thumbColor={settings[item.key] ? "#8089FF" : "#f4f3f4"}
                  onValueChange={() => handleToggle(item.key as keyof SettingsType)}
                  value={settings[item.key as keyof SettingsType]}
                />
              </View>
            ))}
          </View>
        ))}
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
    paddingVertical: hp(1.5),
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: hp(2),
    padding: hp(2),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontWeight: "600",
    color: "#333",
    marginBottom: hp(1.2),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    paddingVertical: hp(1.2),
  },
  label: {
    fontSize: hp(1.7),
    color: "#333",
    fontWeight: "500",
  },
  subLabel: {
    fontSize: hp(1.4),
    color: "#888",
    marginTop: hp(0.3),
  },
})
