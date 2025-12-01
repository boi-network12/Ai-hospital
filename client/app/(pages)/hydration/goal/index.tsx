import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useHydrationData } from '@/Hooks/useHydration.d';
import { useHydration } from '@/context/HydrationContext';
import { useToast } from '@/Hooks/useToast.d';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function GoalScreen() {
  const hydration = useHydrationData();
  const { showAlert } = useToast();
  const { state } = useHydration();

  const [goal, setGoal] = useState(String(hydration.dailyGoal));
  const [isLoading, setIsLoading] = useState(false);

  const updateGoal = async () => {
    const newGoal = parseInt(goal);
    if (isNaN(newGoal) || newGoal < 500 || newGoal > 10000) {
      Alert.alert('Invalid Goal', 'Please enter a goal between 500ml and 10000ml');
      return;
    }
    setIsLoading(true);

    try {
      await hydration.setGoal(newGoal);
      showAlert({ message: 'Daily goal updated successfully!', type: 'success' });
      await hydration.refreshHydrationData();
    } catch {
      showAlert({ message: 'Failed to update goal', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const quickGoals = [
    { amount: 1500, label: 'Light Activity', icon: 'walk-outline' },
    { amount: 2000, label: 'Moderate Activity', icon: 'bicycle-outline' },
    { amount: 2500, label: 'Active Lifestyle', icon: 'fitness-outline' },
    { amount: 3000, label: 'Very Active', icon: 'barbell-outline' },
  ];

  const currentIntake = state.stats?.totalIntake || 0;
  const remaining = state.stats?.remaining || 0;
  const progressPercentage = Math.min(state.stats?.percentage || 0, 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={hp(2.5)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hydration Goal</Text>
        <Ionicons name="water-outline" size={hp(2.5)} color="#333" />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Goal Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flag-outline" size={hp(3)} color="#333" />
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
                placeholder="Enter goal"
                placeholderTextColor="#999"
              />
              <Ionicons name="pencil-outline" size={hp(2)} color="#666" />
            </View>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={updateGoal} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size={hp(2)} color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Save Goal</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Presets</Text>
          <View style={styles.quickGoals}>
            {quickGoals.map((item) => (
              <TouchableOpacity
                key={item.amount}
                style={styles.quickGoalButton}
                onPress={() => setGoal(String(item.amount))}
              >
                <Ionicons name={item.icon as any} size={hp(2.5)} color="#555" />
                <Text style={styles.quickGoalAmount}>{item.amount}ml</Text>
                <Text style={styles.quickGoalLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Progress</Text>
          <View style={styles.card}>
            {/* Progress Circle */}
            <View style={styles.progressCircle}>
              <Text style={styles.progressValue}>{progressPercentage}%</Text>
              <Text style={styles.progressLabel}>Completed</Text>
            </View>

            {/* Stats */}
            <View style={styles.progressInfo}>
              <View style={styles.progressRow}>
                <Text style={styles.progressItemLabel}>Intake</Text>
                <Text style={styles.progressItemValue}>{currentIntake} ml</Text>
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressItemLabel}>Remaining</Text>
                <Text style={styles.progressItemValue}>{remaining} ml</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: hp(2),
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: hp(1.2),
    backgroundColor: '#f0f0f0',
    borderRadius: hp(1),
  },
  headerTitle: { fontSize: hp(2.2), fontWeight: '600', color: '#333' },
  scrollView: { flex: 1 },

  card: {
    backgroundColor: '#fff',
    padding: hp(2),
    margin: hp(2),
    borderRadius: hp(1.5),
    borderWidth: 1,
    borderColor: '#ececec',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(2) },
  cardTitle: { fontSize: hp(2), fontWeight: '600', marginLeft: hp(1), color: '#333' },

  inputContainer: { marginBottom: hp(2) },
  inputLabel: { fontSize: hp(1.6), color: '#555', marginBottom: hp(1) },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: hp(1),
    paddingHorizontal: hp(2),
    backgroundColor: '#f9f9f9',
  },
  input: { flex: 1, paddingVertical: hp(1.6), fontSize: hp(1.8), color: '#333' },

  updateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: hp(1.8),
    borderRadius: hp(1),
    alignItems: 'center',
  },
  updateButtonText: { color: '#fff', fontSize: hp(1.8), fontWeight: '600' },

  section: { marginHorizontal: hp(2), marginBottom: hp(2) },
  sectionTitle: { fontSize: hp(2), fontWeight: '600', color: '#333', marginBottom: hp(1.5) },

  quickGoals: { flexDirection: 'row', flexWrap: 'wrap', gap: hp(1) },
  quickGoalButton: {
    width: '47%',
    padding: hp(1.8),
    borderRadius: hp(1),
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickGoalAmount: { fontSize: hp(1.8), fontWeight: '500', color: '#333' },
  quickGoalLabel: { fontSize: hp(1.4), color: '#666', marginTop: hp(0.5), textAlign: 'center' },

  progressCircle: {
    width: hp(13),
    height: hp(13),
    borderRadius: hp(6.5),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: hp(2),
  },
  progressValue: { fontSize: hp(2.5), fontWeight: '700', color: '#333' },
  progressLabel: { fontSize: hp(1.3), color: '#666', marginTop: hp(0.5) },

  progressInfo: { marginTop: hp(1) },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: hp(0.8) },
  progressItemLabel: { fontSize: hp(1.6), color: '#666' },
  progressItemValue: { fontSize: hp(1.7), fontWeight: '600', color: '#333' },

  progressBar: {
    height: hp(1),
    backgroundColor: '#E5E7EB',
    borderRadius: hp(0.5),
    marginTop: hp(1),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
});
