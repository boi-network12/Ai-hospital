import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, Modal, Alert, Platform } from 'react-native';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import CalendarIcon from '@/assets/Svgs/calendar-days.svg';
import ClockIcon from '@/assets/Svgs/clock.svg';
import EditIcon from '@/assets/Svgs/pencil.svg';
import DeleteIcon from '@/assets/Svgs/trash-2.svg';
import AvatarImg from '@/assets/images/avatar.png';
import CalenderHeader from '@/components/Headers/CalenderHeader';
import Entypo from "@expo/vector-icons/Entypo";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Appointment, useHealthcare } from '@/context/HealthContext';
import { useToast } from '@/Hooks/useToast.d';

export default function CalendarPage() {
  const { getMyBookings, updateBooking, cancelBooking } = useHealthcare();
  const { showAlert } = useToast();
  const today = new Date();
  const [currentYear, setYear] = useState(today.getFullYear());
  const [currentMonth, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [newDateTime, setNewDateTime] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<'date' | 'time' | null>(null);

  // Fetch bookings function
  const fetchBookings = useCallback(async (showLoader = true, isPullToRefresh = false) => {
    try {
      if (showLoader && !isPullToRefresh) setLoading(true);
      if (isPullToRefresh) setRefreshing(true);
      
      const response = await getMyBookings({
        page: 1,
        limit: 100,
      });
      setAppointments(response.appointments);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      showAlert({
        message: 'Failed to load appointments',
        type: 'error',
      });
    } finally {
      if (showLoader && !isPullToRefresh) setLoading(false);
      if (isPullToRefresh) setRefreshing(false);
    }
  }, [getMyBookings, showAlert]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Add this function for pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchBookings(false, true);
  }, [fetchBookings]);

  // Update refreshAppointments to use fetchBookings
  const refreshAppointments = useCallback(async () => {
    try {
      const response = await getMyBookings({ page: 1, limit: 100 });
      setAppointments(response.appointments);
    } catch (err) {
      console.error('Refresh failed:', err);
      showAlert({
        message: 'Failed to refresh appointments',
        type: 'error',
      });
    }
  }, [getMyBookings, showAlert]);

  // Group appointments by date
  const appointmentsByDate = useMemo<Record<string, Appointment[]>>(() => {
    return appointments.reduce((acc, apt) => {
      const dateKey = apt.date.split('T')[0];
      (acc[dateKey] ??= []).push(apt);
      return acc;
    }, {} as Record<string, Appointment[]>);
  }, [appointments]);

  // Calendar days logic (unchanged)
  const getMonthDays = useCallback((year: number, month: number) => {
    const toISO = (d: Date) => d.toISOString().split('T')[0];
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const days: { date: string; isCurrentMonth: boolean; isToday: boolean; hasAppointment: boolean }[] = [];

    const firstWeekday = start.getDay();
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: toISO(d), isCurrentMonth: false, isToday: false, hasAppointment: false });
    }

    for (let d = 1; d <= end.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      const iso = toISO(dateObj);
      days.push({
        date: iso,
        isCurrentMonth: true,
        isToday: iso === toISO(new Date()),
        hasAppointment: !!appointmentsByDate[iso],
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: toISO(d), isCurrentMonth: false, isToday: false, hasAppointment: false });
    }

    return days;
  }, [appointmentsByDate]);

  const formatMonth = (y: number, m: number) =>
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(y, m));

  const monthDays = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth, getMonthDays]);

  const dayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return appointmentsByDate[selectedDate] ?? [];
  }, [selectedDate, appointmentsByDate]);

  const goPrevMonth = useCallback(() => {
    const prev = new Date(currentYear, currentMonth - 1);
    setYear(prev.getFullYear());
    setMonth(prev.getMonth());
  }, [currentYear, currentMonth]);

  const goNextMonth = useCallback(() => {
    const next = new Date(currentYear, currentMonth + 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }, [currentYear, currentMonth]);

  // Edit handlers
  const openEditModal = (appt: Appointment) => {
    setEditingAppointment(appt);
    setNewDateTime(new Date(appt.date));
    setEditModalVisible(true);
  };

  const handleUpdateBooking = async () => {
    if (!editingAppointment) return;

    const validation = isValidAppointmentDateTime(newDateTime);

    if (!validation.valid) {
      showAlert({
        message: validation.message || 'Invalid date/time selected',
        type: 'info',
      });
      return; // Block the update
    }

    try {
      await updateBooking(editingAppointment.id, {
        date: newDateTime.toISOString(),
      });
      showAlert({ message: 'Appointment updated successfully', type: 'success' });
      setEditModalVisible(false);
      refreshAppointments();
    } catch (err: any) {
      showAlert({
        message: err.message || 'Failed to update appointment',
        type: 'error',
      });
    }
  };

  // Add this helper function inside the component (before handleUpdateBooking)
  const isValidAppointmentDateTime = (date: Date): { valid: boolean; message?: string } => {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = date.getHours();

    if (day === 0 || day === 6) {
      return {
        valid: false,
        message: 'Appointments cannot be scheduled on weekends (Saturday or Sunday). Please choose a weekday.',
      };
    }

    if (hours < 8 || hours >= 16) {
      return {
        valid: false,
        message: 'Appointments are only available between 8:00 AM and 4:00 PM. Please select a time within working hours.',
      };
    }

    return { valid: true };
  };

  const handleCancelBooking = (appt: Appointment) => {
    const appointmentId = appt.id || (appt as any)._id?.toString();
    
    if (!appointmentId) {
      showAlert({ message: 'Invalid appointment ID', type: 'error' });
      return;
    }

    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(appointmentId);
              showAlert({ message: 'Appointment cancelled successfully', type: 'info' });
              refreshAppointments();
            } catch {
              showAlert({ message: 'Failed to cancel appointment', type: 'error' });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CalenderHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#8089ff" />
          <Text style={{ marginTop: hp(2), fontSize: hp(2), color: '#666' }}>Loading your appointments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CalenderHeader />

      {/* Calendar Grid */}
      <View style={styles.calendarWrapper}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={goPrevMonth} hitSlop={10}>
            <Entypo name="chevron-with-circle-left" size={hp(3)} color="black" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{formatMonth(currentYear, currentMonth)}</Text>
          <TouchableOpacity onPress={goNextMonth} hitSlop={10}>
            <Entypo name="chevron-with-circle-right" size={hp(3)} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {monthDays.map((day, index) => {
            const isSelected = day.date === selectedDate;
            const isToday = day.isToday;
            const uniqueKey = `${day.date}-${currentYear}-${currentMonth}-${index}`;

            return (
              <TouchableOpacity
                key={uniqueKey}
                style={[
                  styles.dayCell,
                  !day.isCurrentMonth && styles.dayOtherMonth,
                  isSelected && styles.daySelected,
                  isToday && styles.dayToday,
                ]}
                onPress={() => day.isCurrentMonth && setSelectedDate(day.date)}
                disabled={!day.isCurrentMonth}
              >
                <Text style={[
                  styles.dayText,
                  !day.isCurrentMonth && styles.dayTextOther,
                  isSelected && styles.dayTextSelected,
                  isToday && styles.dayTextToday,
                ]}>
                  {new Date(day.date).getDate()}
                </Text>
                {day.hasAppointment && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Appointments List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {selectedDate
            ? `Appointments – ${selectedDate.replace(/-/g, '/')}`
            : 'Select a date to view appointments'}
        </Text>
      </View>

      {dayAppointments.length === 0 ? (
        <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No appointments on this day</Text>
        
        {/* Add a refresh button when no appointments */}
        <TouchableOpacity 
          onPress={onRefresh} 
          style={styles.refreshButton}
        >
          <Text style={styles.refreshButtonText}>Pull down to refresh</Text>
        </TouchableOpacity>
      </View>
      ) : (
        <FlatList
          data={dayAppointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#8089ff']} // iOS only
              tintColor="#8089ff" // iOS only
              title="Refreshing appointments..." // iOS only
              titleColor="#8089ff" 
              progressBackgroundColor="#ffffff"
            />
          }
          renderItem={({ item }) => {
            const time = new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(item.date).toISOString().split('T')[0].replace(/-/g, '/');
            const doctorName = item.professional?.name || item.professionalId?.name || 'Unknown Doctor';
            const specialization = item.professional?.profile?.specialization || item.professionalId?.profile?.specialization || 'Healthcare Professional';
            const avatar = item.professional?.profile?.avatar || item.professionalId?.profile?.avatar;

            const isPending = item.status === 'pending';

            return (
              // Inside the FlatList renderItem, update the appointmentCard section:
              <View style={styles.appointmentCard}>
                {/* Doctor Avatar */}
                <ExpoImage
                  source={avatar ? { uri: avatar } : AvatarImg}
                  style={styles.doctorAvatar}
                  transition={600}
                />
                
                {/* Main content wrapper */}
                <View style={styles.contentWrapper}>
                  {/* Top row with doctor info and actions */}
                  <View style={styles.topRow}>
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>{doctorName}</Text>
                      <Text style={styles.doctorSpecialty}>{specialization}</Text>
                    </View>
                    
                    {/* Edit & Delete Icons - only for pending */}
                    {isPending && (
                      <View style={styles.actionIcons}>
                        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconButton}>
                          <EditIcon width={hp(2.4)} height={hp(2.4)} color="#8089ff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleCancelBooking(item)} style={styles.iconButton}>
                          <DeleteIcon width={hp(2.4)} height={hp(2.4)} color="#dc3545" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  
                  {/* Time and status section */}
                  <View style={styles.bottomSection}>
                    <View style={styles.timeRow}>
                      <CalendarIcon width={hp(2)} height={hp(2)} color="#8089ff" />
                      <Text style={styles.timeText}>{dateStr}</Text>
                      <View style={{ width: hp(2) }} />
                      <ClockIcon width={hp(2)} height={hp(2)} color="#8089ff" />
                      <Text style={styles.timeText}>{time}</Text>
                    </View>
                    
                    <Text style={styles.statusText}>
                      Status:{' '}
                      <Text style={{ fontWeight: '600', color: getStatusColor(item.status) }}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>

            <TouchableOpacity onPress={() => setShowPicker('date')} style={styles.pickerButton}>
              <Text style={styles.pickerText}>
                Date: {newDateTime.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowPicker('time')} style={styles.pickerButton}>
              <Text style={styles.pickerText}>
                Time: {newDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={newDateTime}
                mode={showPicker}
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selected) => {
                  if (selected) {
                    setNewDateTime(selected);
                  }
                  setShowPicker(null);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateBooking} style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return '#28a745';
    case 'pending': return '#ffc107';
    case 'completed': return '#17a2b8';
    case 'cancelled': return '#dc3545';
    case 'rejected': return '#dc3545';
    default: return '#666';
  }
};


const styles = StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(8),
  },
  
  // Calendar Styles
  calendarWrapper: {
    paddingHorizontal: hp(2),
    paddingTop: hp(2),
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  monthTitle: {
    fontFamily: 'Roboto-Bold',
    fontSize: hp(2),
    color: '#8089ff',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(0.5),
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: 'Roboto-Medium',
    fontSize: hp(1.6),
    color: '#555',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  // Day Cell Styles
  dayCell: {
    width: `${100 / 7}%`,
    height: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayOtherMonth: {
    opacity: 0.3,
  },
  daySelected: {
    backgroundColor: '#8089ff',
    borderRadius: hp(1),
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: '#8089ff',
    borderRadius: hp(1),
  },
  dayText: {
    fontSize: hp(1.9),
    color: '#222',
  },
  dayTextOther: {
    color: '#aaa',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  dayTextToday: {
    color: '#8089ff',
    fontWeight: '600',
  },
  dot: {
    position: 'absolute',
    bottom: hp(0.8),
    width: hp(0.8),
    height: hp(0.8),
    borderRadius: hp(0.4),
    backgroundColor: '#8089ff',
  },
  
  // List & Header Styles
  listHeader: {
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.5),
  },
  listTitle: {
    fontFamily: 'Roboto-Bold',
    fontSize: hp(1.9),
    color: '#444',
  },
  listContent: {
    paddingHorizontal: hp(2),
    paddingBottom: hp(4),
  },
  
  // Appointment Card Styles
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: hp(1.2),
    padding: hp(1.5),
    marginBottom: hp(1.5),
    borderWidth: 0.7,
    borderColor: '#eee',
    flexDirection: 'row',
  },
  doctorAvatar: {
    width: hp(7),
    height: hp(7),
    borderRadius: hp(1.2),
    marginRight: hp(1.5),
  },
  contentWrapper: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1),
  },
  doctorInfo: {
    flex: 1,
    marginRight: hp(1),
  },
  doctorName: {
    fontFamily: 'Roboto-Bold',
    fontSize: hp(1.9),
    color: '#333',
  },
  doctorSpecialty: {
    fontSize: hp(1.5),
    color: '#888',
    marginTop: hp(0.2),
  },
  bottomSection: {
    marginTop: hp(0.5),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hp(0.8),
  },
  timeText: {
    fontSize: hp(1.6),
    color: '#8089ff',
    fontWeight: '600',
  },
  statusText: {
    marginTop: hp(1),
    fontSize: hp(1.5),
    color: '#666',
  },
  
  // Action Icons
  actionIcons: {
    flexDirection: 'row',
    gap: hp(1.5),
    flexShrink: 0,
  },
  iconButton: {
    padding: hp(0.8),
  },
  
  // Empty State
  emptyText: {
    fontSize: hp(2),
    color: '#777',
    fontFamily: 'Roboto-Medium',
  },
  refreshButton: {
    marginTop: hp(2),
    paddingHorizontal: hp(2),
    paddingVertical: hp(1),
    backgroundColor: '#f0f0f0',
    borderRadius: hp(1),
  },
  refreshButtonText: {
    fontSize: hp(1.6),
    color: '#8089ff',
    fontFamily: 'Roboto-Medium',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: hp(2),
    padding: hp(3),
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    marginBottom: hp(2),
    color: '#333',
  },
  pickerButton: {
    backgroundColor: '#f0f0f0',
    padding: hp(1.5),
    borderRadius: hp(1),
    marginVertical: hp(1),
    width: '100%',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: hp(1.9),
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: hp(3),
  },
  cancelBtn: {
    padding: hp(1.5),
    backgroundColor: '#ddd',
    borderRadius: hp(1),
    flex: 1,
    marginRight: hp(1),
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: hp(1.8),
    color: '#666',
  },
  confirmBtn: {
    padding: hp(1.5),
    backgroundColor: '#8089ff',
    borderRadius: hp(1),
    flex: 1,
    marginLeft: hp(1),
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: hp(1.8),
    color: '#fff',
    fontWeight: '600',
  },
});