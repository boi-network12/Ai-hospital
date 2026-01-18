// components/ai/EmergencyAlert.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface Props {
  onCallEmergency?: () => void;
  onFindHospital?: () => void;
}

const EmergencyAlert: React.FC<Props> = ({ 
  onCallEmergency, 
  onFindHospital 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="alert-triangle" size={24} color="#FF5252" />
        <Text style={styles.title}>EMERGENCY ALERT</Text>
      </View>
      
      <Text style={styles.message}>
        This appears to be a medical emergency requiring immediate professional attention.
      </Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={onCallEmergency}
        >
          <Feather name="phone" size={20} color="#fff" />
          <Text style={styles.emergencyButtonText}>Call Emergency</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.hospitalButton}
          onPress={onFindHospital}
        >
          <Feather name="map-pin" size={20} color="#fff" />
          <Text style={styles.hospitalButtonText}>Find Hospital</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.instruction}>
        Do not delay. Call your local emergency number (911 in US, 999 in UK) immediately.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff8f8',
    borderRadius: 12,
    padding: wp(4),
    marginTop: hp(1.5),
    borderWidth: 2,
    borderColor: '#ffebee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  title: {
    fontSize: hp(1.8),
    fontWeight: 'bold',
    color: '#FF5252',
    marginLeft: wp(2),
  },
  message: {
    fontSize: hp(1.5),
    color: '#666',
    lineHeight: hp(2.2),
    marginBottom: hp(1.5),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5252',
    paddingVertical: hp(1.5),
    borderRadius: 8,
    marginRight: wp(1),
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: hp(1.5),
    fontWeight: '600',
    marginLeft: wp(1),
  },
  hospitalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8089ff',
    paddingVertical: hp(1.5),
    borderRadius: 8,
    marginLeft: wp(1),
  },
  hospitalButtonText: {
    color: '#fff',
    fontSize: hp(1.5),
    fontWeight: '600',
    marginLeft: wp(1),
  },
  instruction: {
    fontSize: hp(1.3),
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: hp(1.8),
  },
});

export default EmergencyAlert;