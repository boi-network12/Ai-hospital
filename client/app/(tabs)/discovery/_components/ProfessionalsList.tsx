import React, { useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Animated,
    useWindowDimensions,
} from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import { HealthcareProfessional } from "@/types/auth.d";

import StarIcon from "@/assets/Svgs/star.svg";
import LocationPinIcon from "@/assets/Svgs/locate.svg";
import ClockIcon from "@/assets/Svgs/clock.svg";
import VerifiedIcon from "@/assets/Svgs/badge-check.svg";
import { useRouter } from "expo-router";

interface ProfessionalsListProps {
    professionals: HealthcareProfessional[];
}

export default function ProfessionalsList({ professionals }: ProfessionalsListProps) {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isTablet = width > 768;
    const numColumns = isTablet ? 3 : 2;

    const animationValues = useRef(professionals.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.stagger(
            150,
            animationValues.map((anim) =>
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                })
            )
        ).start();
    }, [professionals]);

    const handleProfessionalPress = (professional: HealthcareProfessional) => {
        router.push(`/medical/${professional.id}`);
    };

    const renderProfessionalItem = ({ item, index }: { item: HealthcareProfessional; index: number }) => {
        const scale = animationValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
        });

        return (
            <Animated.View style={{ transform: [{ scale }], opacity: animationValues[index] }}>
                <TouchableOpacity style={styles.card} onPress={() => handleProfessionalPress(item)} activeOpacity={0.9}>
                    {/* Avatar Section */}
                    <View style={styles.avatarContainer}>
                        {item.profile?.avatar ? (
                            <Image source={{ uri: item.profile.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        {item.healthcareProfile?.isVerified && (
                            <View style={styles.verifiedBadge}>
                                <VerifiedIcon width={hp(1.5)} height={hp(1.5)} fill="#fff" />
                            </View>
                        )}
                    </View>

                    {/* Name */}
                    <Text style={styles.name} numberOfLines={1}>
                        {item.name}
                    </Text>

                    {/* Role */}
                    <Text style={styles.role} numberOfLines={1}>
                        {item.role === "doctor"
                            ? "Medical Doctor"
                            : item.role === "nurse"
                                ? "Registered Nurse"
                                : "Healthcare Professional"}
                    </Text>

                    {/* Rating */}
                    <View style={styles.infoRow}>
                        <StarIcon width={hp(1.5)} height={hp(1.5)} fill="#FFC107" />
                        <Text style={styles.rating}>
                            {item.healthcareProfile?.stats?.averageRating?.toFixed(1) || "0.0"}
                        </Text>
                        <Text style={styles.ratingCount}>
                            ({item.healthcareProfile?.stats?.totalRatings || 0})
                        </Text>
                    </View>

                    {/* Location */}
                    <View style={styles.infoRow}>
                        <LocationPinIcon width={hp(1.5)} height={hp(1.5)} fill="#6B7280" />
                        <Text style={styles.location} numberOfLines={1}>
                            {item.profile?.location?.city || "Unknown"}
                        </Text>
                    </View>

                    {/* Availability */}
                    <View style={styles.infoRow}>
                        <ClockIcon width={hp(1.5)} height={hp(1.5)} fill="#6B7280" />
                        <Text
                            style={[
                                styles.availability,
                                item.healthcareProfile?.availability?.isAvailable ? styles.available : styles.unavailable,
                            ]}
                        >
                            {item.healthcareProfile?.availability?.isAvailable ? "Available" : "Unavailable"}
                        </Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <FlatList
            data={professionals}
            renderItem={renderProfessionalItem}
            numColumns={numColumns}
            key={numColumns}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
        />
    );
}

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
    },
    columnWrapper: {
        justifyContent: "space-between",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: hp(1),
        padding: hp(2),
        marginBottom: hp(2),
        width: wp(42),
        alignSelf: "center",
        borderWidth: hp(0.05),
        borderColor: "#E5E7EB",
    },
    avatarContainer: {
        alignSelf: "center",
        marginBottom: hp(1.5),
    },
    avatar: {
        width: hp(7),
        height: hp(7),
        borderRadius: hp(7) / 2,
    },
    avatarPlaceholder: {
        width: hp(7),
        height: hp(7),
        borderRadius: hp(7) / 2,
        backgroundColor: "#E5E7EB",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: hp(2.4),
        fontWeight: "700",
        color: "#6B7280",
    },
    verifiedBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#4F46E5",
        borderRadius: hp(1),
        padding: hp(0.3),
        borderWidth: 1,
        borderColor: "#fff",
    },
    name: {
        fontSize: hp(1.9),
        fontWeight: "600",
        textAlign: "center",
        color: "#111827",
        marginBottom: hp(0.4),
    },
    role: {
        fontSize: hp(1.5),
        color: "#6B7280",
        textAlign: "center",
        marginBottom: hp(1),
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: hp(0.4),
    },
    rating: {
        fontSize: hp(1.4),
        fontWeight: "600",
        marginLeft: 4,
        color: "#4B5563",
    },
    ratingCount: {
        fontSize: hp(1.2),
        color: "#9CA3AF",
        marginLeft: 2,
    },
    location: {
        fontSize: hp(1.3),
        color: "#4B5563",
        marginLeft: hp(0.6),
        flex: 1,
    },
    availability: {
        fontSize: hp(1.3),
        marginLeft: hp(0.6),
        fontWeight: "500",
    },
    available: { color: "#10B981" },
    unavailable: { color: "#EF4444" },
});
