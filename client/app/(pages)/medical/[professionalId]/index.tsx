// app/medical/[professionalId].tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

// Icons
import StarIcon from "@/assets/Svgs/star.svg";
import LocationPinIcon from "@/assets/Svgs/locate.svg";
import ClockIcon from "@/assets/Svgs/clock.svg";
import VerifiedIcon from "@/assets/Svgs/badge-check.svg";
import MessageIcon from "@/assets/Svgs/message-circle-more.svg";
import TipIcon from "@/assets/Svgs/badge-dollar-sign.svg";
import BackIcon from "@/assets/Svgs/arrow-left.svg";

// Components
import { useHealthcare } from '@/context/HealthContext';
import { HealthcareProfessional } from '@/types/auth.d';
import { RefreshControl } from 'react-native-gesture-handler';

export default function MedicalProfessionalProfile() {
    const { professionalId } = useLocalSearchParams();
    const router = useRouter();
    const {
        healthcare,
        getProfessionalProfile,
        rateProfessional,
        tipProfessional
    } = useHealthcare();

    const [professional, setProfessional] = useState<HealthcareProfessional | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (healthcare.selectedProfessional) {
            setProfessional(healthcare.selectedProfessional);
            setLoading(false);
            setError(null);
        }
    }, [healthcare.selectedProfessional]);

    useEffect(() => {
        if (professionalId && !healthcare.selectedProfessional) {
            loadProfessionalProfile();
        }
    }, [professionalId]);

    const loadProfessionalProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Loading profile for professional:', professionalId);

            await getProfessionalProfile(professionalId as string);

            // DO NOT check healthcare.selectedProfessional here!
            // Instead, let the useEffect above handle it when state updates
        } catch (err: any) {
            console.error('API Error:', err);
            setError(err.message || 'Failed to load profile');
            setLoading(false);
        }
    };


    const handleSendTip = async () => {
        try {
            const amount = 10; // Default tip amount
            await tipProfessional(professionalId as string, amount, "Thank you for your service!");
            Alert.alert('Success', 'Tip sent successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to send tip');
        }
    };

    const handleSendMessage = () => {
        // Navigate to chat screen
        router.push(`/chat/${professionalId}`);
    };

    const handleRateProfessional = async (rating: number) => {
        try {
            await rateProfessional(professionalId as string, rating, "Great service!");
            Alert.alert('Success', 'Rating submitted!');
        } catch (error) {
            Alert.alert('Error', 'Failed to submit rating');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                {/* Header - still show back button while loading */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <BackIcon width={hp(2.5)} height={hp(2.5)} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Professional Profile</Text>
                    <View style={styles.headerRight} />
                </View>

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={loadProfessionalProfile} />
                    }
                >
                    <View style={styles.loadingContainer}>
                        {/* Option 1: Simple ActivityIndicator */}
                        <ActivityIndicator size="large" color="#8089ff" />

                        {/* Option 2: Beautiful Lottie Animation (recommended) */}
                        {/* 
                    <LottieView
                        source={require('@/assets/animations/doctor-loading.json')} // Add a nice medical loading animation
                        autoPlay
                        loop
                        style={{ width: hp(25), height: hp(25) }}
                    />
                    */}

                        <Text style={styles.loadingText}>Loading professional profile...</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (!professional || error) {
        return (
            <SafeAreaView style={styles.container}>
                {/* Keep header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <BackIcon width={hp(2.5)} height={hp(2.5)} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Professional Profile</Text>
                    <View style={styles.headerRight} />
                </View>

                <View style={styles.notFoundContainer}>
                    {/* Sad doctor or "not found" illustration */}
                    <View style={styles.notFoundIcon}>
                        {/* You can use an SVG or Lottie here */}
                        {/* <Image
                            source={require('@/assets/images/no-doctor-found.png')} // Recommended: add this image
                            style={{ width: hp(20), height: hp(20) }}
                            resizeMode="contain"
                        /> */}
                        {/* Alternative simple icon using your existing SVGs */}
                        {/* <LocationPinIcon width={hp(10)} height={hp(10)} fill="#ccc" /> */}
                    </View>

                    <Text style={styles.notFoundTitle}>Professional Not Found</Text>
                    <Text style={styles.notFoundMessage}>
                        {error
                            ? "We couldn't load this profile. Please check your connection and try again."
                            : "The healthcare professional you're looking for may no longer be available."}
                    </Text>

                    <TouchableOpacity style={styles.retryButton} onPress={loadProfessionalProfile}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.goBackButton}
                        onPress={() => router.replace('/(tabs)/explore')} // or wherever your list is
                    >
                        <Text style={styles.goBackButtonText}>Browse Other Professionals</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <BackIcon width={hp(2.5)} height={hp(2.5)} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Professional Profile</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.content}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {professional.profile?.avatar ? (
                            <Image
                                source={{ uri: professional.profile.avatar }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {professional.name?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        {professional.healthcareProfile?.isVerified && (
                            <View style={styles.verifiedBadge}>
                                <VerifiedIcon width={hp(1.8)} height={hp(1.8)} fill="#fff" />
                            </View>
                        )}
                    </View>

                    <Text style={styles.name}>{professional.name}</Text>
                    <Text style={styles.role}>
                        {professional.role === "doctor" ? "Medical Doctor" : "Registered Nurse"}
                    </Text>

                    <View style={styles.ratingContainer}>
                        <StarIcon width={hp(2)} height={hp(2)} fill="#FFC107" />
                        <Text style={styles.rating}>
                            {professional.healthcareProfile?.stats?.averageRating?.toFixed(1) || "0.0"}
                        </Text>
                        <Text style={styles.ratingCount}>
                            ({professional.healthcareProfile?.stats?.totalRatings || 0} ratings)
                        </Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleSendMessage}>
                        <MessageIcon width={hp(2.5)} height={hp(2.5)} fill="#fff" />
                        <Text style={styles.actionText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleSendTip}>
                        <TipIcon width={hp(2.5)} height={hp(2.5)} fill="#fff" />
                        <Text style={styles.actionText}>Tip</Text>
                    </TouchableOpacity>
                </View>

                {/* Details */}
                <View style={styles.details}>
                    <View style={styles.detailItem}>
                        <LocationPinIcon width={hp(2)} height={hp(2)} fill="#666" />
                        <Text style={styles.detailText}>
                            {professional.profile?.location?.city || 'Unknown City'},
                            {professional.profile?.location?.state || 'Unknown State'}
                        </Text>
                    </View>

                    <View style={styles.detailItem}>
                        <ClockIcon width={hp(2)} height={hp(2)} fill="#666" />
                        <Text style={[
                            styles.detailText,
                            professional.healthcareProfile?.availability?.isAvailable
                                ? styles.available
                                : styles.unavailable
                        ]}>
                            {professional.healthcareProfile?.availability?.isAvailable
                                ? "Available Now"
                                : "Currently Unavailable"}
                        </Text>
                    </View>
                </View>

                {/* Bio */}
                {professional.healthcareProfile?.bio && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.bio}>{professional.healthcareProfile.bio}</Text>
                    </View>
                )}

                {/* Specializations */}
                {professional.healthcareProfile?.specializations && professional.healthcareProfile.specializations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Specializations</Text>
                        <View style={styles.specializations}>
                            {professional.healthcareProfile.specializations.map((spec, index) => (
                                <View key={index} style={styles.specItem}>
                                    <Text style={styles.specName}>{spec.name}</Text>
                                    <Text style={styles.specExp}>{spec.yearsOfExperience} years</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Quick Rating */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rate this Professional</Text>
                    <View style={styles.ratingButtons}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                style={styles.starButton}
                                onPress={() => handleRateProfessional(star)}
                            >
                                <StarIcon width={hp(3)} height={hp(3)} fill="#FFC107" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderBottomWidth: 0.5,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: hp(1),
    },
    headerTitle: {
        fontSize: hp(1.8),
        fontWeight: '500',
    },
    headerRight: {
        width: hp(4),
    },
    content: {
        flex: 1,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: hp(3),
        paddingHorizontal: wp(4),
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: hp(2),
    },
    avatar: {
        width: hp(12),
        height: hp(12),
        borderRadius: hp(6),
    },
    avatarPlaceholder: {
        width: hp(12),
        height: hp(12),
        borderRadius: hp(6),
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: hp(3),
        fontWeight: 'bold',
        color: '#666',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        borderRadius: hp(1),
        padding: hp(0.5),
    },
    name: {
        fontSize: hp(2.5),
        fontWeight: 'bold',
        marginBottom: hp(0.5),
    },
    role: {
        fontSize: hp(1.8),
        color: '#666',
        marginBottom: hp(1),
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: hp(1.8),
        fontWeight: '600',
        marginLeft: wp(1),
    },
    ratingCount: {
        fontSize: hp(1.6),
        color: '#999',
        marginLeft: wp(1),
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: wp(4),
        marginBottom: hp(2),
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8089ff',
        paddingVertical: hp(1.5),
        marginHorizontal: wp(1),
        borderRadius: hp(1),
    },
    actionText: {
        color: '#fff',
        fontSize: hp(1.8),
        fontWeight: '600',
        marginLeft: wp(2),
    },
    details: {
        paddingHorizontal: wp(4),
        marginBottom: hp(2),
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    detailText: {
        fontSize: hp(1.7),
        marginLeft: wp(2),
        color: '#666',
    },
    available: {
        color: '#4CAF50',
    },
    unavailable: {
        color: '#F44336',
    },
    section: {
        paddingHorizontal: wp(4),
        marginBottom: hp(3),
    },
    sectionTitle: {
        fontSize: hp(2),
        fontWeight: '600',
        marginBottom: hp(1),
    },
    bio: {
        fontSize: hp(1.7),
        lineHeight: hp(2.2),
        color: '#666',
    },
    specializations: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    specItem: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.5),
        borderRadius: hp(1),
        marginRight: wp(2),
        marginBottom: hp(1),
    },
    specName: {
        fontSize: hp(1.6),
        fontWeight: '500',
    },
    specExp: {
        fontSize: hp(1.4),
        color: '#666',
    },
    ratingButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    starButton: {
        padding: wp(2),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: hp(10),
    },
    loadingText: {
        marginTop: hp(3),
        fontSize: hp(2),
        color: '#666',
        fontWeight: '500',
    },

    notFoundContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(8),
    },
    notFoundIcon: {
        marginBottom: hp(4),
        opacity: 0.6,
    },
    notFoundTitle: {
        fontSize: hp(2.8),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: hp(1.5),
    },
    notFoundMessage: {
        fontSize: hp(1.9),
        color: '#777',
        textAlign: 'center',
        lineHeight: hp(2.6),
        marginBottom: hp(4),
    },
    retryButton: {
        backgroundColor: '#8089ff',
        paddingHorizontal: wp(8),
        paddingVertical: hp(1.8),
        borderRadius: hp(1.5),
        minWidth: wp(60),
    },
    retryButtonText: {
        color: '#fff',
        fontSize: hp(2),
        fontWeight: '600',
        textAlign: 'center',
    },
    goBackButton: {
        marginTop: hp(2),
        padding: hp(1.5),
    },
    goBackButtonText: {
        color: '#8089ff',
        fontSize: hp(1.9),
        fontWeight: '500',
    },
});