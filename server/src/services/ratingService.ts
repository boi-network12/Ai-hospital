// src/services/ratingService.ts
import Rating from '../models/RatingModel';
import User from '../models/UserModel';

interface AddRatingData {
    userId: string;
    professionalId: string;
    rating: number;
    comment?: string;
    appointmentId?: string;
}

export const addRating = async (data: AddRatingData) => {
    // Check if user already rated this professional
    const existingRating = await Rating.findOne({
        userId: data.userId,
        professionalId: data.professionalId
    });

    if (existingRating) {
        throw new Error('You have already rated this professional');
    }

    const rating = new Rating(data);
    await rating.save();

    // Update professional's average rating
    await updateProfessionalStats(data.professionalId);

    return rating;
};

const updateProfessionalStats = async (professionalId: string) => {
    const stats = await Rating.aggregate([
        { $match: { professionalId: professionalId } },
        {
            $group: {
                _id: '$professionalId',
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await User.findByIdAndUpdate(professionalId, {
            $set: {
                'healthcareProfile.stats.averageRating': Math.round(stats[0].averageRating * 10) / 10,
                'healthcareProfile.stats.totalRatings': stats[0].totalRatings
            }
        });
    }
};

export const getProfessionalRatings = async (professionalId: string, page: number, limit: number) => {
    const ratings = await Rating.find({ professionalId })
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await Rating.countDocuments({ professionalId });

    return {
        ratings,
        total,
        page,
        limit
    };
};
