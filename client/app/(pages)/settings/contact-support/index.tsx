import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ContactSupport() {
  const supportEmail = "support@neuromedapp.com";
  const supportPhone = "+234 8012345678";

  const handleEmail = () => Linking.openURL(`mailto:${supportEmail}`).catch(console.log);
  const handleCall = () => Linking.openURL(`tel:${supportPhone}`).catch(console.log);
  const handleChat = () => Linking.openURL("https://neuromedapp.com/support-chat").catch(console.log);

  return (
    <SafeAreaView style={styles.container}>
      <GeneralSettingsHeader title="Contact Support" returnBtn={() => router.back()} />

      <ScrollView
        bounces
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <Text style={styles.headerSubtitle}>
            Reach out to our support team. We&apos;re here to help you with any questions or issues.
          </Text>
        </View>

        {/* Support Methods */}
        <View style={styles.cardsContainer}>
          {/* Email */}
          <TouchableOpacity style={styles.card} onPress={handleEmail}>
            <Ionicons name="mail-outline" size={hp(3)} color="#444" />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Email Support</Text>
              <Text style={styles.cardSubtitle}>Send us an email and we&apos;ll reply promptly.</Text>
            </View>
            <Ionicons name="chevron-forward" size={hp(2.5)} color="#999" />
          </TouchableOpacity>

          {/* Call */}
          <TouchableOpacity style={styles.card} onPress={handleCall}>
            <Ionicons name="call-outline" size={hp(3)} color="#444" />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Call Support</Text>
              <Text style={styles.cardSubtitle}>Speak directly with our support team.</Text>
            </View>
            <Ionicons name="chevron-forward" size={hp(2.5)} color="#999" />
          </TouchableOpacity>

          {/* Chat */}
          <TouchableOpacity style={styles.card} onPress={handleChat}>
            <MaterialIcons name="chat-bubble-outline" size={hp(3)} color="#444" />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Live Chat</Text>
              <Text style={styles.cardSubtitle}>Get instant responses via chat.</Text>
            </View>
            <Ionicons name="chevron-forward" size={hp(2.5)} color="#999" />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Quick FAQs</Text>
          <Text style={styles.faqText}>
            • How to reset my password?{'\n'}
            • How to update my profile information?{'\n'}
            • How to report technical issues?{'\n'}
            • Where to find the privacy policy?
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            Our team usually responds within 24 hours.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { paddingHorizontal: hp(2), paddingVertical: hp(2) },
  headerSection: { marginBottom: hp(3) },
  headerTitle: { fontSize: hp(2.3), fontWeight: "700", color: "#222", marginBottom: hp(0.5) },
  headerSubtitle: { fontSize: hp(1.6), color: "#666", lineHeight: hp(2.2) },
  cardsContainer: { gap: hp(1.5) },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    padding: hp(2),
    borderRadius: hp(1.5),
    gap: wp(3),
  },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: hp(1.8), fontWeight: "600", color: "#222", marginBottom: hp(0.3) },
  cardSubtitle: { fontSize: hp(1.4), color: "#555" },
  faqSection: { marginTop: hp(3), padding: hp(2), backgroundColor: "#fff", borderRadius: hp(1.5), borderWidth: 1, borderColor: "#eee" },
  faqTitle: { fontSize: hp(1.8), fontWeight: "600", color: "#222", marginBottom: hp(0.8) },
  faqText: { fontSize: hp(1.5), color: "#555", lineHeight: hp(2.2) },
  footerSection: { marginTop: hp(3), alignItems: "center" },
  footerText: { fontSize: hp(1.5), color: "#666", textAlign: "center" },
});
