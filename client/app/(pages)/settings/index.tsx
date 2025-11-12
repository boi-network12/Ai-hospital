import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SettingsHeader from '@/components/Headers/SettingsHeader';
import { useRouter } from 'expo-router';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import LangIcon from "@/assets/Svgs/languages.svg";
import UserIcon from "@/assets/Svgs/user.svg";
import LockIcon from "@/assets/Svgs/user-lock.svg";
import BellIcon from "@/assets/Svgs/bell.svg";
import InfoIcon from "@/assets/Svgs/info.svg";
import ChevronRight from "@/assets/Svgs/chevron-right.svg";
import ShareIcon from "@/assets/Svgs/square-arrow-out-up-right.svg";
import ContactIcon from "@/assets/Svgs/message-square.svg";
import EmailIcon from "@/assets/Svgs/mail.svg";
import LaptopIcon from "@/assets/Svgs/laptop.svg";
import { useUser } from '@/Hooks/userHooks.d';
import { useAuth } from '@/Hooks/authHook.d';

// Define your settings sections and items
const SETTINGS_DATA = [
  {
    title: 'Account',
    items: [
      { label: 'Profile Details', icon: UserIcon, router: "/settings/profile-details" },
      { label: 'Change Email', icon: EmailIcon, router: "/settings/email-change" },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Devices', icon: LaptopIcon, router: "/settings/devices" },
      { label: 'Change Password', icon: LockIcon, router: "/settings/change-password" },
    ],
  },
  {
    title: 'Notifications',
    items: [
      { label: 'Notification Settings', icon: BellIcon, router: "/settings/notification" },
    ],
  },
  {
    title: 'Personalization',
    items: [
      { label: 'Language', icon: LangIcon, router: "/settings/language" },
      // { label: 'Theme', icon: LangIcon, router: "/settings/theme" },
    ],
  },
  {
    title: 'About the App',
    items: [
      { label: 'App Info', icon: InfoIcon, router: "/settings/app-info" },
      { label: 'Share App', icon: ShareIcon, router: "/settings/share" },
      { label: 'Contact Support', icon: ContactIcon, router: "/settings/contact-support" },
    ],
  },
];


export default function SettingsPages() {
  const router = useRouter();
  const { user } = useUser()
  const { logout } = useAuth()

  if (!user) return

  return (
    <SafeAreaView style={{ backgroundColor: "#fff", flex: 1 }}>
      <SettingsHeader returnBtn={() => router.back()} />

      <ScrollView
        style={styles.container}
        bounces
        showsVerticalScrollIndicator={false}
      >
        {SETTINGS_DATA.map((section, sectionIndex) => (
          <View style={styles.boxContent} key={sectionIndex}>
            <Text style={styles.responseText}>{section.title}</Text>
            <View style={styles.clickContainer}>
              {section.items.map((item, itemIndex) => {
                const isLast = itemIndex === section.items.length - 1;
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    style={[styles.clicksRoute, isLast && { borderBottomWidth: 0 }]}
                    key={itemIndex}
                    onPress={() => item.router && router.push(item.router as any)}
                  >
                    <View style={styles.iconText}>
                      <Icon width={hp(2.5)} height={hp(2.5)} color="#666" />
                      <Text style={styles.routerText}>{item.label}</Text>
                    </View>
                    <ChevronRight width={hp(2.5)} height={hp(2.5)} color="#666" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => logout()}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FCFCFC",
    paddingHorizontal: hp(3),
  },
  boxContent: {
    borderWidth: 2,
    borderColor: "#eee",
    overflow: "hidden",
    borderRadius: hp(3),
    marginTop: hp(3),
  },
  responseText: {
    paddingHorizontal: hp(1.7),
    paddingTop: hp(1.7),
    fontSize: hp(1.7),
    textTransform: "uppercase",
    fontWeight: "500",
    color: "#999",
  },
  clicksRoute: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: hp(1.7),
    paddingVertical: hp(2),
    borderBottomWidth: 2,
    borderBottomColor: "#eee",
  },
  clickContainer: {
    width: "100%",
    paddingVertical: hp(1),
  },
  iconText: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: hp(1),
  },
  routerText: {
    fontSize: hp(2),
    color: "#666",
    textTransform: "capitalize",
  },
  logoutButton: {
    marginTop: hp(4),
    marginBottom: hp(4),
    backgroundColor: "#FF4D4F",
    paddingVertical: hp(1.5),
    borderRadius: hp(10),
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: hp(2),
    fontWeight: "500",
  },
});
