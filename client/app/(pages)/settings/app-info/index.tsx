import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Linking,
  TouchableOpacity
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';
import { useRouter } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

export default function AppInfo() {
  const router = useRouter();

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.log("Failed to open link:", err));
  };

  // Update these values to the correct version/build
  const appName = "Neuromed";
  const version = "1.0.0";        // replace with actual version
  const build = "2025.11.09";     // replace with actual build

  return (
    <SafeAreaView style={styles.container}>
      <GeneralSettingsHeader
        title="App Info"
        returnBtn={() => router.back()}
      />

      <ScrollView
        bounces
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Optional app icon/logo */}
        
        {/* App Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the App</Text>
          <Text style={styles.text}>
            App Name: <Text style={styles.highlight}>{appName}</Text>
          </Text>
          <Text style={styles.text}>
            Version: <Text style={styles.highlight}>{version}</Text>
          </Text>
          <Text style={styles.text}>
            Build: <Text style={styles.highlight}>{build}</Text>
          </Text>
        </View>

        {/* Company / Developer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <Text style={styles.text}>
            Name: <Text style={styles.highlight}>Kamdi Samuel</Text>
          </Text>
          <Text style={styles.text}>
            Email:{' '}
            <Text
              style={[styles.linkText]}
              onPress={() => openLink("mailto:kamdi@neuromedapp.com")}
            >
              kamdi@neuromedapp.com
            </Text>
          </Text>
          <Text style={styles.text}>
            Website:{' '}
            <Text
              style={[styles.linkText]}
              onPress={() => openLink("https://kamdidev.vercel.app")}
            >
              kamdidev.vercel.app
            </Text>
          </Text>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Text style={styles.text}>
            For feedback or help, get in touch with us via email.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push("/settings/contact-support")}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity onPress={() => openLink("https://neuromedapp.com/privacy")}>
            <Text style={[styles.linkText, { marginTop: hp(0.5) }]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openLink("https://neuromedapp.com/terms")}>
            <Text style={[styles.linkText, { marginTop: hp(0.5) }]}>
              Terms of Service
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  scrollContainer: {
    backgroundColor: "#F8F8F8",
    paddingHorizontal: hp(2),
    paddingVertical: hp(3),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: hp(2),
  },
  logo: {
    width: wp(30),
    height: wp(30),
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: hp(1.5),
    padding: hp(2),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#eee",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: hp(2.0),
    fontWeight: "600",
    color: "#333",
    marginBottom: hp(1),
  },
  text: {
    fontSize: hp(1.6),
    color: "#555",
    marginBottom: hp(0.6),
    lineHeight: hp(2.4),
  },
  highlight: {
    fontWeight: "700",
    color: "#333",
  },
  linkText: {
    fontSize: hp(1.6),
    color: "#4178F3",
    fontWeight: "500",
  },
  contactButton: {
    marginTop: hp(1.5),
    alignItems: "center",
    backgroundColor: "#8089ff",
    paddingVertical: hp(1.2),
    borderRadius: hp(1.2),
  },
  contactButtonText: {
    color: "#fff",
    fontSize: hp(1.7),
    fontWeight: "600",
  },
});
