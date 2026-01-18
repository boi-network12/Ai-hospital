// NoReportsYet.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import FileTextIcon from "@/assets/Svgs/file-text.svg";

const NoReportsYet = () => {
  return (
    <View style={styles.container}>
      {/* Illustration/Icon */}
      <View style={styles.illustration}>
        <View style={styles.iconContainer}>
          <FileTextIcon width={hp(6)} height={hp(6)} color="#8089ff" />
        </View>
      </View>

      {/* Main Message */}
      <Text style={styles.mainText}>Reports Feature Coming Soon!</Text>
      
      {/* Sub Message */}
      <Text style={styles.subText}>
        We&apos;re currently building this feature to help you manage your medical reports.
      </Text>

      {/* Timeline/Progress */}
      <View style={styles.timeline}>
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, styles.activeDot]} />
          <Text style={styles.timelineText}>In Development</Text>
        </View>
        
        <View style={styles.timelineSeparator} />
        
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, styles.inactiveDot]} />
          <Text style={[styles.timelineText, styles.inactiveText]}>Testing Phase</Text>
        </View>
        
        <View style={styles.timelineSeparator} />
        
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, styles.inactiveDot]} />
          <Text style={[styles.timelineText, styles.inactiveText]}>Launch 🎉</Text>
        </View>
      </View>

      {/* Status Message */}
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>Expected Launch: Q2 2024</Text>
      </View>

      {/* Fun Message */}
      <Text style={styles.funMessage}>
        Good things come to those who wait! ⏳
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    padding: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    marginBottom: hp(3),
  },
  iconContainer: {
    width: hp(12),
    height: hp(12),
    borderRadius: hp(6),
    backgroundColor: 'rgba(128, 137, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainText: {
    fontSize: hp(2.5),
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  subText: {
    fontSize: hp(1.7),
    color: '#666',
    textAlign: 'center',
    lineHeight: hp(2.4),
    marginBottom: hp(4),
    paddingHorizontal: hp(2),
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(4),
    paddingHorizontal: hp(2),
  },
  timelineItem: {
    alignItems: 'center',
  },
  timelineDot: {
    width: hp(2),
    height: hp(2),
    borderRadius: hp(1),
    marginBottom: hp(1),
  },
  activeDot: {
    backgroundColor: '#8089ff',
    borderWidth: 3,
    borderColor: 'rgba(128, 137, 255, 0.3)',
  },
  inactiveDot: {
    backgroundColor: '#E0E0E0',
  },
  timelineSeparator: {
    width: hp(6),
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: hp(1),
  },
  timelineText: {
    fontSize: hp(1.4),
    color: '#8089ff',
    fontWeight: '600',
  },
  inactiveText: {
    color: '#999',
  },
  statusBox: {
    backgroundColor: 'rgba(128, 137, 255, 0.1)',
    paddingVertical: hp(1),
    paddingHorizontal: hp(3),
    borderRadius: hp(1),
    marginBottom: hp(2),
  },
  statusText: {
    fontSize: hp(1.6),
    color: '#8089ff',
    fontWeight: '600',
  },
  funMessage: {
    fontSize: hp(1.6),
    color: '#888',
    fontStyle: 'italic',
  },
});

export default NoReportsYet;