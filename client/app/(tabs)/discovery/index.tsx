import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Text, StyleSheet, Alert, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Modalize } from 'react-native-modalize'
import { Portal } from 'react-native-portalize'
import { heightPercentageToDP as hp } from 'react-native-responsive-screen'

// 🧩 Components
import DiscoveryHeader from '@/components/Headers/DiscoveryHeader'
import FilterSections, { ProfessionalFilters } from '@/components/DiscoveryComponents/FilterSections'
import { useUser } from '@/Hooks/userHooks.d'
import { useHealthcare } from '@/context/HealthContext'

// Helper
import {
  getLocationWithPermission,
  type LocationData,
  setUserProfileLocation,
  getFallbackLocation
} from "@/helper/LocationHelper"
import ProfessionalsList from './_components/ProfessionalsList'
import { useToast } from '@/Hooks/useToast.d'

export default function DiscoveryPage() {
  const { user } = useUser();
  const { showAlert } = useToast();
  const { healthcare, fetchProfessionals, updateFilters } = useHealthcare();
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    if (isInitialized) return;
    setIsInitialized(true);
    setIsDetectingLocation(true);

    // 1. IMMEDIATELY show professionals using smart default (user profile or fallback)
    const fallback = getFallbackLocation();
    setLocation(fallback);

    await fetchProfessionals({
      city: fallback.city,
      state: fallback.state,
      country: fallback.country,
    });

    // 2. Then try to upgrade to real GPS in background (non-blocking)
    const realLocation = await getLocationWithPermission();

    if (realLocation) {
      setLocation(realLocation);
      setLocationPermission('granted');

      await fetchProfessionals({
        city: realLocation.city,
        state: realLocation.state,
        country: realLocation.country,
        latitude: realLocation.latitude,
        longitude: realLocation.longitude,
        maxDistance: 50,
      });

      showAlert({ message: 'Showing professionals near you!', type: 'success' });
    }
    setIsDetectingLocation(false);
  }, [fetchProfessionals, isInitialized, showAlert]);

  const handleRefresh = useCallback(async () => {
  setRefreshing(true);

  try {
    // Use current location or fallback
    const currentLoc = location || getFallbackLocation();

    await fetchProfessionals({
      city: currentLoc.city,
      state: currentLoc.state,
      country: currentLoc.country,
      ...(currentLoc.latitude && currentLoc.longitude && 
        currentLoc.latitude !== 0 && currentLoc.longitude !== 0 && {
          latitude: currentLoc.latitude,
          longitude: currentLoc.longitude,
          maxDistance: 50,
        }),
      // Include current filters if you want to preserve them
      // ...healthcare.filtersBackend, // assuming you store transformed filters, or reconstruct
    });
  } catch {
    showAlert({ message: 'Failed to refresh professionals', type: 'error' });
  } finally {
    setRefreshing(false);
  }
}, [location, fetchProfessionals, showAlert]);

  // Handle filter changes
  // DiscoveryPage.tsx
  const handleFilterChange = useCallback(async (filters: ProfessionalFilters) => {
    try {
      // Check if filters actually changed
      if (JSON.stringify(filters) === JSON.stringify(healthcare.filters)) {
        return;
      }

      // Update local filters
      updateFilters(filters);
      
      // Transform filters to backend schema
      const backendFilters = {
        ...(filters.role && { role: filters.role }),
        ...(filters.specialization && { 'profile.specialization': filters.specialization }),
        ...(filters.gender && { 'profile.gender': filters.gender }),
        ...(filters.availability !== null && { 
          'healthcareProfile.availability.isAvailable': filters.availability 
        }),
        ...(filters.minRating > 0 && { 
          'healthcareProfile.stats.averageRating': { $gte: filters.minRating }
        }),
      };

      await fetchProfessionals({
        ...backendFilters,
        ...(location && {
          city: location.city,
          state: location.state,
          country: location.country,
          ...(location.latitude && location.longitude && 
            location.latitude !== 0 && location.longitude !== 0 && {
              latitude: location.latitude,
              longitude: location.longitude,
              maxDistance: 50
            })
        })
      });
    } catch (error) {
      console.error('Error applying filters:', error);
      showAlert({ message: 'Failed to apply filters', type: 'error' });
    }
  }, [healthcare.filters, updateFilters, fetchProfessionals, location, showAlert]);


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

        refreshing && setRefreshing(false);

        showAlert({ message: 'Location updated successfully!', type: 'success' });
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
    // Inject user's saved location as smart default
    if (user?.profile?.location) {
      const userLoc: LocationData = {
        city: user.profile.location.city || 'Your Area',
        state: user.profile.location.state || '',
        country: user.profile.location.country || 'Nigeria',
      };
      setUserProfileLocation(userLoc);
    }
  }, [user]);

  useEffect(() => {
    if (!isInitialized) {
      initializeLocationAndFetch();
    }
  }, [initializeLocationAndFetch, isInitialized]);

  const renderContent = () => {
    if (healthcare.loading && !refreshing) {  
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Finding healthcare professionals near you...</Text>
      </View>
    );
  }

    if (healthcare.professionals.length > 0) {
      return (
        <ProfessionalsList
          professionals={healthcare.professionals}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No healthcare professionals found in your area</Text>
        <Text style={styles.emptySubtext}>Try adjusting your filters or location</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔹 Header */}
      <DiscoveryHeader
        onFilterPress={openFilterModal}
        location={location}
        onLocationPress={handleRetryLocation}
        isLoadingLocation={isDetectingLocation}
      />

      {/* 🔹 Main Content - Remove ScrollView since ProfessionalsList has its own FlatList */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* 🔹 Filter Modal */}
      <Portal>
        <Modalize
          ref={modalizeRef}
          modalHeight={hp(75)} // 70% screen height
          handlePosition="inside"
          closeOnOverlayTap
          panGestureEnabled
          overlayStyle={styles.overlay}
          modalStyle={styles.modal}
        >
          <FilterSections
            onFilterChange={handleFilterChange}
            currentFilters={healthcare.filters as ProfessionalFilters}
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
  content: {
    flex: 1,
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