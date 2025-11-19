// components/DiscoveryComponents/ProfessionalsList.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { HealthcareProfessional } from '@/types/auth.d';
import StarIcon from "@/assets/Svgs/star.svg";
import LocationPinIcon from "@/assets/Svgs/locate.svg";
import ClockIcon from "@/assets/Svgs/clock.svg";

interface ProfessionalsListProps {
    professionals: HealthcareProfessional[];
    location?: {
        city: string;
        state: string;
        country: string;
    } | null;
    onProfessionalPress?: (professional: HealthcareProfessional) => void;
}

export default function ProfessionalsList({
    professionals,
    location,
    onProfessionalPress
}: ProfessionalsListProps) {

    const renderProfessionalItem = ({ item }: { item: HealthcareProfessional }) => (
        <TouchableOpacity
            style={styles.professionalCard}
            onPress={() => onProfessionalPress?.(item)}
            activeOpacity={0.8}
        >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
                {item.profile?.avatar ? (
                    <Image
                        source={{ uri: item.profile.avatar }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                {/* Online Status */}
                {item.healthcareProfile?.isOnline && (
                    <View style={styles.onlineIndicator} />
                )}
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                </Text>

                <Text style={styles.role}>
                    {item.role === 'doctor' ? 'Medical Doctor' : 'Registered Nurse'}
                    {item.healthcareProfile?.specializations?.[0] &&
                        ` • ${item.healthcareProfile.specializations[0].name}`
                    }
                </Text>

                {/* Rating */}
                <View style={styles.ratingContainer}>
                    <StarIcon width={hp(1.5)} height={hp(1.5)} color="#FFD700" />
                    <Text style={styles.rating}>
                        {item.healthcareProfile?.stats?.averageRating?.toFixed(1) || '0.0'}
                    </Text>
                    <Text style={styles.ratingCount}>
                        ({item.healthcareProfile?.stats?.totalRatings || 0})
                    </Text>
                </View>

                {/* Location & Distance */}
                <View style={styles.locationContainer}>
                    <LocationPinIcon width={hp(1.5)} height={hp(1.5)} color="#666" />
                    <Text style={styles.location} numberOfLines={1}>
                        {item.profile?.location?.city || 'Unknown location'}
                        {item.distance && ` • ${item.distance.toFixed(1)}km away`}
                    </Text>
                </View>

                {/* Availability */}
                <View style={styles.availabilityContainer}>
                    <ClockIcon width={hp(1.5)} height={hp(1.5)} color="#666" />
                    <Text style={[
                        styles.availability,
                        item.healthcareProfile?.availability?.isAvailable
                            ? styles.available
                            : styles.unavailable
                    ]}>
                        {item.healthcareProfile?.availability?.isAvailable
                            ? 'Available now'
                            : 'Not available'
                        }
                    </Text>
                </View>

                {/* Services */}
                {item.healthcareProfile?.services && item.healthcareProfile.services.length > 0 && (
                    <View style={styles.servicesContainer}>
                        <Text style={styles.services} numberOfLines={1}>
                            {item.healthcareProfile.services.slice(0, 3).join(' • ')}
                        </Text>
                    </View>
                )}
            </View>

            {/* Consultation Fee */}
            {item.healthcareProfile?.hourlyRate && (
                <View style={styles.feeContainer}>
                    <Text style={styles.fee}>
                        ${item.healthcareProfile.hourlyRate}/hr
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    Healthcare Professionals
                </Text>
                <Text style={styles.subtitle}>
                    {professionals.length} found near {location?.city || 'your location'}
                </Text>
            </View>

            <FlatList
                data={professionals}
                renderItem={renderProfessionalItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: hp(2),
    },
    header: {
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: hp(1),
    },
    title: {
        fontSize: hp(2.2),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: hp(0.5),
    },
    subtitle: {
        fontSize: hp(1.6),
        color: '#666',
    },
    listContent: {
        paddingBottom: hp(2),
    },
    professionalCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: hp(1.5),
        padding: hp(1.5),
        marginVertical: hp(0.5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: hp(1.5),
    },
    avatar: {
        width: hp(6),
        height: hp(6),
        borderRadius: hp(3),
    },
    avatarPlaceholder: {
        width: hp(6),
        height: hp(6),
        borderRadius: hp(3),
        backgroundColor: '#8089ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: hp(2),
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: hp(1.2),
        height: hp(1.2),
        borderRadius: hp(0.6),
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: hp(1.8),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: hp(0.3),
    },
    role: {
        fontSize: hp(1.5),
        color: '#666',
        marginBottom: hp(0.5),
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(0.3),
    },
    rating: {
        fontSize: hp(1.4),
        fontWeight: '600',
        color: '#333',
        marginLeft: hp(0.5),
        marginRight: hp(0.3),
    },
    ratingCount: {
        fontSize: hp(1.3),
        color: '#666',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(0.3),
    },
    location: {
        fontSize: hp(1.3),
        color: '#666',
        marginLeft: hp(0.5),
        flex: 1,
    },
    availabilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(0.5),
    },
    availability: {
        fontSize: hp(1.3),
        marginLeft: hp(0.5),
        fontWeight: '500',
    },
    available: {
        color: '#4CAF50',
    },
    unavailable: {
        color: '#F44336',
    },
    servicesContainer: {
        marginTop: hp(0.5),
    },
    services: {
        fontSize: hp(1.2),
        color: '#888',
        fontStyle: 'italic',
    },
    feeContainer: {
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    fee: {
        fontSize: hp(1.4),
        fontWeight: 'bold',
        color: '#8089ff',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: hp(0.5),
    },
});