// src/controllers/healthcareController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as healthcareService from '../services/healthcareService';
import * as ratingService from '../services/ratingService';
import * as tipService from '../services/tipService';

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

    try {
        const result = await ratingService.addRating({
            userId: req.user._id,
            professionalId,
            rating,
            comment,
            appointmentId
        });

        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
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