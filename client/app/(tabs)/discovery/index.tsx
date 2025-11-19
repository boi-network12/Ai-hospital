import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Text, StyleSheet, ScrollView, PermissionsAndroid, Platform, Alert, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Modalize } from 'react-native-modalize'
import { Portal } from 'react-native-portalize'
import { heightPercentageToDP as hp } from 'react-native-responsive-screen'

// 🧩 Components
import DiscoveryHeader from '@/components/Headers/DiscoveryHeader'
import FilterSections from '@/components/DiscoveryComponents/FilterSections'
import { useUser } from '@/Hooks/userHooks.d'
import { useHealthcare } from '@/context/HealthContext'
import { useProfessional } from '@/context/ProfessionalContext'

// Helper
import {
  getLocationWithPermission,
  getDefaultLocation,
  requestLocationPermission,
  type LocationData
} from "@/helper/LocationHelper"
import ProfessionalsList from './_components/ProfessionalsList'

export default function DiscoveryPage() {
  const { } = useUser();
  const { healthcare, fetchProfessionals, updateFilters } = useHealthcare();
  const { } = useProfessional();

  // Modal reference
  const modalizeRef = useRef<Modalize>(null)
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to open modal
  const openFilterModal = useCallback(() => {
    modalizeRef.current?.open()
  }, [])

  // Initialize location and fetch professionals
  const initializeLocationAndFetch = useCallback(async () => {
    // Prevent multiple initializations
    if (isInitialized) return;

    try {
      setIsInitialized(true);
      setLocationPermission('pending');

      console.log('Starting location initialization...');

      // Try to get current location
      const currentLocation = await getLocationWithPermission();

      if (currentLocation) {
        console.log('Location obtained:', currentLocation);
        setLocation(currentLocation);
        setLocationPermission('granted');

        // Fetch professionals with location data
        await fetchProfessionals({
          city: currentLocation.city,
          state: currentLocation.state,
          country: currentLocation.country,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          maxDistance: 50 // 50km radius
        });
      } else {
        console.log('Using default location');
        // Use default location
        const defaultLocation = getDefaultLocation();
        setLocation(defaultLocation);
        setLocationPermission('denied');

        await fetchProfessionals({
          city: defaultLocation.city,
          state: defaultLocation.state,
          country: defaultLocation.country
        });
      }
    } catch (error) {
      console.error('Failed to initialize location:', error);

      // Fallback to default location
      const defaultLocation = getDefaultLocation();
      setLocation(defaultLocation);
      setLocationPermission('denied');

      await fetchProfessionals({
        city: defaultLocation.city,
        state: defaultLocation.state,
        country: defaultLocation.country
      });
    }
  }, [fetchProfessionals, isInitialized]);

  // Handle filter changes
  const handleFilterChange = async (filters: any) => {
    updateFilters(filters);
    await fetchProfessionals({
      ...healthcare.filters,
      ...filters,
      ...(location && {
        city: location.city,
        state: location.state,
        country: location.country,
        ...(location.latitude && location.longitude && {
          latitude: location.latitude,
          longitude: location.longitude
        })
      })
    });
  };

  // Retry location permission
  const handleRetryLocation = async () => {
    try {
      setLocationPermission('pending');
      const currentLocation = await getLocationWithPermission();

      if (currentLocation) {
        setLocation(currentLocation);
        setLocationPermission('granted');

        // Refetch professionals with new location
        await fetchProfessionals({
          city: currentLocation.city,
          state: currentLocation.state,
          country: currentLocation.country,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          maxDistance: 50
        });

        Alert.alert('Success', 'Location updated successfully!');
      } else {
        setLocationPermission('denied');
        Alert.alert('Error', 'Unable to get location. Using default location.');
      }
    } catch (error) {
      console.error('Failed to retry location:', error);
      setLocationPermission('denied');
      Alert.alert('Error', 'Failed to get location.');
    }
  };

  useEffect(() => {
    if (!isInitialized) {
      initializeLocationAndFetch();
    }
  }, [initializeLocationAndFetch, isInitialized]);


  return (
    <SafeAreaView style={styles.container}>
      {/* 🔹 Header */}
      <DiscoveryHeader
        onFilterPress={openFilterModal}
        location={location}
        onLocationPress={handleRetryLocation}
      />

      {/* 🔹 Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {healthcare.loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Finding healthcare professionals near you...</Text>
          </View>
        ) : healthcare.professionals.length > 0 ? (
          <ProfessionalsList
            professionals={healthcare.professionals}
            location={location}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No healthcare professionals found in your area</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or location</Text>
          </View>
        )}
      </ScrollView>

      {/* 🔹 Filter Modal */}
      <Portal>
        <Modalize
          ref={modalizeRef}
          modalHeight={hp(70)} // 70% screen height
          handlePosition="inside"
          closeOnOverlayTap
          panGestureEnabled
          overlayStyle={styles.overlay}
          modalStyle={styles.modal}
        >
          <FilterSections
            onFilterChange={handleFilterChange}
            currentFilters={healthcare.filters}
          />
        </Modalize>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  loadingText: {
    fontSize: hp(2),
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: hp(4),
  },
  emptyText: {
    fontSize: hp(2),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  emptySubtext: {
    fontSize: hp(1.6),
    color: '#999',
    textAlign: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: hp(2),
    borderTopRightRadius: hp(2),
    paddingBottom: hp(2),
  },
})