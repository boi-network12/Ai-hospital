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
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) return getDefaultLocation();
        return await getCurrentLocation();
    } catch (error) {
        console.error('Failed to get location:', error);
        return getDefaultLocation();
    }
};


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