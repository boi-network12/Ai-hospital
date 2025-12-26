// components/DiscoveryComponents/HospitalCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Hospital } from '@/services/HospitalService';

// Icons
import LocationPinIcon from "@/assets/Svgs/locate.svg";
import StarIcon from "@/assets/Svgs/star.svg";
import PhoneIcon from "@/assets/Svgs/phone.svg";
import GlobeIcon from "@/assets/Svgs/globe.svg";
import ClockIcon from "@/assets/Svgs/clock.svg";

interface HospitalCardProps {
  hospital: Hospital;
  onPress?: () => void;
}

export default function HospitalCard({ hospital, onPress }: HospitalCardProps) {
  const handleCallPress = () => {
    if (hospital.phoneNumber) {
      Linking.openURL(`tel:${hospital.phoneNumber}`).catch(err =>
        Alert.alert('Error', 'Could not make call')
      );
    }
  };

  const handleWebsitePress = () => {
    if (hospital.website) {
      Linking.openURL(hospital.website).catch(err =>
        Alert.alert('Error', 'Could not open website')
      );
    }
  };

  const handleOpenStreetMap = () => {
    // You'll need to pass osmId instead of googlePlaceId
    const osmId = hospital.osmId || `${hospital.id}`;
    const mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(hospital.name + ' ' + hospital.address)}`;
    Linking.openURL(mapUrl).catch(err =>
      Alert.alert('Error', 'Could not open map')
    );
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress || handleOpenStreetMap}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {hospital.name}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, hospital.isOpen ? styles.open : styles.closed]}>
              {hospital.isOpen ? 'OPEN NOW' : 'CLOSED'}
            </Text>
          </View>
        </View>
        
        {hospital.distance && (
          <Text style={styles.distance}>
            {hospital.distance < 1000 
              ? `${Math.round(hospital.distance)}m`
              : `${(hospital.distance / 1000).toFixed(1)}km`
            }
          </Text>
        )}
      </View>

      {/* Rating */}
      {hospital.rating && (
        <View style={styles.ratingContainer}>
          <StarIcon width={hp(1.5)} height={hp(1.5)} fill="#FFC107" />
          <Text style={styles.rating}>
            {hospital.rating.toFixed(1)}
          </Text>
          <Text style={styles.ratingCount}>
            ({hospital.totalRatings || 0})
          </Text>
        </View>
      )}

      {/* Address */}
      <View style={styles.infoRow}>
        <LocationPinIcon width={hp(1.5)} height={hp(1.5)} fill="#6B7280" />
        <Text style={styles.address} numberOfLines={2}>
          {hospital.address}
        </Text>
      </View>

      {/* Opening Hours */}
      {hospital.openingHours && hospital.openingHours.length > 0 && (
        <View style={styles.infoRow}>
          <ClockIcon width={hp(1.5)} height={hp(1.5)} fill="#6B7280" />
          <Text style={styles.hours} numberOfLines={1}>
            {hospital.openingHours[0]}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {hospital.phoneNumber && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCallPress}
          >
            <PhoneIcon width={hp(1.5)} height={hp(1.5)} fill="#4F46E5" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        )}
        
        {hospital.website && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleWebsitePress}
          >
            <GlobeIcon width={hp(1.5)} height={hp(1.5)} fill="#4F46E5" />
            <Text style={styles.actionText}>Website</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.searchButton]}
          onPress={handleOpenStreetMap}
        >
          <Text style={styles.searchButtonText}>More Info</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: hp(1.5),
    padding: hp(2),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1),
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  name: {
    fontSize: hp(1.8),
    fontWeight: '700',
    color: '#111827',
    marginRight: hp(1),
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: hp(0.8),
    paddingVertical: hp(0.3),
    borderRadius: hp(0.5),
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: hp(1),
    fontWeight: '600',
  },
  open: {
    color: '#10B981',
  },
  closed: {
    color: '#EF4444',
  },
  distance: {
    fontSize: hp(1.3),
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  rating: {
    fontSize: hp(1.4),
    fontWeight: '600',
    marginLeft: 4,
    color: '#4B5563',
  },
  ratingCount: {
    fontSize: hp(1.2),
    color: '#9CA3AF',
    marginLeft: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(0.8),
  },
  address: {
    fontSize: hp(1.3),
    color: '#4B5563',
    marginLeft: hp(0.8),
    flex: 1,
  },
  hours: {
    fontSize: hp(1.3),
    color: '#4B5563',
    marginLeft: hp(0.8),
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: hp(1.5),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hp(1),
    paddingVertical: hp(0.8),
    borderRadius: hp(1),
    backgroundColor: '#F3F4F6',
    flex: 1,
    marginHorizontal: hp(0.5),
    justifyContent: 'center',
  },
  actionText: {
    fontSize: hp(1.2),
    color: '#4F46E5',
    fontWeight: '600',
    marginLeft: hp(0.5),
  },
  searchButton: {
    backgroundColor: '#4F46E5',
    flex: 2,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: hp(1.3),
    fontWeight: '600',
  },
});