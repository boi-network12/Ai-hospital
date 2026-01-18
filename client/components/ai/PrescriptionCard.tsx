// components/ai/PrescriptionCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface Props {
  recommendations: string[];
  disclaimer?: string;
}

const PrescriptionCard: React.FC<Props> = ({ recommendations, disclaimer }) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="package" size={20} color="#4CAF50" />
        <Text style={styles.title}>Medication Guidance</Text>
      </View>
      
      <View style={styles.warningContainer}>
        <Feather name="alert-triangle" size={16} color="#ff9800" />
        <Text style={styles.warningText}>
          OTC medications only for mild symptoms. Always consult a doctor for proper diagnosis.
        </Text>
      </View>
      
      {recommendations.map((rec, index) => (
        <View key={index} style={styles.recommendationItem}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{index + 1}</Text>
          </View>
          <Text style={styles.recommendationText}>{rec}</Text>
        </View>
      ))}
      
      <View style={styles.importantContainer}>
        <Text style={styles.importantTitle}>IMPORTANT:</Text>
        <View style={styles.importantItem}>
          <Feather name="check" size={14} color="#4CAF50" />
          <Text style={styles.importantText}>Do not exceed recommended dosage</Text>
        </View>
        <View style={styles.importantItem}>
          <Feather name="check" size={14} color="#4CAF50" />
          <Text style={styles.importantText}>Stop if side effects occur</Text>
        </View>
        <View style={styles.importantItem}>
          <Feather name="check" size={14} color="#4CAF50" />
          <Text style={styles.importantText}>Seek help if symptoms worsen</Text>
        </View>
      </View>
      
      {disclaimer && (
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>{disclaimer}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: hp(1.5),
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: wp(3),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  title: {
    fontSize: hp(1.7),
    fontWeight: '600',
    color: '#333',
    marginLeft: wp(2),
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff8e1',
    padding: wp(3),
    borderRadius: 8,
    marginBottom: hp(1.5),
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
  },
  warningText: {
    fontSize: hp(1.4),
    color: '#856404',
    marginLeft: wp(2),
    flex: 1,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1),
  },
  numberBadge: {
    backgroundColor: '#8089ff',
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
    marginTop: hp(0.3),
  },
  numberText: {
    color: '#fff',
    fontSize: hp(1.3),
    fontWeight: 'bold',
  },
  recommendationText: {
    fontSize: hp(1.5),
    color: '#555',
    flex: 1,
    lineHeight: hp(2),
  },
  importantContainer: {
    backgroundColor: '#e8f5e8',
    padding: wp(3),
    borderRadius: 8,
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  importantTitle: {
    fontSize: hp(1.5),
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: hp(0.8),
  },
  importantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  importantText: {
    fontSize: hp(1.4),
    color: '#2e7d32',
    marginLeft: wp(1.5),
  },
  disclaimerContainer: {
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  disclaimerText: {
    fontSize: hp(1.3),
    color: '#666',
    fontStyle: 'italic',
    lineHeight: hp(1.8),
  },
});

export default PrescriptionCard;