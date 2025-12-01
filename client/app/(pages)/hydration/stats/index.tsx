import React, { FC, JSX } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useHydrationData } from '@/Hooks/useHydration.d';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

interface HydrationHistory {
  date: string;
  intake: number;
  metGoal: boolean;
}

interface HydrationStats {
  streak: number;
  history?: HydrationHistory[];
}

interface HydrationData {
  currentIntake: number;
  dailyGoal: number;
  progressPercentage: number;
  stats?: HydrationStats | null;
}

interface StatCardProps {
  label: string;
  value: string | number;
}

const StatCard: FC<StatCardProps> = ({ label, value }) => {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const StatsScreen: FC = (): JSX.Element => {
  const hydration: HydrationData = useHydrationData();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
           onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={hp(3)} color="black" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Hydration Statistics</Text>
          <Text style={styles.subtitle}>Overview of your hydration progress</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statRow}>
          <StatCard label="Today's Intake" value={`${hydration.currentIntake} ml`} />
          <StatCard label="Daily Goal" value={`${hydration.dailyGoal} ml`} />
        </View>

        <View style={styles.statRow}>
          <StatCard label="Progress" value={`${hydration.progressPercentage}%`} />
          <StatCard label="Streak" value={`${hydration.stats?.streak || 0} days`} />
        </View>

        {hydration.stats?.history && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last 7 Days</Text>
            {hydration.stats.history.map((day: HydrationHistory, index: number) => (
              <View key={index} style={styles.dayItem}>
                <Text style={styles.dayDate}>
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.dayIntake}>{day.intake} ml</Text>
                <Text style={[styles.dayStatus, day.metGoal ? styles.metGoal : styles.missedGoal]}>
                  {day.metGoal ? '✓' : '–'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: hp(3) },

  header: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(3),
    borderBottomWidth: 0.8,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    gap: hp(1.5),
    alignItems: 'center',
  },
  title: { fontSize: hp(2), fontWeight: '700', color: '#222' },
  subtitle: { fontSize: hp(1.2), color: '#888', marginTop: hp(0.5) },

  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: wp(4) },
  statCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(4),
    borderRadius: wp(3),
    margin: wp(1.5),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  statValue: { fontSize: hp(3.5), fontWeight: '600', color: '#333' },
  statLabel: { fontSize: hp(1.8), color: '#777', marginTop: hp(1) },

  section: { marginTop: hp(4), marginHorizontal: wp(4) },
  sectionTitle: { fontSize: hp(2.4), fontWeight: '600', marginBottom: hp(1.5), color: '#222' },

  dayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1.7),
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  dayDate: { fontSize: hp(1.9), color: '#555', flex: 1 },
  dayIntake: { fontSize: hp(1.9), fontWeight: '500', color: '#333', flex: 1, textAlign: 'center' },
  dayStatus: { fontSize: hp(2.2), fontWeight: '600', flex: 0.5, textAlign: 'right' },

  metGoal: { color: '#2F7B32' },
  missedGoal: { color: '#A1A1A1' },
});
