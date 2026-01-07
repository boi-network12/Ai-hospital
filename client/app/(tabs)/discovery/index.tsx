import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Text, StyleSheet, Alert, View, RefreshControl, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native'
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
import HospitalCard from '@/components/DiscoveryComponents/HospitalCard'
import { useToast } from '@/Hooks/useToast.d'

// Types
type DiscoveryTab = 'professionals' | 'hospitals';

export default function DiscoveryPage() {
  const { user } = useUser();
  const { showAlert } = useToast();
  const { 
    healthcare, 
    fetchProfessionals, 
    updateFilters,
    fetchHospitals,
    hospitals,
    hospitalsLoading
  } = useHealthcare();
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<DiscoveryTab>('professionals');

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

      // Fetch hospitals with real location
      if (realLocation.latitude && realLocation.longitude) {
        await fetchHospitals({
          latitude: realLocation.latitude,
          longitude: realLocation.longitude,
        });
      }


      showAlert({ message: 'Showing professionals near you!', type: 'success' });
    } else {
      // If no GPS, use fallback coordinates for hospitals
      await fetchHospitals({
        latitude: fallback.latitude || 6.5244, // Lagos coordinates
        longitude: fallback.longitude || 3.3792,
      });
    }
    setIsDetectingLocation(false);
  }, [fetchProfessionals, fetchHospitals, isInitialized, showAlert]);

  const handleRefresh = useCallback(async () => {
  setRefreshing(true);

  try {
    // Use current location or fallback
    const currentLoc = location || getFallbackLocation();

    if (activeTab === 'professionals') {
        await fetchProfessionals({
          city: currentLoc.city,
          state: currentLoc.state,
          country: currentLoc.country,
          ...(currentLoc.latitude && currentLoc.longitude && {
            latitude: currentLoc.latitude,
            longitude: currentLoc.longitude,
            maxDistance: 50,
          }),
        });
      } else {
        if (currentLoc.latitude && currentLoc.longitude) {
          await fetchHospitals({
            latitude: currentLoc.latitude,
            longitude: currentLoc.longitude,
          });
        }
      }
  } catch {
    showAlert({ message: `Failed to refresh ${activeTab}`, type: 'error' });
  } finally {
    setRefreshing(false);
  }
}, [location, fetchProfessionals, fetchHospitals, activeTab, showAlert]);

// Handle tab change
  const handleTabChange = useCallback(async (tab: DiscoveryTab) => {
    setActiveTab(tab);
    
    if (location && location.latitude && location.longitude) {
      if (tab === 'hospitals') {
        await fetchHospitals({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }
    }
  }, [location, fetchHospitals]);

  const rotation = useRef(new Animated.Value(0)).current;

  const triggerRotation = () => {
      rotation.setValue(0); // Reset animation
      Animated.timing(rotation, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    };

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    return (...args: any[]) => {
      if (timeoutId) return;
      func(...args);
      triggerRotation(); // 🔄 Trigger animation when clicked
      timeoutId = setTimeout(() => {
        timeoutId = undefined;
      }, delay);
    };
  };

  

   // Render content based on active tab
  const renderContent = () => {
    if (activeTab === 'professionals') {
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
    } else {
      // Hospitals tab
      if (hospitalsLoading && !refreshing) {
        return (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Finding hospitals near you...</Text>
          </View>
        );
      }

      if (hospitals.length > 0) {
        return (
          <ScrollView
            style={styles.hospitalsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#4F46E5"]}
                tintColor="#4F46E5"
              />
            }
          >
            {hospitals.map((hospital) => (
              <HospitalCard 
                key={hospital.id} 
                hospital={hospital}
              />
            ))}
          </ScrollView>
        );
      }

      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hospitals found in your area</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search radius</Text>
        </View>
      );
    }
  };


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

  const debouncedLocationPress = handleRetryLocation
    ? debounce(handleRetryLocation, 4000)
    : undefined;

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

  const onClickHospitalFetchLocation = () => {
    if (debouncedLocationPress) {
      debouncedLocationPress();
    }
    handleTabChange('hospitals');
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔹 Header */}
      <DiscoveryHeader
        onFilterPress={openFilterModal}
        location={location}
        onLocationPress={handleRetryLocation}
        isLoadingLocation={isDetectingLocation}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'professionals' && styles.activeTab]}
          onPress={() => handleTabChange('professionals')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'professionals' && styles.activeTabText]}>
            Professionals
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hospitals' && styles.activeTab]}
          onPress={() => onClickHospitalFetchLocation()}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'hospitals' && styles.activeTabText]}>
            Hospitals
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>External</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 🔹 Main Content */}
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
   tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: hp(2),
    paddingVertical: hp(1),
    borderBottomWidth: 0.3,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1),
    alignItems: 'center',
    borderRadius: hp(1),
    marginHorizontal: hp(0.5),
  },
  activeTab: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -hp(0.5),
    right: -hp(1.5),
    backgroundColor: '#10B981',
    paddingHorizontal: hp(0.5),
    paddingVertical: hp(0.2),
    borderRadius: hp(0.5),
  },
  badgeText: {
    fontSize: hp(1),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  hospitalsList: {
    flex: 1,
    paddingHorizontal: hp(2),
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