// src/screens/ProfessionalUpdates.tsx

import { ScrollView, StyleSheet, View, Text, Switch, Alert, TextInput, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import { useRouter } from 'expo-router';
import { useUser } from '@/Hooks/userHooks.d';
import { SafeAreaView } from 'react-native-safe-area-context';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';
import { useProfessional } from '@/context/ProfessionalContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useToast } from '@/Hooks/useToast.d';

const ChipInput = ({ 
  items, 
  onAdd, 
  onRemove, 
  placeholder 
}: { 
  items: string[]; 
  onAdd: (text: string) => void; 
  onRemove: (item: string) => void; 
  placeholder: string;
}) => {
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <View style={{ marginTop: hp(1) }}>
      <View style={styles.chipContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
            <TouchableOpacity onPress={() => onRemove(item)}>
              <Text style={styles.chipClose}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: hp(1) }}>
        <TextInput
          style={styles.chipInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ProfessionalUpdates() {
  const router = useRouter();
  const { user } = useUser();
  const { showAlert } = useToast();
  const { professional, updateProfessionalDetails, updateAvailability } = useProfessional();

  const profile = professional.profile;
  const healthcareProfile = profile?.healthcareProfile;

  const [bio, setBio] = useState(healthcareProfile?.bio || '');
  const [hourlyRate, setHourlyRate] = useState(healthcareProfile?.hourlyRate?.toString() || '');
  const [isAvailable, setIsAvailable] = useState(healthcareProfile?.availability?.isAvailable ?? true);
  const [services, setServices] = useState<string[]>(healthcareProfile?.services || []);
  const [languages, setLanguages] = useState<string[]>(healthcareProfile?.languages || []);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (healthcareProfile) {
      setBio(healthcareProfile.bio || '');
      setHourlyRate(healthcareProfile.hourlyRate?.toString() || '');
      setIsAvailable(healthcareProfile.availability?.isAvailable ?? true);
      setServices(healthcareProfile.services || []);
      setLanguages(healthcareProfile.languages || []);
    }
  }, [healthcareProfile]);

  if (!user) return null;

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const updates: any = {};

      if (bio !== healthcareProfile?.bio) updates.bio = bio;
      if (hourlyRate !== healthcareProfile?.hourlyRate?.toString()) {
        const rate = parseFloat(hourlyRate);
        if (isNaN(rate) || rate < 0) {
          showAlert({ message: 'Invalid hourly rate entered', type: 'error' });
          setLoading(false);
          return;
        }
        updates.hourlyRate = rate;
      }
      if (JSON.stringify(services) !== JSON.stringify(healthcareProfile?.services || [])) {
        updates.services = services;
      }
      if (JSON.stringify(languages) !== JSON.stringify(healthcareProfile?.languages || [])) {
        updates.languages = languages;
      }

      if (Object.keys(updates).length > 0) {
        await updateProfessionalDetails(updates);
      }

      if (isAvailable !== healthcareProfile?.availability?.isAvailable) {
        await updateAvailability(isAvailable);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update details');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    try {
      await handleSave();
      router.back();
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GeneralSettingsHeader
        title="Professional Updates"
        returnBtn={handleReturn}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card */}
        <View style={styles.mainCard}>

          {/* Professional Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Bio</Text>
            <TextInput
              style={styles.multilineInput}
              multiline
              numberOfLines={6}
              placeholder="Tell patients about your experience, approach, and specialties..."
              placeholderTextColor="#999"
              value={bio}
              onChangeText={setBio}
            />
          </View>

          {/* Hourly Rate */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hourly Consultation Rate (USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={hourlyRate}
              onChangeText={setHourlyRate}
            />
          </View>

          {/* Availability Toggle */}
          <View style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionTitle}>Available for Consultations</Text>
              <Text style={styles.sublabel}>
                {isAvailable ? 'Patients can book you now' : 'Currently unavailable'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#767577', true: '#8089FF' }}
              thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#ddd"
            />
          </View>

          {/* Services Offered */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Offered</Text>
            <Text style={styles.sublabel}>Add services you provide (e.g., General Checkup, Teleconsultation)</Text>
            <ChipInput
              items={services}
              onAdd={(item) => setServices([...services, item])}
              onRemove={(item) => setServices(services.filter(s => s !== item))}
              placeholder="Type a service and press Add"
            />
          </View>

          {/* Languages Spoken */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages Spoken</Text>
            <Text style={styles.sublabel}>List all languages you can consult in</Text>
            <ChipInput
              items={languages}
              onAdd={(item) => setLanguages([...languages, item])}
              onRemove={(item) => setLanguages(languages.filter(l => l !== item))}
              placeholder="e.g., English, Spanish"
            />
          </View>
        </View>

        {/* Optional Premium Banner (remove if not needed) */}
        <LinearGradient
          colors={["#8089FF", "#A174FF", "#FF9CF9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Boost Your Reach 🚀</Text>
            <Text style={styles.bannerSubtitle}>
              Upgrade to premium for priority visibility and advanced features!
            </Text>
          </View>
          <TouchableOpacity style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={{ height: hp(4) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
  },
  scrollContainer: {
    paddingHorizontal: hp(2),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },
  mainCard: {
    backgroundColor: "#fff",
    borderRadius: hp(3),
    borderWidth: 0.2,
    borderColor: "#eee",
    padding: hp(2),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: '#444',
    textTransform: 'capitalize',
    marginBottom: hp(0.8),
  },
  sublabel: {
    fontSize: hp(1.7),
    color: '#777',
    marginBottom: hp(1),
  },
  input: {
    backgroundColor: '#F9F9FF',
    borderRadius: hp(1.5),
    padding: hp(1.8),
    fontSize: hp(2),
    borderWidth: 1,
    borderColor: '#eee',
  },
  multilineInput: {
    backgroundColor: '#F9F9FF',
    borderRadius: hp(1.5),
    padding: hp(1.8),
    fontSize: hp(2),
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: hp(18),
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1),
    marginBottom: hp(1),
  },
  chip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(128, 137, 255, 0.15)',
    borderRadius: hp(3),
    paddingHorizontal: hp(1.8),
    paddingVertical: hp(0.9),
    alignItems: 'center',
    gap: hp(1),
  },
  chipText: {
    fontSize: hp(1.8),
    color: '#8089FF',
    fontWeight: '600',
  },
  chipClose: {
    fontSize: hp(2.6),
    color: '#8089FF',
    fontWeight: 'bold',
  },
  chipInput: {
    flex: 1,
    backgroundColor: '#F9F9FF',
    borderRadius: hp(1.5),
    padding: hp(1.8),
    fontSize: hp(2),
    borderWidth: 1,
    borderColor: '#eee',
  },
  addButton: {
    backgroundColor: '#8089FF',
    paddingHorizontal: hp(2.5),
    paddingVertical: hp(1.8),
    borderRadius: hp(1.5),
    marginLeft: hp(1),
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: hp(1.9),
  },
  banner: {
    borderRadius: hp(2),
    padding: hp(2.5),
    marginTop: hp(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: "#8089FF",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 4,
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: wp(4),
  },
  bannerTitle: {
    fontSize: hp(2.2),
    fontWeight: "700",
    color: "#fff",
  },
  bannerSubtitle: {
    fontSize: hp(1.7),
    color: "#f0f0f0",
    marginTop: hp(0.6),
    lineHeight: hp(2.3),
  },
  bannerButton: {
    backgroundColor: "#fff",
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.2),
    borderRadius: hp(10),
  },
  bannerButtonText: {
    color: "#8089FF",
    fontWeight: "700",
    fontSize: hp(1.8),
  },
});