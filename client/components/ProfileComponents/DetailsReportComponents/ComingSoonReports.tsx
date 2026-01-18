// ComingSoonReports.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import CalendarIcon from "@/assets/Svgs/calendar-days.svg";
import ClockIcon from "@/assets/Svgs/clock.svg";
import FileTextIcon from "@/assets/Svgs/file-text.svg";

const ComingSoonReports = () => {
  return (
    <View style={styles.container}>
      {/* Animated/Decorative Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <FileTextIcon width={hp(4)} height={hp(4)} color="#8089ff" />
        </View>
        <Text style={styles.title}>Medical Reports</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
      </View>

      {/* Progress/Info Section */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <CalendarIcon width={hp(2.5)} height={hp(2.5)} color="#4CAF50" />
          <Text style={styles.infoText}>Next Update: Loading...</Text>
        </View>
        
        <View style={styles.infoRow}>
          <ClockIcon width={hp(2.5)} height={hp(2.5)} color="#FF9800" />
          <Text style={styles.infoText}>Your reports will appear here</Text>
        </View>
      </View>

      {/* Feature Preview */}
      <View style={styles.featureContainer}>
        <Text style={styles.featureTitle}>What to expect:</Text>
        
        <View style={styles.featureItem}>
          <View style={[styles.featureDot, { backgroundColor: '#8089ff' }]} />
          <Text style={styles.featureText}>Upload prescriptions & lab reports</Text>
        </View>
        
        <View style={styles.featureItem}>
          <View style={[styles.featureDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.featureText}>Secure cloud storage</Text>
        </View>
        
        <View style={styles.featureItem}>
          <View style={[styles.featureDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.featureText}>Share with doctors easily</Text>
        </View>
      </View>

      {/* Bottom Message */}
      <View style={styles.bottomMessage}>
        <Text style={styles.messageText}>
          We&apos;re working hard to bring you the best experience.
          Check back soon! 🚀
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
    padding: hp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  iconCircle: {
    width: hp(8),
    height: hp(8),
    borderRadius: hp(4),
    backgroundColor: 'rgba(128, 137, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  title: {
    fontSize: hp(2.8),
    fontWeight: '700',
    color: '#333',
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: hp(1.8),
    color: '#8089ff',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: hp(2),
    padding: hp(2.5),
    width: '100%',
    marginBottom: hp(3),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  infoText: {
    fontSize: hp(1.7),
    color: '#555',
    marginLeft: hp(1.5),
    fontWeight: '500',
  },
  featureContainer: {
    backgroundColor: 'white',
    borderRadius: hp(2),
    padding: hp(2.5),
    width: '100%',
    marginBottom: hp(3),
    borderWidth: 1,
    borderColor: 'rgba(128, 137, 255, 0.2)',
  },
  featureTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp(2),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  featureDot: {
    width: hp(1),
    height: hp(1),
    borderRadius: hp(0.5),
    marginRight: hp(1.5),
  },
  featureText: {
    fontSize: hp(1.6),
    color: '#666',
  },
  bottomMessage: {
    backgroundColor: 'rgba(128, 137, 255, 0.1)',
    padding: hp(2),
    borderRadius: hp(1.5),
    borderLeftWidth: 4,
    borderLeftColor: '#8089ff',
  },
  messageText: {
    fontSize: hp(1.6),
    color: '#555',
    textAlign: 'center',
    lineHeight: hp(2.2),
  },
});

export default ComingSoonReports;