// src/utils/ratingCleanup.ts
import Rating from '../models/RatingModel';
import mongoose, { Types } from 'mongoose';

export const cleanupInvalidRatings = async () => {
    try {
        console.log('Starting rating cleanup...');
        
        // Delete ratings with null values
        const nullResult = await Rating.deleteMany({
            $or: [
                { userId: null },
                { professionalId: null },
                { userId: { $exists: false } },
                { professionalId: { $exists: false } }
            ]
        });
        
        console.log(`Deleted ${nullResult.deletedCount} ratings with null values`);
        
        // Find and fix ratings with string IDs
        const stringRatings = await Rating.find({
            $or: [
                { userId: { $type: 'string' } },
                { professionalId: { $type: 'string' } }
            ]
        });
        
        let fixedCount = 0;
        let deletedCount = 0;
        
        for (const rating of stringRatings) {
            try {
                // Try to convert to ObjectId
                if (typeof rating.userId === 'string' && Types.ObjectId.isValid(rating.userId)) {
                    rating.userId = new Types.ObjectId(rating.userId);
                }
                
                if (typeof rating.professionalId === 'string' && Types.ObjectId.isValid(rating.professionalId)) {
                    rating.professionalId = new Types.ObjectId(rating.professionalId);
                }
                
                // If conversion was successful, save it
                if (Types.ObjectId.isValid(rating.userId) && Types.ObjectId.isValid(rating.professionalId)) {
                    await rating.save();
                    fixedCount++;
                } else {
                    // If invalid, delete it
                    await rating.deleteOne();
                    deletedCount++;
                }
            } catch (error) {
                console.error('Error fixing rating:', rating._id, error);
                await rating.deleteOne();
                deletedCount++;
            }
        }
        
        console.log(`Fixed ${fixedCount} ratings with string IDs`);
        console.log(`Deleted ${deletedCount} invalid ratings`);
        
        // Recreate indexes
        await Rating.collection.dropIndexes();
        await Rating.syncIndexes();
        
        console.log('Rating cleanup completed');
        return {
            nullDeleted: nullResult.deletedCount,
            fixed: fixedCount,
            deleted: deletedCount
        };
    } catch (error) {
        console.error('Error during rating cleanup:', error);
        throw error;
    }
};