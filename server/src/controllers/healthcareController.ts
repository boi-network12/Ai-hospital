// src/controllers/healthcareController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as healthcareService from '../services/healthcareService';
import * as ratingService from '../services/ratingService';
import * as tipService from '../services/tipService';
import Rating from '../models/RatingModel';
import { Types } from 'mongoose';
import User from '../models/UserModel';

interface UpdateRatingData {
    rating: number;
    comment?: string;
}

/* ---------- Get healthcare professionals ---------- */
export const getHealthcareProfessionals = async (req: Request, res: Response) => {
    const {
        role,
        city,
        state,
        country,
        specialization,
        minRating,
        maxDistance = 50, // Default 50km
        latitude,
        longitude,
        page = 1,
        limit = 20,
        sortBy = 'rating',
        availability
    } = req.query;

    try {
        const location = {
            city: city as string,
            state: state as string,
            country: country as string
        };

        const coordinates = latitude && longitude ? {
            latitude: Number(latitude),
            longitude: Number(longitude),
            maxDistance: Number(maxDistance)
        } : undefined;

        const professionals = await healthcareService.findHealthcareProfessionals({
            role: role as 'doctor' | 'nurse',
            location,
            specialization: specialization as string,
            minRating: minRating ? Number(minRating) : undefined,
            coordinates,
            availability: availability === 'true',
            page: Number(page),
            limit: Number(limit),
            sortBy: sortBy as string
        });

        res.json({
            ...professionals,
            message: getSearchLocationMessage(
                professionals.searchLocation,
                professionals.searchScope,
                location
            )
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Helper function to generate user-friendly search messages
const getSearchLocationMessage = (searchLocation: string, searchScope: string, location: any) => {
    const scopeMessages: { [key: string]: string } = {
        exact_location: `Showing professionals at your exact location`,
        local_area: `Showing professionals in your local area`,
        regional: `Showing professionals in your region`,
        city: `Showing professionals in ${location?.city || 'your city'}`,
        city_area: `Showing professionals in areas similar to ${location?.city || 'your area'}`,
        state: `Showing professionals throughout ${location?.state || 'your state'}`,
        country: `Showing professionals across ${location?.country || 'your country'}`,
        continental: `Showing professionals in your continent`,
        global: `Showing healthcare professionals worldwide`
    };

    return scopeMessages[searchScope] || 'Showing healthcare professionals';
};


/* ---------- Get professional profile ---------- */
export const getProfessionalProfile = async (req: Request, res: Response) => {
    const { professionalId } = req.params;

    try {
        const profile = await healthcareService.getProfessionalProfile(professionalId);
        res.json(profile);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
};

/* ---------- Rate professional ---------- */
export const rateProfessional = async (req: AuthRequest, res: Response) => {
    const { professionalId } = req.params;
    const { rating, comment, appointmentId } = req.body;

    console.log('Rating request received:', {
        userId: req.user._id,
        professionalId,
        rating,
        comment,
        appointmentId
    });

    try {
        // First check if user already rated
        const existingRating = await Rating.findOne({
            userId: new Types.ObjectId(req.user._id),
            professionalId: new Types.ObjectId(professionalId)
        });

        let result;
        
        if (existingRating) {
            // Update existing rating
            existingRating.rating = rating;
            if (comment !== undefined) existingRating.comment = comment;
            if (appointmentId) existingRating.appointmentId = new Types.ObjectId(appointmentId);
            existingRating.updatedAt = new Date();
            
            await existingRating.save();
            result = existingRating;
            
            // Update professional stats
            await updateProfessionalStats(professionalId);
            
            return res.json({
                ...result.toObject(),
                id: result._id.toString(),
                message: 'Rating updated successfully'
            }); 
        } else {
            // Create new rating
            result = await ratingService.addRating({
                userId: req.user._id,
                professionalId,
                rating,
                comment,
                appointmentId
            });
            
            return res.status(201).json({
                ...result.toObject(),
                id: result._id.toString(),
                message: 'Rating submitted successfully'
            });
        }
    } catch (error: any) {
        console.error('Rate professional error:', error);
        res.status(400).json({ 
            message: error.message || 'Failed to submit rating' 
        });
    }
};

const updateProfessionalStats = async (professionalId: string) => {
    try {
        const stats = await Rating.aggregate([
            { $match: { professionalId: new Types.ObjectId(professionalId) } },
            {
                $group: {
                    _id: '$professionalId',
                    averageRating: { $avg: '$rating' },
                    totalRatings: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            const updateData: any = {
                $set: {
                    // Use the correct path from your User schema
                    'healthcareProfile.averageRating': Math.round(stats[0].averageRating * 10) / 10,
                    'healthcareProfile.totalRatings': stats[0].totalRatings
                }
            };

            await User.findByIdAndUpdate(professionalId, updateData);
        }
    } catch (error) {
        console.error('Error updating professional stats:', error);
        throw error;
    }
};

/* ---------- Tip professional ---------- */
export const tipProfessional = async (req: AuthRequest, res: Response) => {
    const { professionalId } = req.params;
    const { amount, message, appointmentId } = req.body;

    try {
        const result = await tipService.sendTip({
            fromUserId: req.user._id,
            toProfessionalId: professionalId,
            amount,
            message,
            appointmentId
        });

        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

/* ---------- Get professional ratings ---------- */
export const getProfessionalRatings = async (req: Request, res: Response) => {
    const { professionalId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const ratings = await ratingService.getProfessionalRatings(
            professionalId,
            Number(page),
            Number(limit)
        );

        res.json(ratings);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getUserProfessionalRating = async (req: AuthRequest, res: Response) => {
    const { professionalId } = req.params;
    
    try {
        const userRating = await ratingService.getUserRatingForProfessional(
            req.user._id.toString(),
            professionalId
        );
        
        res.json({
            hasRated: !!userRating,
            id: userRating?._id?.toString() || null,
            rating: userRating?.rating || 0,
            comment: userRating?.comment || '',
            createdAt: userRating?.createdAt || null,
            updatedAt: userRating?.updatedAt || null
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

/** ------------------ update the rating --------------- */
export const updateProfessionalRating = async (req: AuthRequest, res: Response) => {
    try {
        const { professionalId } = req.params;
        const { rating, comment } = req.body;
        
        // First check if user already rated
        const existingRating = await Rating.findOne({
            userId: new Types.ObjectId(req.user._id),
            professionalId: new Types.ObjectId(professionalId)
        });

        if (!existingRating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        // Update existing rating
        existingRating.rating = rating;
        if (comment !== undefined) existingRating.comment = comment;
        existingRating.updatedAt = new Date();
        
        await existingRating.save();
        
        // Update professional stats
        await updateProfessionalStats(professionalId);
        
        return res.json({
            ...existingRating.toObject(),
            id: existingRating._id.toString(),
            message: 'Rating updated successfully'
        });
    } catch (error: any) {
        console.error('Update rating error:', error);
        res.status(400).json({ 
            message: error.message || 'Failed to update rating' 
        });
    }
};