// src/services/healthcareService.ts
import User from '../models/UserModel';
import { IUserLean, UserRole } from '../types/usersDetails';

interface FindProfessionalsFilters {
    role: 'doctor' | 'nurse';
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
    specialization?: string;
    minRating?: number;
    coordinates?: {
        latitude: number;
        longitude: number;
        maxDistance: number; // km
    };
    availability?: boolean;
    page: number;
    limit: number;
    sortBy: string;
}

// src/services/healthcareService.ts
export const findHealthcareProfessionals = async (filters: FindProfessionalsFilters) => {
    const {
        role,
        location,
        specialization,
        minRating,
        coordinates,
        availability,
        page,
        limit,
        sortBy
    } = filters;

    // Base query for healthcare professionals
    const baseQuery: any = {
        role: { $in: ['doctor', 'nurse'] }, // Only doctors and nurses
        isDeleted: false,
        isVerified: true,
        'roleStatus.isActive': true,
        'roleStatus.approvedByAdmin': true
    };

    // Role filter
    if (role) {
        baseQuery.role = role;
    }

    // Specialization filter
    if (specialization && specialization !== 'all') {
        baseQuery['healthcareProfile.specializations.name'] = new RegExp(specialization, 'i');
    }

    // Rating filter
    if (minRating && minRating > 0) {
        baseQuery['healthcareProfile.stats.averageRating'] = { $gte: minRating };
    }

    // Availability filter
    if (availability) {
        baseQuery['healthcareProfile.availability.isAvailable'] = true;
        baseQuery.isOnline = true;
    }

    let sort: any = {};
    switch (sortBy) {
        case 'rating':
            sort = { 'healthcareProfile.stats.averageRating': -1 };
            break;
        case 'experience':
            sort = { 'healthcareProfile.specializations.yearsOfExperience': -1 };
            break;
        case 'distance':
            // Will be handled in geo query
            sort = { distance: 1 };
            break;
        default:
            sort = { 'healthcareProfile.stats.averageRating': -1 };
    }

    // 🔥 CASCADING LOCATION SEARCH LOGIC
    const searchLocations = await buildCascadingLocationQueries(baseQuery, location, coordinates);

    let professionals: any[] = [];
    let total = 0;
    let usedLocationType = 'worldwide'; // Track which location level we used

    // Try each location level until we find professionals
    for (const locationQuery of searchLocations) {
        const { query, locationType, geoPipeline } = locationQuery;

        try {
            if (geoPipeline) {
                // Geo-spatial search with coordinates
                const result = await User.aggregate([
                    ...geoPipeline,
                    { $sort: sortBy === 'distance' ? { distance: 1 } : sort },
                    { $skip: (page - 1) * limit },
                    { $limit: limit },
                    {
                        $project: {
                            password: 0,
                            'sessions.token': 0,
                            passwordResetOtp: 0,
                            passwordResetOtpExpires: 0
                        }
                    }
                ]);

                if (result.length > 0) {
                    professionals = result;
                    total = await User.countDocuments(query);
                    usedLocationType = locationType;
                    break; // Found professionals, stop searching
                }
            } else {
                // Text-based location search
                const result = await User.find(query)
                    .select('-password -sessions.token -passwordResetOtp -passwordResetOtpExpires')
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean<IUserLean[]>();

                if (result.length > 0) {
                    professionals = result;
                    total = await User.countDocuments(query);
                    usedLocationType = locationType;
                    break; // Found professionals, stop searching
                }
            }
        } catch (error) {
            console.error(`Error searching in ${locationType}:`, error);
            // Continue to next location level
            continue;
        }
    }

    // If still no professionals found, get any healthcare professionals worldwide
    if (professionals.length === 0) {
        professionals = await User.find(baseQuery)
            .select('-password -sessions.token -passwordResetOtp -passwordResetOtpExpires')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean<IUserLean[]>();

        total = await User.countDocuments(baseQuery);
        usedLocationType = 'worldwide';
    }

    return {
        professionals: professionals.map(prof => ({
            ...prof,
            id: prof._id.toString(),
            _id: undefined,
            searchLocation: usedLocationType // Add which location level was used
        })),
        total,
        page,
        limit,
        searchLocation: usedLocationType // Metadata about search scope
    };
};

// 🔥 Build cascading location queries from most specific to broadest
const buildCascadingLocationQueries = async (
    baseQuery: any,
    location?: { city?: string; state?: string; country?: string },
    coordinates?: { latitude: number; longitude: number; maxDistance: number }
) => {
    const locationQueries: Array<{
        query: any;
        locationType: string;
        geoPipeline?: any[];
    }> = [];

    // If we have coordinates, prioritize geo-spatial search
    if (coordinates && coordinates.latitude && coordinates.longitude) {
        // 1. Exact coordinates with small radius (5km)
        locationQueries.push({
            query: { ...baseQuery },
            locationType: 'exact_location',
            geoPipeline: [
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [coordinates.longitude, coordinates.latitude]
                        },
                        distanceField: 'distance',
                        maxDistance: 5000, // 5km
                        spherical: true,
                        query: baseQuery
                    }
                }
            ]
        });

        // 2. Broader radius (25km)
        locationQueries.push({
            query: { ...baseQuery },
            locationType: 'nearby_cities',
            geoPipeline: [
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [coordinates.longitude, coordinates.latitude]
                        },
                        distanceField: 'distance',
                        maxDistance: 25000, // 25km
                        spherical: true,
                        query: baseQuery
                    }
                }
            ]
        });

        // 3. Even broader radius (100km)
        locationQueries.push({
            query: { ...baseQuery },
            locationType: 'regional',
            geoPipeline: [
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [coordinates.longitude, coordinates.latitude]
                        },
                        distanceField: 'distance',
                        maxDistance: coordinates.maxDistance * 1000, // Use provided max distance
                        spherical: true,
                        query: baseQuery
                    }
                }
            ]
        });
    }

    // Text-based location cascading (if location data provided)
    if (location) {
        // 4. Exact city match
        if (location.city) {
            locationQueries.push({
                query: {
                    ...baseQuery,
                    'profile.location.city': new RegExp(`^${location.city}$`, 'i')
                },
                locationType: 'exact_city'
            });
        }

        // 5. City contains (broader city search)
        if (location.city) {
            locationQueries.push({
                query: {
                    ...baseQuery,
                    'profile.location.city': new RegExp(location.city, 'i')
                },
                locationType: 'similar_cities'
            });
        }

        // 6. State level
        if (location.state) {
            locationQueries.push({
                query: {
                    ...baseQuery,
                    'profile.location.state': new RegExp(location.state, 'i')
                },
                locationType: 'state'
            });
        }

        // 7. Country level
        if (location.country) {
            locationQueries.push({
                query: {
                    ...baseQuery,
                    'profile.location.country': new RegExp(location.country, 'i')
                },
                locationType: 'country'
            });
        }

        // 8. Continent level (simplified - you might want to map countries to continents)
        if (location.country) {
            // For Nigeria, search nearby African countries
            const africanCountries = ['nigeria', 'ghana', 'kenya', 'south africa', 'egypt'];
            if (africanCountries.includes(location.country.toLowerCase())) {
                locationQueries.push({
                    query: {
                        ...baseQuery,
                        'profile.location.country': {
                            $in: africanCountries.map(country => new RegExp(country, 'i'))
                        }
                    },
                    locationType: 'continent'
                });
            }
        }
    }

    // 9. National level (all professionals in the country if we have country info)
    if (location?.country) {
        locationQueries.push({
            query: {
                ...baseQuery,
                'profile.location.country': new RegExp(location.country, 'i')
            },
            locationType: 'national'
        });
    }

    return locationQueries;
};


export const getProfessionalProfile = async (professionalId: string) => {
    const professional = await User.findById(professionalId)
        .select('-password -sessions.token -email -phoneNumber')
        .populate('healthcareProfile.certifications.verifiedBy', 'name')
        .lean<IUserLean>();

    if (!professional) throw new Error('Professional not found');

    // Add ratings and stats
    const Rating = (await import('../models/RatingModel')).default;
    const ratings = await Rating.find({ professionalId })
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(10);

    return {
        ...professional,
        id: professional._id.toString(),
        _id: undefined,
        recentRatings: ratings
    };
};