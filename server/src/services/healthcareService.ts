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

    // Base query for active healthcare professionals
    const baseQuery: any = {
        role: { $in: ['doctor', 'nurse'] },
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

    // // Availability filter - prioritize available professionals
    // if (availability) {
    //     baseQuery['healthcareProfile.availability.isAvailable'] = true;
    //     baseQuery.isOnline = true;
    // }

    // Enhanced cascading search with multiple levels
    const searchResults = await performCascadingSearch(baseQuery, location, coordinates, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string
    });

    return {
        professionals: searchResults.professionals,
        total: searchResults.total,
        page,
        limit,
        searchLocation: searchResults.usedLocationType,
        searchScope: searchResults.searchScope
    };
};

// Enhanced cascading search implementation
const performCascadingSearch = async (
    baseQuery: any,
    location?: { city?: string; state?: string; country?: string },
    coordinates?: { latitude: number; longitude: number; maxDistance: number },
    options: { page: number; limit: number; sortBy: string } = { page: 1, limit: 20, sortBy: 'rating' }
) => {
    const { page, limit, sortBy } = options;

    const searchLevels = await buildSearchLevels(baseQuery, location, coordinates);
    let professionals: any[] = [];
    let total = 0;
    let usedLocationType = 'global';
    let searchScope = 'global';

    const MIN_RESULTS_TO_STOP = 5; // Don't stop cascading unless we have at least 5 pros

    for (const level of searchLevels) {
        try {
            const result = await executeSearchQuery(level.query, level.sort || getSortCriteria(sortBy), page, limit * 3, level.aggregation);

            if (result.professionals.length > 0) {
                professionals = result.professionals;
                total = result.total;
                usedLocationType = level.locationType;
                searchScope = level.scope;

                // ONLY stop early if we have enough results
                if (professionals.length >= MIN_RESULTS_TO_STOP) {
                    break;
                }
                // Otherwise: continue to broader search to collect more
            }
        } catch (error) {
            console.error(`Error searching in ${level.locationType}:`, error);
        }
    }

    // Final fallback: always get global if still too few
    if (professionals.length < MIN_RESULTS_TO_STOP) {
        const fallback = await executeSearchQuery(baseQuery, getSortCriteria(sortBy), 1, limit * 5);
        const globalPros = fallback.professionals.filter((p: any) =>
            !professionals.some(existing => existing.id === p.id)
        );

        professionals = [...professionals, ...globalPros].slice(0, limit);
        total = professionals.length;
        usedLocationType = professionals.length > 0 ? usedLocationType : 'global';
        searchScope = 'mixed';
    }

    return {
        professionals,
        total,
        usedLocationType,
        searchScope: searchScope === 'mixed' ? 'country' : searchScope
    };
};

// Build search levels from most specific to broadest
const buildSearchLevels = async (
    baseQuery: any,
    location?: { city?: string; state?: string; country?: string },
    coordinates?: { latitude: number; longitude: number; maxDistance: number }
) => {
    const levels = [];

    // 1. NEARBY + HIGH RATED (Fastest win — most users want this)
    if (coordinates) {
        levels.push({
            query: { ...baseQuery },
            locationType: 'nearby',
            scope: 'local_area',
            sort: getSortCriteria('rating', true),
            aggregation: [
                {
                    $geoNear: {
                        near: { type: 'Point', coordinates: [coordinates.longitude, coordinates.latitude] },
                        distanceField: 'distance',
                        maxDistance: 50 * 1000, // 50km
                        spherical: true,
                        query: baseQuery
                    }
                }
            ]
        });
    }

    // 2. Same city (text match)
    if (location?.city) {
        const escaped = location.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        levels.push({
            query: { ...baseQuery, 'profile.location.city': new RegExp(escaped, 'i') },
            locationType: 'city',
            scope: 'city',
            sort: getSortCriteria('rating')
        });
    }

    // 3. Same country (still relevant)
    if (location?.country) {
        levels.push({
            query: { ...baseQuery, 'profile.location.country': new RegExp(location.country, 'i') },
            locationType: 'country',
            scope: 'country',
            sort: getSortCriteria('rating')
        });
    }

    // 4. Global fallback (always works)
    levels.push({
        query: baseQuery,
        locationType: 'global',
        scope: 'global',
        sort: getSortCriteria('rating')
    });

    return levels;
};

// Execute search query with proper sorting and pagination
const executeSearchQuery = async (
    query: any,
    sort: any,
    page: number,
    limit: number,
    aggregation?: any[]
) => {
    let professionals: any[] = [];
    let total = 0;

    if (aggregation) {
        // Use aggregation pipeline for geo queries
        const pipeline = [
            ...aggregation,
            { $sort: sort },
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
        ];

        professionals = await User.aggregate(pipeline);
        total = await User.countDocuments(query);
    } else {
        // Regular query
        professionals = await User.find(query)
            .select('-password -sessions.token -passwordResetOtp -passwordResetOtpExpires')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean<IUserLean[]>();

        total = await User.countDocuments(query);
    }

    return {
        professionals: professionals.map(prof => ({
            ...prof,
            id: prof._id.toString(),
            _id: undefined
        })),
        total
    };
};

// Get sort criteria based on user preference
const getSortCriteria = (sortBy: string, hasDistance = false) => {
    const baseSort = {
        'healthcareProfile.stats.averageRating': -1,
        'healthcareProfile.stats.totalRatings': -1,     // More ratings = more trusted
        'healthcareProfile.availability.isAvailable': -1, // Soft boost for available
        createdAt: -1
    };

    if (hasDistance) {
        return { distance: 1, ...baseSort }; // Closest first
    }

    return baseSort;
};


export const getProfessionalProfile = async (professionalId: string) => {
    const professional = await User.findById(professionalId)
        .select('-password -sessions.token -email -phoneNumber')
        .lean<IUserLean>();

    if (!professional) throw new Error('Professional not found');

    // Add ratings and stats
    const Rating = (await import('../models/RatingModel')).default;
    const ratings = await Rating.find({ professionalId })
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    return {
        ...professional,
        id: professional._id.toString(),
        _id: undefined,
        recentRatings: ratings.map(r => ({
            ...r,
            id: r._id.toString(),
            _id: undefined,
            userId: r.userId ? {
                ...r.userId,
                id: r.userId._id.toString(),
                _id: undefined
            } : null
        }))
    };
};