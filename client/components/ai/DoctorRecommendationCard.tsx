// components/ai/DoctorRecommendationCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface DoctorRecommendation {
  professionalId: string;
  name: string;
  specialization: string;
  rating: number;
  distance?: number;
  matchScore: number;
  reason: string;
}

interface Props {
  recommendations: DoctorRecommendation[];
  onSelect: (doctorId: string) => void;
}

const DoctorRecommendationCard: React.FC<Props> = ({ recommendations, onSelect }) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommended Professionals</Text>
      <Text style={styles.subtitle}>Based on your symptoms and location</Text>
      
      {recommendations.slice(0, 3).map((doctor, index) => (
        <TouchableOpacity
          key={doctor.professionalId}
          style={styles.doctorCard}
          onPress={() => onSelect(doctor.professionalId)}
        >
          <View style={styles.doctorHeader}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName} numberOfLines={1}>
                {doctor.name}
              </Text>
              <Text style={styles.doctorSpecialty}>
                {doctor.specialization}
              </Text>
            </View>
            <View style={styles.matchScore}>
              <Text style={styles.matchScoreText}>{doctor.matchScore}%</Text>
              <Text style={styles.matchScoreLabel}>Match</Text>
            </View>
          </View>
          
          <View style={styles.doctorDetails}>
            <View style={styles.detailItem}>
              <Feather name="star" size={14} color="#FFC107" />
              <Text style={styles.detailText}>
                {doctor.rating.toFixed(1)}/5
              </Text>
            </View>
            
            {doctor.distance && (
              <View style={styles.detailItem}>
                <Feather name="map-pin" size={14} color="#8089ff" />
                <Text style={styles.detailText}>
                  {doctor.distance.toFixed(1)}km
                </Text>
              </View>
            )}
            
            <View style={styles.detailItem}>
              <Feather name="check-circle" size={14} color="#4CAF50" />
              <Text style={styles.detailText}>Available</Text>
            </View>
          </View>
          
          <Text style={styles.reasonText} numberOfLines={2}>
            {doctor.reason}
          </Text>
          
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Profile</Text>
            <Feather name="chevron-right" size={16} color="#8089ff" />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: hp(1.5),
  },
  title: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: hp(1.4),
    color: '#666',
    marginBottom: hp(1.5),
  },
  doctorCard: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: wp(3),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#eef0ff',
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  rankBadge: {
    backgroundColor: '#8089ff',
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  rankText: {
    color: '#fff',
    fontSize: hp(1.4),
    fontWeight: 'bold',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: '#333',
  },
  doctorSpecialty: {
    fontSize: hp(1.4),
    color: '#666',
    marginTop: hp(0.3),
  },
  matchScore: {
    alignItems: 'center',
  },
  matchScoreText: {
    fontSize: hp(1.6),
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  matchScoreLabel: {
    fontSize: hp(1.2),
    color: '#666',
  },
  doctorDetails: {
    flexDirection: 'row',
    marginBottom: hp(1),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(4),
  },
  detailText: {
    fontSize: hp(1.3),
    color: '#666',
    marginLeft: wp(1),
  },
  reasonText: {
    fontSize: hp(1.4),
    color: '#555',
    fontStyle: 'italic',
    marginBottom: hp(1),
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 137, 255, 0.1)',
    paddingVertical: hp(1),
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#8089ff',
    fontSize: hp(1.4),
    fontWeight: '600',
    marginRight: wp(1),
  },
});

export default DoctorRecommendationCard;