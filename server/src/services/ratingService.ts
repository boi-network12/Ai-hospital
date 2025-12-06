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
        // VALIDATE INPUTS FIRST
        if (!data.userId || !data.professionalId) {
            throw new Error('User ID and Professional ID are required');
        }

        // Validate ObjectId format
        if (!Types.ObjectId.isValid(data.userId) || !Types.ObjectId.isValid(data.professionalId)) {
            throw new Error('Invalid ID format');
        }

        const userObjId = new Types.ObjectId(data.userId);
        const profObjId = new Types.ObjectId(data.professionalId);

        // Check for existing rating FIRST
        const existingRating = await Rating.findOne({
            userId: userObjId,
            professionalId: profObjId
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
                userId: userObjId,
                professionalId: profObjId,
                rating: data.rating,
                comment: data.comment,
                appointmentId: data.appointmentId ? new Types.ObjectId(data.appointmentId) : undefined
            });
            
            await rating.save({ session });
        }

        // Update professional stats
        await updateProfessionalStats(data.professionalId);
        
        await session.commitTransaction();
        
        return rating;
    } catch (error: any) {
        await session.abortTransaction();
        
        // Handle specific MongoDB duplicate key error
        if (error.code === 11000) {
            console.log('Duplicate key error detected, cleaning up null values...');
            
            // Clean up any documents with null values (outside of transaction)
            await Rating.deleteMany({
                $or: [
                    { userId: null },
                    { professionalId: null }
                ]
            });
            
            console.log('Null values cleaned up, now retrying the rating operation...');
            
            // Retry the operation WITHOUT transaction for simplicity
            return addRatingRetry(data);
        }
        
        console.error('Rating error:', error);
        throw error;
    } finally {
        await session.endSession();
    }
};

// Separate retry function without transaction to avoid nested transactions
const addRatingRetry = async (data: AddRatingData) => {
    try {
        console.log('Retrying rating operation after cleanup...');
        
        // VALIDATE INPUTS FIRST
        if (!data.userId || !data.professionalId) {
            throw new Error('User ID and Professional ID are required');
        }

        // Validate ObjectId format
        if (!Types.ObjectId.isValid(data.userId) || !Types.ObjectId.isValid(data.professionalId)) {
            throw new Error('Invalid ID format');
        }

        const userObjId = new Types.ObjectId(data.userId);
        const profObjId = new Types.ObjectId(data.professionalId);

        // DEBUG: Check what exists in the database
        console.log('Checking for existing ratings...');
        const existingRatings = await Rating.find({
            $or: [
                { userId: userObjId, professionalId: profObjId },
                { userId: userObjId },
                { professionalId: profObjId }
            ]
        });
        console.log('Existing ratings found:', existingRatings.length);

        // Check for existing rating - look more thoroughly
        const existingRating = await Rating.findOne({
            userId: userObjId,
            professionalId: profObjId
        });

        if (existingRating) {
            console.log('Found existing rating, updating it...');
            // Update existing rating
            existingRating.rating = data.rating;
            if (data.comment !== undefined) existingRating.comment = data.comment;
            if (data.appointmentId) existingRating.appointmentId = new Types.ObjectId(data.appointmentId);
            existingRating.updatedAt = new Date();
            
            await existingRating.save();
            console.log('Existing rating updated successfully');
            
            // Update professional stats
            await updateProfessionalStats(data.professionalId);
            
            return existingRating;
        }

        console.log('No existing rating found, creating new one...');
        // Create new rating
        const rating = new Rating({
            userId: userObjId,
            professionalId: profObjId,
            rating: data.rating,
            comment: data.comment || '',
            appointmentId: data.appointmentId ? new Types.ObjectId(data.appointmentId) : undefined
        });
        
        console.log('Saving new rating...');
        await rating.save();
        console.log('New rating saved successfully');

        // Update professional stats
        await updateProfessionalStats(data.professionalId);
        
        return rating;
    } catch (retryError: any) {
        console.error('Retry failed with error:', retryError);
        
        if (retryError.code === 11000) {
            // Try to find what's causing the duplicate
            const userObjId = new Types.ObjectId(data.userId);
            const profObjId = new Types.ObjectId(data.professionalId);
            
            const conflictingRating = await Rating.findOne({
                $or: [
                    { userId: userObjId, professionalId: profObjId },
                    { 
                        $and: [
                            { userId: { $ne: userObjId } },
                            { professionalId: { $ne: profObjId } }
                        ]
                    }
                ]
            });
            
            console.log('Conflicting rating found:', conflictingRating);
            
            if (conflictingRating) {
                // If we found a conflicting rating, update it instead
                conflictingRating.rating = data.rating;
                if (data.comment !== undefined) conflictingRating.comment = data.comment;
                conflictingRating.updatedAt = new Date();
                await conflictingRating.save();
                
                await updateProfessionalStats(data.professionalId);
                return conflictingRating;
            }
            
            throw new Error('You have already rated this professional. Please update your existing rating instead.');
        }
        
        // Log more details about the error
        console.error('Full error details:', {
            message: retryError.message,
            code: retryError.code,
            keyPattern: retryError.keyPattern,
            keyValue: retryError.keyValue,
            stack: retryError.stack
        });
        
        throw retryError;
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
        .populate('userId', 'name profile.avatar email')
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