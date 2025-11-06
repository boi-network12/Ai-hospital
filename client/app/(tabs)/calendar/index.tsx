import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import React, { useMemo, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import CalendarIcon from '@/assets/Svgs/calendar-days.svg';
import ClockIcon from '@/assets/Svgs/clock.svg';
import AvatarImg from '@/assets/images/avatar.png';
import CalenderHeader from '@/components/Headers/CalenderHeader';
import Entypo from "@expo/vector-icons/Entypo"

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  time: string; // "08:00"
  date: string; // ISO "2025-11-12"
  avatar?: any;
}

/* --------------------------------------------------------------
   Mock data (replace with your API later)
   -------------------------------------------------------------- */
const _appointments: Appointment[] = [
  {
    id: '1',
    doctor: 'Dr. Inara Isani',
    specialty: 'Heart Surgeon, Delhi',
    time: '08:00',
    date: '2025-11-12',
    avatar: AvatarImg,
  },
  {
    id: '2',
    doctor: 'Dr. Michael Brown',
    specialty: 'Neurologist, Lagos',
    time: '14:30',
    date: '2025-11-12',
    avatar: AvatarImg,
  },
  {
    id: '3',
    doctor: 'Dr. Sarah Lee',
    specialty: 'Pediatrician, Abuja',
    time: '10:15',
    date: '2025-11-20',
    avatar: AvatarImg,
  },
];

/* --------------------------------------------------------------
   Group appointments by date (same as before)
   -------------------------------------------------------------- */
const appointmentsByDate = _appointments.reduce<Record<string, Appointment[]>>(
  (acc, apt) => {
    (acc[apt.date] ??= []).push(apt);
    return acc;
  },
  {}
);

/* --------------------------------------------------------------
   Helper: get all days of a month (array of {date, isCurrentMonth, isToday})
   -------------------------------------------------------------- */
function getMonthDays(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0); // last day of month

  const days: {
    date: string; // YYYY-MM-DD
    isCurrentMonth: boolean;
    isToday: boolean;
    hasAppointment: boolean;
  }[] = [];

  // pad with previous month days
  const firstWeekday = start.getDay(); // 0 = Sun
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({
      date: toISO(d),
      isCurrentMonth: false,
      isToday: false,
      hasAppointment: false,
    });
  }

  // current month
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

  // pad with next month days to fill 6 rows (42 cells)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: toISO(d),
      isCurrentMonth: false,
      isToday: false,
      hasAppointment: false,
    });
  }

  return days;
}

/* --------------------------------------------------------------
   Tiny utils
   -------------------------------------------------------------- */
const toISO = (d: Date) => d.toISOString().split('T')[0];
const formatMonth = (y: number, m: number) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(y, m)
  );

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setYear] = useState(today.getFullYear());
  const [currentMonth, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthDays = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const dayAppointments = useMemo(
    () => (selectedDate ? appointmentsByDate[selectedDate] ?? [] : []),
    [selectedDate]
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <CalenderHeader />

      {/* ---------- Custom Calendar ---------- */}
      <View style={styles.calendarWrapper}>
        {/* Month header + arrows */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={goPrevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Entypo name="chevron-with-circle-left" size={hp(3)} color="black" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{formatMonth(currentYear, currentMonth)}</Text>
          <TouchableOpacity onPress={goNextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Entypo name="chevron-with-circle-right" size={hp(3)} color="black" />
          </TouchableOpacity>
        </View>

        {/* Weekday labels */}
        <View style={styles.weekRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <Text key={d} style={styles.weekDay}>
              {d}
            </Text>
          ))}
        </View>

        {/* Days grid */}
        <View style={styles.daysGrid}>
          {monthDays.map((day) => {
            const isSelected = day.date === selectedDate;
            const isToday = day.isToday;

            return (
              <TouchableOpacity
                key={day.date}
                activeOpacity={0.7}
                style={[
                  styles.dayCell,
                  !day.isCurrentMonth && styles.dayOtherMonth,
                  isSelected && styles.daySelected,
                  isToday && styles.dayToday,
                ]}
                onPress={() => day.isCurrentMonth && setSelectedDate(day.date)}
                disabled={!day.isCurrentMonth}
              >
                <Text
                  style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.dayTextOther,
                    isSelected && styles.dayTextSelected,
                    isToday && styles.dayTextToday,
                  ]}
                >
                  {new Date(day.date).getDate()}
                </Text>
                {day.hasAppointment && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ---------- Appointments list header ---------- */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {selectedDate
            ? `Appointments – ${selectedDate.replace(/-/g, '/')}`
            : 'Select a date'}
        </Text>
      </View>

      {/* ---------- Appointments list ---------- */}
      {dayAppointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No appointments on this day</Text>
        </View>
      ) : (
        <FlatList
          data={dayAppointments}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.appointmentCard}>
              <ExpoImage
                source={item.avatar}
                style={styles.doctorAvatar}
                transition={600}
              />
              <View style={styles.appointmentInfo}>
                <Text style={styles.doctorName}>{item.doctor}</Text>
                <Text style={styles.doctorSpecialty}>{item.specialty}</Text>

                <View style={styles.timeRow}>
                  <CalendarIcon width={hp(2)} height={hp(2)} color="#8089ff" />
                  <Text style={styles.timeText}>{item.date.replace(/-/g, '/')}</Text>

                  <View style={{ width: hp(2) }} />

                  <ClockIcon width={hp(2)} height={hp(2)} color="#8089ff" />
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------
   Styles – same look & feel as your original design
   ------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  calendarWrapper: { paddingHorizontal: hp(2), paddingTop: hp(2) },

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  arrow: { fontSize: hp(3), color: '#8089ff' },
  monthTitle: { fontFamily: 'Roboto-Bold', fontSize: hp(2), color: '#8089ff' },

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
  dayCell: {
    width: `${100 / 7}%`,
    height: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayOtherMonth: { opacity: 0.3 },
  daySelected: { backgroundColor: '#8089ff', borderRadius: hp(1) },
  dayToday: { borderWidth: 1.5, borderColor: '#8089ff', borderRadius: hp(1) },

  dayText: { fontSize: hp(1.9), color: '#222' },
  dayTextOther: { color: '#aaa' },
  dayTextSelected: { color: '#fff', fontWeight: '600' },
  dayTextToday: { color: '#8089ff', fontWeight: '600' },

  dot: {
    position: 'absolute',
    bottom: hp(0.8),
    width: hp(0.8),
    height: hp(0.8),
    borderRadius: hp(0.4),
    backgroundColor: '#8089ff',
  },

  listHeader: { paddingHorizontal: hp(2), paddingVertical: hp(1.5) },
  listTitle: { fontFamily: 'Roboto-Bold', fontSize: hp(1.9), color: '#444' },

  listContent: { paddingHorizontal: hp(2), paddingBottom: hp(4) },

  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: hp(1.2),
    padding: hp(1.5),
    marginBottom: hp(1.5),
    borderWidth: 0.7,
    borderColor: '#eee',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: hp(7),
    height: hp(7),
    borderRadius: hp(1.2),
    marginRight: hp(1.5),
  },
  appointmentInfo: { flex: 1 },
  doctorName: { fontFamily: 'Roboto-Bold', fontSize: hp(1.9), color: '#333' },
  doctorSpecialty: { fontSize: hp(1.5), color: '#888', marginTop: hp(0.2) },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
    gap: hp(0.8),
  },
  timeText: { fontSize: hp(1.6), color: '#8089ff', fontWeight: '600' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: hp(8) },
  emptyText: { fontSize: hp(2), color: '#777', fontFamily: 'Roboto-Medium' },
});