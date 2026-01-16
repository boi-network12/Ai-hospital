import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useHydrationData } from '@/Hooks/useHydration.d';
import { router } from 'expo-router';

// Icons
import Water from '@/assets/Svgs/glass-water.svg';
import Plus from '@/assets/Svgs/plus.svg';
import Chart from '@/assets/Svgs/chart-area.svg';
import Target from '@/assets/Svgs/target.svg';
import History from '@/assets/Svgs/history.svg';
import { Ionicons } from '@expo/vector-icons';

export default function HydrationScreen() {
  const hydration = useHydrationData();

  const quickAddAmounts = [
    { amount: 250, label: 'Small Glass', emoji: '🥛' },
    { amount: 500, label: 'Large Glass', emoji: '🍶' },
    { amount: 750, label: 'Bottle', emoji: '💧' },
    { amount: 1000, label: 'Liter', emoji: '🚰' },
  ];

  const handleQuickAdd = async (amount: number) => {
    try {
      await hydration.addQuickIntake(amount);
    } catch {
      Alert.alert('Error', 'Failed to log water intake');
    }
  };

  const navigateToStats = () => router.push('/hydration/stats');
  const navigateToGoal = () => router.push('/hydration/goal');
  const navigateToHistory = () => router.push('/hydration/history');

  if (hydration.isLoading && !hydration.stats) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading hydration data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={hp(2.8)} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Hydration</Text>
            <Text style={styles.subtitle}>Stay hydrated throughout the day</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Water width={hp(3)} height={hp(3)} color="#8089ff" />
            <Text style={styles.progressTitle}>Today&apos;s Progress</Text>
          </View>
          
          <View style={styles.progressCircle}>
            <Text style={styles.percentageText}>{hydration.progressPercentage || 0}%</Text>
            <Text style={styles.amountText}>
              {hydration.currentIntake || 0}ml / {hydration.dailyGoal || 2000}ml
            </Text>
          </View>

          {hydration.isGoalMet && (
            <View style={styles.completionBadge}>
              <Text style={styles.completionText}>🎉 Goal Achieved!</Text>
            </View>
          )}
        </View>

        {/* Quick Add Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickAddGrid}>
            {quickAddAmounts.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAddButton}
                onPress={() => handleQuickAdd(item.amount)}
              >
                <Text style={styles.quickAddEmoji}>{item.emoji}</Text>
                <Text style={styles.quickAddAmount}>+{item.amount}ml</Text>
                <Text style={styles.quickAddLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={navigateToStats}>
              <Chart width={hp(3)} height={hp(3)} color="#8089ff" />
              <Text style={styles.actionText}>Statistics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={navigateToGoal}>
              <Target width={hp(3)} height={hp(3)} color="#8089ff" />
              <Text style={styles.actionText}>Set Goal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={navigateToHistory}>
              <History width={hp(3)} height={hp(3)} color="#8089ff" />
              <Text style={styles.actionText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/hydration/custom')}
            >
              <Plus width={hp(3)} height={hp(3)} color="#8089ff" />
              <Text style={styles.actionText}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Logs */}
        {/* // In your HydrationScreen component, fix the log time display: */}
      {(hydration.logs && hydration.logs.length > 0) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Intakes</Text>
          {hydration.logs.slice(0, 5).map((log, index) => {
            // Fix invalid date issue
            let displayTime = 'Just now';
            try {
              if (log.timestamp) {
                const timestamp = typeof log.timestamp === 'string' 
                  ? new Date(log.timestamp) 
                  : new Date(log.timestamp);
                
                if (!isNaN(timestamp.getTime())) {
                  displayTime = timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                }
              }
            } catch (error) {
              console.log('Date formatting error:', error);
            }

            return (
              <View key={log._id || `log-${index}`} style={styles.logItem}>
                <Text style={styles.logAmount}>+{log.amount}ml</Text>
                <Text style={styles.logTime}>{displayTime}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Intakes</Text>
          <Text style={styles.noLogsText}>No intake logged today</Text>
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
    paddingHorizontal: hp(2.5),
  },
  header: {
    marginTop: hp(2),
    marginBottom: hp(3),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    marginTop: hp(0.3),
    marginRight: hp(1),
    padding: hp(0),
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: hp(2),
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Roboto-Bold',
  },
  subtitle: {
    fontSize: hp(1.5),
    color: '#666',
    marginTop: hp(0.5),
    fontFamily: 'Roboto-Regular',
  },
  progressCard: {
    backgroundColor: '#f8f9ff',
    borderRadius: hp(2),
    padding: hp(2.5),
    alignItems: 'center',
    marginBottom: hp(3),
    borderWidth: 1,
    borderColor: '#eee',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  progressTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    marginLeft: hp(1),
    color: '#333',
  },
  progressCircle: {
    alignItems: 'center',
    marginVertical: hp(1),
  },
  percentageText: {
    fontSize: hp(4),
    fontWeight: '700',
    color: '#8089ff',
  },
  amountText: {
    fontSize: hp(1.8),
    color: '#666',
    marginTop: hp(0.5),
  },
  completionBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: hp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
    marginTop: hp(1),
  },
  completionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: hp(1.6),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp(1.5),
    fontFamily: 'Roboto-Bold',
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: hp(1.5),
  },
  quickAddButton: {
    width: wp(42),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: hp(1.5),
    padding: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddEmoji: {
    fontSize: hp(3),
    marginBottom: hp(0.5),
  },
  quickAddAmount: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#8089ff',
    marginBottom: hp(0.3),
  },
  quickAddLabel: {
    fontSize: hp(1.4),
    color: '#666',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: hp(1.5),
  },
  actionButton: {
    width: wp(42),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: hp(1.5),
    padding: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: '#333',
    marginTop: hp(0.5),
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: hp(1),
    padding: hp(1.5),
    marginBottom: hp(1),
  },
  logAmount: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#8089ff',
  },
  logTime: {
    fontSize: hp(1.6),
    color: '#666',
  },
  noLogsText: {
    fontSize: hp(1.6),
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: hp(2),
  }
});