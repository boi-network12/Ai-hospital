import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useHydrationData } from '@/Hooks/useHydration.d';

export default function StatsScreen() {
  const hydration = useHydrationData();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Hydration Statistics</Text>
      </View>

      <ScrollView>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{hydration.currentIntake}ml</Text>
          <Text style={styles.statLabel}>Today&apos;s Intake</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{hydration.dailyGoal}ml</Text>
          <Text style={styles.statLabel}>Daily Goal</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{hydration.progressPercentage}%</Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{hydration.stats?.streak || 0} days</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>

        {hydration.stats?.history && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last 7 Days</Text>
            {hydration.stats.history.map((day, index) => (
              <View key={index} style={styles.dayItem}>
                <Text style={styles.dayDate}>{new Date(day.date).toLocaleDateString()}</Text>
                <Text style={styles.dayIntake}>{day.intake}ml</Text>
                <Text style={[styles.dayStatus, day.metGoal ? styles.metGoal : styles.missedGoal]}>
                  {day.metGoal ? '✓' : '✗'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statCard: {
    backgroundColor: '#f8f9ff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8089ff',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayDate: {
    fontSize: 16,
  },
  dayIntake: {
    fontSize: 16,
    fontWeight: '500',
  },
  dayStatus: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metGoal: {
    color: '#4CAF50',
  },
  missedGoal: {
    color: '#f44336',
  },
});