import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useHydrationData } from '@/Hooks/useHydration.d';
import { useHydration } from '@/context/HydrationContext';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useToast } from '@/Hooks/useToast.d';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function GoalScreen() {
  const hydration = useHydrationData();
  const { showAlert } = useToast();
  const { state } = useHydration();
  const [goal, setGoal] = useState(String(hydration.dailyGoal));
  const [isLoading, setIsLoading] = useState(false);

  // In your GoalScreen component, update the updateGoal function:
  const updateGoal = async () => {
    const newGoal = parseInt(goal);
    if (isNaN(newGoal) || newGoal < 500 || newGoal > 10000) {
      Alert.alert('Invalid Goal', 'Please enter a goal between 500ml and 10000ml');
      return;
    }
    setIsLoading(true);

    try {
      await hydration.setGoal(newGoal); // Use the fixed setGoal function
      showAlert({ message: 'Daily goal updated successfully!', type: 'success' });
      // Refresh data to show updated progress
      await hydration.refreshHydrationData();
    } catch {
      showAlert({ message: 'Failed to update goal', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const quickGoals = [
    { amount: 1500, label: 'Light Activity', icon: 'walk-outline', color: '#4ADE80' },
    { amount: 2000, label: 'Moderate Activity', icon: 'bicycle-outline', color: '#60A5FA' },
    { amount: 2500, label: 'Active Lifestyle', icon: 'fitness-outline', color: '#F59E0B' },
    { amount: 3000, label: 'Very Active', icon: 'barbell-outline', color: '#EF4444' },
  ];

  // Use state values for progress display
  const currentIntake = state.stats?.totalIntake || 0;
  const remaining = state.stats?.remaining || 0;
  const progressPercentage = Math.min(state.stats?.percentage || 0, 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="water-outline" size={hp(3)} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Hydration Goal</Text>
            <Text style={styles.subtitle}>Set your daily water target</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="trophy-outline" size={hp(2.5)} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Goal Card */}
        <LinearGradient
          colors={['#ffffff', '#f8faff']}
          style={styles.mainCard}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="flag-outline" size={hp(3)} color="#667eea" />
            <Text style={styles.cardTitle}>Daily Target</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Goal Amount (ml)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={goal}
                onChangeText={setGoal}
                keyboardType="numeric"
                placeholder="Enter your daily goal"
                placeholderTextColor="#9CA3AF"
              />
              <Ionicons name="pencil-outline" size={hp(2)} color="#667eea" />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.updateButton} 
            onPress={updateGoal}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <ActivityIndicator size={hp(2)} color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={hp(2.2)} color="#fff" />
                  <Text style={styles.updateButtonText}>Update Goal</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash-outline" size={hp(2.5)} color="#374151" />
            <Text style={styles.sectionTitle}>Quick Presets</Text>
          </View>
          <View style={styles.quickGoals}>
            {quickGoals.map((item, index) => (
              <TouchableOpacity
                key={item.amount}
                style={styles.quickGoalButton}
                onPress={() => setGoal(String(item.amount))}
              >
                <LinearGradient
                  colors={['#fff', '#f7faff']}
                  style={[styles.quickGoalGradient, { borderLeftColor: item.color }]}
                >
                  <View style={styles.quickGoalIcon}>
                    <Ionicons name={item.icon as any} size={hp(2.5)} color={item.color} />
                  </View>
                  <Text style={styles.quickGoalAmount}>{item.amount}ml</Text>
                  <Text style={styles.quickGoalLabel}>{item.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart-outline" size={hp(2.5)} color="#374151" />
            <Text style={styles.sectionTitle}>Today&apos;s Progress</Text>
          </View>
          
          <LinearGradient
            colors={['#ffffff', '#f8faff']}
            style={styles.progressCard}
          >
            {/* Progress Circle */}
            <View style={styles.progressCircleContainer}>
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
                <Text style={styles.progressLabel}>Completed</Text>
              </View>
            </View>

            {/* Progress Stats */}
            <View style={styles.progressInfo}>
              <View style={styles.progressRow}>
                <View style={styles.progressItem}>
                  <Ionicons name="water-outline" size={hp(2.2)} color="#667eea" />
                  <Text style={styles.progressItemLabel}>Current Intake</Text>
                  <Text style={styles.progressItemValue}>{currentIntake}ml</Text>
                </View>
                <View style={styles.progressItem}>
                  <Ionicons name="time-outline" size={hp(2.2)} color="#F59E0B" />
                  <Text style={styles.progressItemLabel}>Remaining</Text>
                  <Text style={styles.progressItemValue}>{remaining}ml</Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={[styles.progressFill, { width: `${progressPercentage}%` }]}
                  />
                </View>
                <View style={styles.progressBarLabels}>
                  <Text style={styles.progressBarText}>0ml</Text>
                  <Text style={styles.progressBarText}>{goal}ml</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  headerGradient: {
    paddingHorizontal: hp(2),
    paddingBottom: hp(3),
    borderBottomLeftRadius: hp(3),
    borderBottomRightRadius: hp(3),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(1.5),
  },
  backButton: {
    padding: hp(1),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: hp(1.5),
  },
  title: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: hp(1.6),
    color: 'rgba(255,255,255,0.8)',
    marginTop: hp(0.5),
    textAlign: 'center',
  },
  headerIcon: {
    padding: hp(1),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: hp(1.5),
  },
  scrollView: {
    flex: 1,
    marginTop: hp(1),
  },
  mainCard: {
    margin: hp(2),
    padding: hp(2.5),
    borderRadius: hp(2),
    backgroundColor: '#fff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  cardTitle: {
    fontSize: hp(2),
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: hp(1),
  },
  inputContainer: {
    marginBottom: hp(2),
  },
  inputLabel: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: '#374151',
    marginBottom: hp(1),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: hp(1.5),
    paddingHorizontal: hp(2),
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingVertical: hp(1.8),
    fontSize: hp(1.8),
    color: '#374151',
  },
  updateButton: {
    borderRadius: hp(1.5),
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.8),
    gap: hp(1),
  },
  updateButtonText: {
    color: '#fff',
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
  section: {
    marginHorizontal: hp(2),
    marginBottom: hp(2),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: hp(1),
  },
  quickGoals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1.5),
  },
  quickGoalButton: {
    flex: 1,
    minWidth: '47%',
    borderRadius: hp(1.5),
    overflow: 'hidden',
    borderColor: '#eee',
    borderWidth: 0.5
  },
  quickGoalGradient: {
    padding: hp(2),
    alignItems: 'center',
    borderLeftWidth: hp(0.4),
    backgroundColor: '#fff',
  },
  quickGoalIcon: {
    padding: hp(1),
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: hp(1),
    marginBottom: hp(1),
  },
  quickGoalAmount: {
    fontSize: hp(1.8),
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  quickGoalLabel: {
    fontSize: hp(1.4),
    color: '#6B7280',
    marginTop: hp(0.5),
    textAlign: 'center',
  },
  progressCard: {
    borderRadius: hp(2),
    padding: hp(2.5),
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
  progressCircle: {
    width: hp(12),
    height: hp(12),
    borderRadius: hp(6),
    backgroundColor: '#f8faff',
    borderWidth: hp(0.3),
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: '#374151',
  },
  progressLabel: {
    fontSize: hp(1.2),
    color: '#6B7280',
    marginTop: hp(0.5),
  },
  progressInfo: {
    gap: hp(2),
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressItemLabel: {
    fontSize: hp(1.4),
    color: '#6B7280',
    marginTop: hp(0.5),
    marginBottom: hp(0.5),
  },
  progressItemValue: {
    fontSize: hp(1.8),
    fontWeight: 'bold',
    color: '#374151',
  },
  progressBarContainer: {
    marginTop: hp(1),
  },
  progressBar: {
    height: hp(1),
    backgroundColor: '#E5E7EB',
    borderRadius: hp(0.5),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: hp(0.5),
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(0.5),
  },
  progressBarText: {
    fontSize: hp(1.2),
    color: '#6B7280',
  },
});