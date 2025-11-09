import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Share } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';
import { router } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ShareApp() {
  const appName = "Neuromed";
  const appLink = "https://neuromedapp.com"; // Replace with your real app link

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${appName}! Download it here: ${appLink}`,
      });
    } catch (error) {
      console.log("Error sharing app:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GeneralSettingsHeader
        title="Share App"
        returnBtn={() => router.back()}
      />

      <ScrollView
        bounces
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Share {appName}</Text>
          <Text style={styles.headerSubtitle}>
            Let your friends know about {appName} and improve their health journey!
          </Text>
        </View>

        {/* Share Options */}
        <View style={styles.shareSection}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={hp(3)} color="#333" />
            <Text style={styles.shareText}>Share via Apps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => navigator.clipboard.writeText(appLink)}
          >
            <MaterialCommunityIcons name="link-variant" size={hp(3)} color="#333" />
            <Text style={styles.shareText}>Copy Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => window.open(`mailto:?subject=Check out ${appName}&body=Download ${appName} here: ${appLink}`, '_blank')}
          >
            <Ionicons name="mail-outline" size={hp(3)} color="#333" />
            <Text style={styles.shareText}>Share via Email</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Info */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            Sharing helps others discover {appName} and enjoy its full benefits!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(3),
  },
  headerSection: {
    marginBottom: hp(4),
    alignItems: "center",
  },
  headerTitle: {
    fontSize: hp(3),
    fontWeight: "700",
    color: "#111",
    marginBottom: hp(1),
  },
  headerSubtitle: {
    fontSize: hp(2),
    color: "#555",
    textAlign: "center",
    lineHeight: hp(3),
  },
  shareSection: {
    marginBottom: hp(4),
    gap: hp(2),
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0e0e0",
    paddingVertical: hp(1.5),
    borderRadius: hp(1),
    gap: wp(3),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  shareText: {
    color: "#111",
    fontSize: hp(2),
    fontWeight: "600",
  },
  footerSection: {
    alignItems: "center",
    marginTop: hp(2),
  },
  footerText: {
    fontSize: hp(1.8),
    color: "#666",
    textAlign: "center",
    lineHeight: hp(2.6),
  },
});
