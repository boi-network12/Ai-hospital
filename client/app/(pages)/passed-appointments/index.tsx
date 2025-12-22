// app/passed-appointments.tsx (or your route path)
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthcare } from '@/context/HealthContext';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Image } from 'expo-image';
import AvatarImg from '@/assets/images/avatar.png';
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import CalenderIcon from '@/assets/Svgs/calendar-days.svg';
import ClockIcon from '@/assets/Svgs/clock.svg';
import StethoscopeIcon from '@/assets/Svgs/stethoscope.svg';
import { router } from 'expo-router';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';

const blurhash = BLUR_HASH_PLACEHOLDER;

export default function PassedAppointments() {
  const insets = useSafeAreaInsets();
  const {
    getPastAppointments,
    pastAppointments,
    pastAppointmentsLoading,
  } = useHealthcare();

  useEffect(() => {
    getPastAppointments({ limit: 20 });
  }, [getPastAppointments]);

  const renderAppointment = ({ item }: { item: any }) => {
    const appointmentDate = new Date(item.date);

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Image
            placeholder={blurhash}
            source={
              item.professional?.profile?.avatar
                ? { uri: item.professional.profile.avatar }
                : AvatarImg
            }
            style={styles.avatar}
          />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>
              Dr. {item.professional?.name || 'Unknown Doctor'}
            </Text>
            <Text style={styles.specialization}>
              {item.professional?.profile?.specialization || 'Specialist'}
              {item.professional?.profile?.department
                ? ` • ${item.professional.profile.department}`
                : ''}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              item.status === 'completed'
                ? styles.completedBadge
                : item.status === 'cancelled'
                ? styles.cancelledBadge
                : styles.rejectedBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.infoItem}>
            <CalenderIcon width={hp(2)} height={hp(2)} color="#8089ff" />
            <Text style={styles.infoText}>
              {appointmentDate.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <ClockIcon width={hp(2)} height={hp(2)} color="#8089ff" />
            <Text style={styles.infoText}>
              {appointmentDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.typeRow}>
          <StethoscopeIcon width={hp(1.8)} height={hp(1.8)} color="#8089ff" />
          <Text style={styles.typeText}>
            {item.type === 'physical'
              ? 'In-Person Consultation'
              : 'Virtual Consultation'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />

      {/* Custom Header */}
        <GeneralSettingsHeader
            title="Past Appointments"
            returnBtn={() => router.back()}
        />

      {/* Main Content */}
      {pastAppointmentsLoading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading past appointments...</Text>
        </View>
      ) : pastAppointments.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No past appointments found</Text>
          <Text style={styles.emptySubtext}>
            Your completed, cancelled, or rejected consultations will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pastAppointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAppointment}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: hp(2) }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hp(2),
    paddingVertical: hp(2),
    paddingTop: Platform.OS === 'android' ? hp(1) : hp(0.5),
    backgroundColor: '#f8f9ff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: hp(1),
    zIndex: 10,
  },
  headerTitle: {
    fontSize: hp(2.6),
    fontWeight: '700',
    color: '#333',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
  },
  spacer: {
    width: hp(5),
  },
  listContent: {
    paddingHorizontal: hp(2),
    paddingTop: hp(2),
    paddingBottom: hp(10),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: hp(1.5),
    padding: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  avatar: {
    width: hp(7),
    height: hp(7),
    borderRadius: hp(1.2),
    marginRight: hp(1.5),
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: hp(2.1),
    fontWeight: '600',
    color: '#333',
  },
  specialization: {
    fontSize: hp(1.6),
    color: '#777',
    marginTop: hp(0.3),
  },
  statusBadge: {
    paddingHorizontal: hp(1.4),
    paddingVertical: hp(0.7),
    borderRadius: hp(2),
  },
  completedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  cancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  rejectedBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  statusText: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: '#222',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hp(0.8),
    backgroundColor: 'rgba(128, 137, 255, 0.1)',
    paddingHorizontal: hp(1.2),
    paddingVertical: hp(0.8),
    borderRadius: hp(0.8),
    flex: 0.48,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: hp(1.55),
    color: '#8089ff',
    fontWeight: '500',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hp(0.8),
    marginTop: hp(0.5),
  },
  typeText: {
    fontSize: hp(1.7),
    color: '#555',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: hp(6),
  },
  loadingText: {
    fontSize: hp(2.2),
    color: '#999',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: hp(2.6),
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
    marginBottom: hp(1.5),
  },
  emptySubtext: {
    fontSize: hp(1.9),
    color: '#999',
    textAlign: 'center',
    lineHeight: hp(2.8),
  },
});