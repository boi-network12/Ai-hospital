// components/DiscoveryComponents/LocationPermission.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import LocationIcon from "@/assets/Svgs/locate.svg";
import ShieldIcon from "@/assets/Svgs/shield.svg";

interface LocationPermissionProps {
    onGrantPermission: () => void;
    onUseDefault: () => void;
}

export default function LocationPermission({ onGrantPermission, onUseDefault }: LocationPermissionProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <LocationIcon width={hp(8)} height={hp(8)} color="#8089ff" />
            </View>

            <Text style={styles.title}>Find Healthcare Professionals Near You</Text>

            <Text style={styles.description}>
                Enable location access to discover doctors, nurses, and medical specialists in your area for faster and more relevant results.
            </Text>

            <View style={styles.features}>
                <View style={styles.feature}>
                    <ShieldIcon width={hp(2)} height={hp(2)} color="#4CAF50" />
                    <Text style={styles.featureText}>Your location data is secure and private</Text>
                </View>

                <View style={styles.feature}>
                    <ShieldIcon width={hp(2)} height={hp(2)} color="#4CAF50" />
                    <Text style={styles.featureText}>We only use location to show relevant professionals</Text>
                </View>

                <View style={styles.feature}>
                    <ShieldIcon width={hp(2)} height={hp(2)} color="#4CAF50" />
                    <Text style={styles.featureText}>You can change location anytime</Text>
                </View>
            </View>

            <View style={styles.buttons}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onGrantPermission}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>Allow Location Access</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onUseDefault}
                    activeOpacity={0.8}
                >
                    <Text style={styles.secondaryButtonText}>Use Default Location</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: hp(4),
        backgroundColor: '#fff',
    },
    iconContainer: {
        marginBottom: hp(3),
    },
    title: {
        fontSize: hp(2.5),
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: hp(2),
        color: '#333',
    },
    description: {
        fontSize: hp(1.8),
        textAlign: 'center',
        color: '#666',
        lineHeight: hp(2.5),
        marginBottom: hp(4),
    },
    features: {
        width: '100%',
        marginBottom: hp(5),
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.5),
        paddingHorizontal: hp(2),
    },
    featureText: {
        fontSize: hp(1.6),
        color: '#555',
        marginLeft: hp(1.5),
        flex: 1,
    },
    buttons: {
        width: '100%',
    },
    primaryButton: {
        backgroundColor: '#8089ff',
        paddingVertical: hp(1.8),
        borderRadius: hp(1),
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: hp(1.8),
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: hp(1.8),
        borderRadius: hp(1),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#8089ff',
    },
    secondaryButtonText: {
        color: '#8089ff',
        fontSize: hp(1.8),
        fontWeight: '600',
    },
});