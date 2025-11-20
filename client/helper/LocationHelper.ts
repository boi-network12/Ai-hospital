// src/helpers/LocationHelper.ts
import { PermissionsAndroid, Platform } from 'react-native';
import * as Location from 'expo-location';

export interface LocationData {
    city: string;
    state: string;
    country: string;
    latitude?: number;
    longitude?: number;
}

// This will be injected from your user context
let userProfileLocation: LocationData | null = null;

export const setUserProfileLocation = (location: LocationData | null) => {
    userProfileLocation = location;
};

const getSmartDefaultLocation = (): LocationData => {
    if (userProfileLocation) {
        return {
            city: userProfileLocation.city || 'Your Area',
            state: userProfileLocation.state || '',
            country: userProfileLocation.country || 'Nigeria',
        };
    }
    return { city: 'Nearby Area', state: '', country: 'Nigeria' };
};

// Check if Geolocation service is available
const isGeolocationAvailable = () => {
    return true;
};

/**
 * Request location permission for Android
 */
export const requestLocationPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
};

/**
 * Get current device location
 */
export const getCurrentLocation = async (): Promise<LocationData> => {
    try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.warn('Permission denied');
            return getDefaultLocation();
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest
        });

        const { latitude, longitude } = location.coords;

        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );

        const data = await response.json();

        return {
            city: data.city || data.locality || 'Unknown City',
            state: data.principalSubdivision || 'Unknown State',
            country: data.countryName || 'Unknown Country',
            latitude,
            longitude
        };
    } catch (error) {
        console.error('Location fetch error:', error);
        return getDefaultLocation();
    }
};


/**
 * Get location with permission handling
 */
export const getLocationWithPermission = async (): Promise<LocationData | null> => {
    try {
        // 1. Try last known location first (INSTANT — usually <100ms)
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
            console.log('Using cached location (instant)');
            return await reverseGeocode(lastKnown.coords.latitude, lastKnown.coords.longitude);
        }

        // 2. Request permission + fresh location with timeout
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return null;

        const locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // Fast + accurate enough
        });

        const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 4000)
        );

        const location = await Promise.race([locationPromise, timeoutPromise]).catch(() => null);
        if (!location?.coords) return null;

        return await reverseGeocode(location.coords.latitude, location.coords.longitude);
    } catch (error) {
        console.warn('Location failed:', error);
        return null;
    }
};

// Fast reverse geocoding with fallback
const reverseGeocode = async (lat: number, lon: number): Promise<LocationData> => {
    try {
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
            { signal: AbortSignal.timeout(3000) }
        );
        const data = await response.json();

        return {
            city: data.city || data.locality || 'Nearby Area',
            state: data.principalSubdivision || '',
            country: data.countryName || 'Nigeria',
            latitude: lat,
            longitude: lon,
        };
    } catch {
        return {
            city: 'Nearby Area',
            state: '',
            country: 'Nigeria',
            latitude: lat,
            longitude: lon,
        };
    }
};

// Export default fallback (used when location denied or failed)
export const getFallbackLocation = (): LocationData => getSmartDefaultLocation();

/**
 * Get default location (fallback)
 */
export const getDefaultLocation = (): LocationData => ({
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria'
});

/**
 * Check current permission status
 */
export const checkLocationPermission = async (): Promise<boolean> => {
    if (!isGeolocationAvailable()) return false;

    if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result;
    } else {
        // For iOS, we'll assume we need to request permission
        return false;
    }
};