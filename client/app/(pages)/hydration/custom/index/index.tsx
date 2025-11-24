// apps/hydration/custom.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useHydrationData } from '@/Hooks/useHydration.d';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CustomIntakeScreen() {
  const hydration = useHydrationData();
  const [amount, setAmount] = useState('');
  const [beverageType, setBeverageType] = useState('water');
  const [notes, setNotes] = useState('');

  const beverageTypes = [
    { value: 'water', label: 'Water', emoji: '💧', color: '#60A5FA' },
    { value: 'tea', label: 'Tea', emoji: '🍵', color: '#F59E0B' },
    { value: 'coffee', label: 'Coffee', emoji: '☕', color: '#92400E' },
    { value: 'juice', label: 'Juice', emoji: '🧃', color: '#EF4444' },
    { value: 'soda', label: 'Soda', emoji: '🥤', color: '#10B981' },
    { value: 'sports_drink', label: 'Sports Drink', emoji: '🏃‍♂️', color: '#8B5CF6' },
  ];

  const handleLogIntake = async () => {
  const intakeAmount = parseInt(amount);
  
  if (!intakeAmount || intakeAmount <= 0 || intakeAmount > 5000) {
    Alert.alert('Invalid Amount', 'Please enter a valid amount between 1ml and 5000ml');
    return;
  }

  try {
    await hydration.logWaterIntake(intakeAmount, beverageType, notes);
    Alert.alert('Success', `${intakeAmount}ml of ${beverageTypes.find(b => b.value === beverageType)?.label} logged successfully!`);
    router.back();
  } catch (error: any) {
    // Enhanced error handling
    const errorMessage = error?.message || 'Failed to log intake. Please try again.';
    console.error('Log intake error:', error);
    Alert.alert('Error', errorMessage);
  }
};

  const quickAmounts = [100, 250, 500, 750, 1000, 1500];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={hp(2.5)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Custom Intake</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount (ml)</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Enter amount in ml"
            placeholderTextColor="#999"
          />
          
          {/* Quick Amounts */}
          <View style={styles.quickAmounts}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={styles.quickAmountButton}
                onPress={() => setAmount(quickAmount.toString())}
              >
                <Text style={styles.quickAmountText}>+{quickAmount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Beverage Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beverage Type</Text>
          <View style={styles.beverageGrid}>
            {beverageTypes.map((beverage) => (
              <TouchableOpacity
                key={beverage.value}
                style={[
                  styles.beverageButton,
                  beverageType === beverage.value && styles.beverageButtonSelected,
                  { borderColor: beverage.color }
                ]}
                onPress={() => setBeverageType(beverage.value)}
              >
                <Text style={styles.beverageEmoji}>{beverage.emoji}</Text>
                <Text style={styles.beverageLabel}>{beverage.label}</Text>
                {beverageType === beverage.value && (
                  <View style={[styles.selectedIndicator, { backgroundColor: beverage.color }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Log Button */}
        <TouchableOpacity 
          style={styles.logButton} 
          onPress={handleLogIntake}
          disabled={!amount}
        >
          <Text style={styles.logButtonText}>Log Intake</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: hp(1),
  },
  title: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: hp(3),
  },
  scrollView: {
    flex: 1,
    padding: hp(2),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp(1.5),
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: hp(1),
    padding: hp(1.5),
    fontSize: hp(2),
    color: '#333',
    marginBottom: hp(2),
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1),
  },
  quickAmountButton: {
    backgroundColor: '#f8f9ff',
    paddingHorizontal: hp(2),
    paddingVertical: hp(1),
    borderRadius: hp(1),
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  quickAmountText: {
    fontSize: hp(1.6),
    color: '#667eea',
    fontWeight: '500',
  },
  beverageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1.5),
  },
  beverageButton: {
    width: hp(8),
    height: hp(8),
    borderRadius: hp(1.5),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  beverageButtonSelected: {
    backgroundColor: '#f8f9ff',
  },
  beverageEmoji: {
    fontSize: hp(2.5),
    marginBottom: hp(0.5),
  },
  beverageLabel: {
    fontSize: hp(1.2),
    color: '#333',
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -hp(0.5),
    right: -hp(0.5),
    width: hp(1.5),
    height: hp(1.5),
    borderRadius: hp(0.75),
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: hp(1),
    padding: hp(1.5),
    fontSize: hp(1.8),
    color: '#333',
    textAlignVertical: 'top',
    minHeight: hp(10),
  },
  logButton: {
    backgroundColor: '#667eea',
    paddingVertical: hp(1.8),
    borderRadius: hp(1),
    alignItems: 'center',
    marginTop: hp(2),
    marginBottom: hp(4),
  },
  logButtonText: {
    color: '#fff',
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
});