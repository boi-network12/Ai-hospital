// src/services/ratingService.ts
import mongoose, { Types } from 'mongoose';
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
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Check for existing rating
        const existingRating = await Rating.findOne({
            userId: new Types.ObjectId(data.userId),
            professionalId: new Types.ObjectId(data.professionalId)
        }).session(session);

        let rating;
        
        if (existingRating) {
            // Update existing rating
            existingRating.rating = data.rating;
            if (data.comment !== undefined) existingRating.comment = data.comment;
            if (data.appointmentId) existingRating.appointmentId = new Types.ObjectId(data.appointmentId);
            existingRating.updatedAt = new Date();
            
            await existingRating.save({ session });
            rating = existingRating;
        } else {
            // Create new rating
            rating = new Rating({
                userId: new Types.ObjectId(data.userId),
                professionalId: new Types.ObjectId(data.professionalId),
                rating: data.rating,
                comment: data.comment,
                appointmentId: data.appointmentId ? new Types.ObjectId(data.appointmentId) : undefined
            });
            
            await rating.save({ session });
        }

        // Update professional's average rating - FIXED HERE
        await updateProfessionalStats(data.professionalId);
        
        await session.commitTransaction();
        return rating;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const updateRating = async (ratingId: string, userId: string, data: Partial<AddRatingData>) => {
    const rating = await Rating.findOneAndUpdate(
        { 
            _id: new Types.ObjectId(ratingId), 
            userId: new Types.ObjectId(userId) 
        },
        { 
            ...data,
            updatedAt: new Date()
        },
        { new: true }
    );
    
    if (!rating) {
        throw new Error('Rating not found or unauthorized');
    }
    
    // Update professional stats
    await updateProfessionalStats(rating.professionalId.toString());
    
    return rating;
};

// In ratingService.ts
const updateProfessionalStats = async (professionalId: string) => {
    try {
        const stats = await Rating.aggregate([
            { 
                $match: { 
                    professionalId: new Types.ObjectId(professionalId) 
                } 
            },
            {
                $group: {
                    _id: '$professionalId',
                    averageRating: { $avg: '$rating' },
                    totalRatings: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            // Ensure stats object exists
            await User.findByIdAndUpdate(
                professionalId, 
                {
                    $set: {
                        'healthcareProfile.stats.averageRating': Math.round(stats[0].averageRating * 10) / 10,
                        'healthcareProfile.stats.totalRatings': stats[0].totalRatings
                    }
                },
                { new: true, upsert: true } // Add upsert to create if doesn't exist
            );
        } else {
            // No ratings yet, set defaults
            await User.findByIdAndUpdate(
                professionalId,
                {
                    $set: {
                        'healthcareProfile.stats.averageRating': 0,
                        'healthcareProfile.stats.totalRatings': 0
                    }
                },
                { new: true, upsert: true }
            );
        }
    } catch (error) {
        console.error('Error updating professional stats:', error);
        throw error;
    }
};

export const getProfessionalRatings = async (professionalId: string, page: number, limit: number) => {
    const ratings = await Rating.find({ 
        professionalId: new Types.ObjectId(professionalId) 
    })
        .populate('userId', 'name profile.avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const total = await Rating.countDocuments({ 
        professionalId: new Types.ObjectId(professionalId) 
    });

    return {
        ratings: ratings.map(rating => ({
            ...rating,
            id: rating._id?.toString(),
            _id: rating._id?.toString(),
            userId: rating.userId,
            professionalId: rating.professionalId?.toString()
        })),
        total,
        page,
        limit
    };
};

export const getUserRatingForProfessional = async (userId: string, professionalId: string) => {
    const rating = await Rating.findOne({
        userId: new Types.ObjectId(userId),
        professionalId: new Types.ObjectId(professionalId)
    }).select('rating comment createdAt updatedAt').lean();
    
    return rating ? {
        ...rating,
        id: rating._id?.toString(),
        _id: rating._id?.toString()
    } : null;
};