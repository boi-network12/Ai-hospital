// src/app/(tabs)/professional/AppointmentsPage.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { router } from 'expo-router';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';
import { format, addMinutes } from 'date-fns';
import { useHealthcare } from '@/context/HealthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';

export default function ProfessionalAppointmentsPage() {
  const {
    getMyAppointments,
    updateAppointmentStatus,
    updateBooking,
    healthcare: { loading },
  } = useHealthcare();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date());
  const [rescheduleDuration, setRescheduleDuration] = useState<string>('60');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadAppointments = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
      }

      const response = await getMyAppointments({
        page: refresh ? 1 : page,
        limit: 20,
      });

      if (refresh) {
        setAppointments(response.appointments);
      } else {
        setAppointments(prev => [...prev, ...response.appointments]);
      }

      setHasMore(response.page < response.totalPages);
      if (!refresh) setPage(prev => prev + 1);
    } catch {
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setRefreshing(false);
    }
  }, [page, getMyAppointments]);

  useEffect(() => {
    loadAppointments(true);
  }, [loadAppointments]);

  const handleStatusUpdate = async (appointmentId: string, status: 'confirmed' | 'rejected' | 'completed' | 'cancelled') => {
    const statusMessages = {
      confirmed: 'Confirm Appointment',
      rejected: 'Reject Appointment',
      completed: 'Mark as Completed',
      cancelled: 'Cancel Appointment'
    };

    Alert.alert(
      statusMessages[status],
      `Are you sure you want to ${status} this appointment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateAppointmentStatus(appointmentId, status);
              // Optimistically update UI
              setAppointments(prev =>
                prev.map(apt =>
                  apt.id === appointmentId ? { ...apt, status } : apt
                )
              );
              Alert.alert('Success', `Appointment ${status} successfully`);
            } catch {
              Alert.alert('Error', 'Failed to update appointment status');
            }
          },
        },
      ]
    );
  };

  const handleReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setRescheduleDate(new Date(appointment.date));
    setRescheduleDuration(appointment.duration.toString());
    setShowRescheduleModal(true);
  };

  const submitReschedule = async () => {
    if (!selectedAppointment) return;

    try {
      await updateBooking(selectedAppointment.id, {
        date: rescheduleDate.toISOString(),
        duration: parseInt(rescheduleDuration),
      });

      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === selectedAppointment.id
            ? {
                ...apt,
                date: rescheduleDate.toISOString(),
                duration: parseInt(rescheduleDuration),
                endDate: addMinutes(rescheduleDate, parseInt(rescheduleDuration)).toISOString(),
              }
            : apt
        )
      );

      setShowRescheduleModal(false);
      Alert.alert('Success', 'Appointment rescheduled successfully!');
    } catch{
      Alert.alert('Error', 'Failed to reschedule appointment');
    }
  };

  const renderStatusButtons = (item: any) => {
    const appointmentId = item.id || item._id; 
    const isPending = item.status === 'pending';
    const isConfirmed = item.status === 'confirmed';
    const isPast = new Date(item.date) < new Date();

    return (
        <View style={styles.actions}>
            {isPending && (
                <>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.confirmBtn]}
                        onPress={() => handleStatusUpdate(appointmentId, 'confirmed')}
                    >
                        <Text style={styles.actionText}>✅ Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleStatusUpdate(appointmentId, 'rejected')}
                    >
                        <Text style={styles.actionText}>❌ Reject</Text>
                    </TouchableOpacity>
                </>
            )}

            {isConfirmed && (
                <>
                    {!isPast && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.rescheduleBtn]}
                                onPress={() => handleReschedule(item)}
                            >
                                <Text style={styles.actionText}>🔄 Reschedule</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.cancelBtn]}
                                onPress={() => handleStatusUpdate(appointmentId, 'cancelled')}
                            >
                                <Text style={styles.actionText}>🗑️ Cancel</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.completeBtn]}
                        onPress={() => handleStatusUpdate(appointmentId, 'completed')}
                    >
                        <Text style={styles.actionText}>✅ {isPast ? 'Mark Completed' : 'Complete Now'}</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* ... rest of the code */}
        </View>
    );
};

  const renderAppointment = ({ item }: { item: any }) => {
    const patientName = item.patient?.name || 
                       item.patientId?.name || 
                       'Unknown Patient';
    
    const patientAvatar = item.patient?.profile?.avatar || 
                         item.patientId?.profile?.avatar;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.patientInfo}>
            {patientAvatar && (
              <Image
                source={{ uri: patientAvatar }} 
                style={styles.avatar}
              />
            )}
            <View style={styles.patientDetails}>
              <Text style={styles.patientName}>{patientName}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.appointmentType}>
                  {item.type === 'virtual' ? '🖥️ Virtual' : '🏥 Physical'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#666" />
            <Text style={styles.detailText}>
              {format(new Date(item.date), 'EEE, MMM dd, yyyy')}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={16} color="#666" />
            <Text style={styles.detailText}>
              {format(new Date(item.date), 'hh:mm a')} • {item.duration} mins
            </Text>
          </View>

          {item.patient?.phoneNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📞 Phone:</Text>
              <Text style={styles.detailText}>{item.patient.phoneNumber}</Text>
            </View>
          )}

          {item.patient?.email && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>✉️ Email:</Text>
              <Text style={styles.detailText}>{item.patient.email}</Text>
            </View>
          )}

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </View>

        {renderStatusButtons(item)}
      </View>
    );
  };

  const RescheduleModal = () => (
    <Modal
      visible={showRescheduleModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Reschedule Appointment</Text>
          
          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalLabel}>Select Date:</Text>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {format(rescheduleDate, 'MMMM dd, yyyy')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Select Time:</Text>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {format(rescheduleDate, 'hh:mm a')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Duration (minutes):</Text>
            <View style={styles.durationContainer}>
              {['30', '45', '60', '90'].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationBtn,
                    rescheduleDuration === duration && styles.durationBtnActive
                  ]}
                  onPress={() => setRescheduleDuration(duration)}
                >
                  <Text style={[
                    styles.durationText,
                    rescheduleDuration === duration && styles.durationTextActive
                  ]}>
                    {duration} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={rescheduleDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    // Combine with existing time
                    const newDate = new Date(date);
                    newDate.setHours(rescheduleDate.getHours());
                    newDate.setMinutes(rescheduleDate.getMinutes());
                    setRescheduleDate(newDate);
                  }
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={rescheduleDate}
                mode="time"
                display="default"
                onChange={(event, date) => {
                  setShowTimePicker(false);
                  if (date) {
                    // Combine with existing date
                    const newDate = new Date(rescheduleDate);
                    newDate.setHours(date.getHours());
                    newDate.setMinutes(date.getMinutes());
                    setRescheduleDate(newDate);
                  }
                }}
              />
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelModalBtn]}
              onPress={() => setShowRescheduleModal(false)}
            >
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.confirmModalBtn]}
              onPress={submitReschedule}
            >
              <Text style={styles.confirmModalText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GeneralSettingsHeader
        title="My Appointments"
        returnBtn={() => router.back()}
      />

      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Confirmed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Today</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={item => item.id || item._id || Math.random().toString()}
        renderItem={renderAppointment}
        refreshControl={
            <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => loadAppointments(true)} 
            />
        }
        onEndReached={() => hasMore && !refreshing && loadAppointments()}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
            !loading && appointments.length === 0 ? (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>No appointments yet</Text>
                <Text style={styles.emptySubtext}>
                When you have appointments, they&apos;ll appear here
                </Text>
            </View>
            ) : null
        }
        ListFooterComponent={
            loading && page > 1 ? (
            <ActivityIndicator style={{ margin: 20 }} />
            ) : null
        }
        contentContainerStyle={
            appointments.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        />

      <RescheduleModal />
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#f39c12';
    case 'confirmed': return '#27ae60';
    case 'completed': return '#3498db';
    case 'cancelled': return '#95a5a6';
    case 'rejected': return '#e74c3c';
    default: return '#7f8c8d';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.5),
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  listContainer: {
    paddingBottom: hp(2),
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtn: {
    paddingHorizontal: hp(1.6), // ~16px on standard screen
    paddingVertical: hp(0.8),   // ~8px on standard screen
    marginRight: hp(1),         // ~10px on standard screen
    backgroundColor: '#f0f0f0',
    borderRadius: hp(2), 
  },
  filterText: {
    fontSize: hp(1.8),
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: hp(2),
    marginVertical: hp(1),
    padding: hp(2),
    borderRadius: hp(2),
  },
  header: {
    marginBottom: hp(1.5),
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    marginRight: hp(1.5),
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: hp(2.3),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: hp(1.4),
  },
  appointmentType: {
    fontSize: hp(1.6),
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  detailsContainer: {
    backgroundColor: '#f9f9f9',
    padding: hp(1.5),
    borderRadius: 12,
    marginBottom: hp(1.5),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  detailLabel: {
    fontSize: hp(1.7),
    color: '#666',
    width: 70,
  },
  detailText: {
    fontSize: hp(1.7),
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  notesContainer: {
    marginTop: hp(1),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  notesLabel: {
    fontSize: hp(1.6),
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: hp(1.7),
    color: '#444',
    lineHeight: hp(2.2),
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmBtn: { backgroundColor: '#27ae60' },
  rejectBtn: { backgroundColor: '#e74c3c' },
  completeBtn: { backgroundColor: '#3498db' },
  cancelBtn: { backgroundColor: '#95a5a6' },
  rescheduleBtn: { backgroundColor: '#9b59b6' },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: hp(1.6),
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(20),
    paddingHorizontal: hp(4),
  },
  emptyText: {
    fontSize: hp(2.5),
    color: '#666',
    fontWeight: '600',
    marginBottom: hp(1),
  },
  emptySubtext: {
    fontSize: hp(1.9),
    color: '#999',
    textAlign: 'center',
    lineHeight: hp(2.5),
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: hp(2),
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    padding: hp(2.5),
  },
  modalTitle: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: hp(40),
  },
  modalLabel: {
    fontSize: hp(1.8),
    color: '#666',
    marginBottom: hp(1),
    fontWeight: '600',
  },
  dateTimeButton: {
    backgroundColor: '#f0f0f0',
    padding: hp(1.5),
    borderRadius: 12,
    marginBottom: hp(2),
  },
  dateTimeText: {
    fontSize: hp(1.8),
    color: '#333',
    textAlign: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: hp(2),
  },
  durationBtn: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  durationBtnActive: {
    backgroundColor: '#3498db',
  },
  durationText: {
    fontSize: hp(1.6),
    color: '#666',
    fontWeight: '500',
  },
  durationTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2),
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalBtn: {
    backgroundColor: '#f0f0f0',
  },
  confirmModalBtn: {
    backgroundColor: '#3498db',
  },
  cancelModalText: {
    fontSize: hp(1.8),
    color: '#666',
    fontWeight: '600',
  },
  confirmModalText: {
    fontSize: hp(1.8),
    color: '#fff',
    fontWeight: '600',
  },
});