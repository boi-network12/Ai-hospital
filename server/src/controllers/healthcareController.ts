// src/controllers/healthcareController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as healthcareService from '../services/healthcareService';
import * as ratingService from '../services/ratingService';
import * as tipService from '../services/tipService';
import * as notificationService from '../services/notificationService';
import * as  appointmentService from '../services/appointmentService';
import Rating from '../models/RatingModel';
import { notifyBothParties } from "../services/emailService";
import { Types } from 'mongoose';
import User from '../models/UserModel';
import Appointment from "../models/AppointmentModel";
import { sendBookingRequestEmail } from '../utils/emailBookingRequest';

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
        // VALIDATE INPUTS
        if (!professionalId) {
            return res.status(400).json({ message: 'Professional ID is required' });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check if user has already rated this professional
        const existingUserRating = await Rating.findOne({
            userId: new Types.ObjectId(req.user._id),
            professionalId: new Types.ObjectId(professionalId)
        });

        if (existingUserRating) {
            // Update existing rating
            existingUserRating.rating = rating;
            if (comment !== undefined) existingUserRating.comment = comment;
            if (appointmentId) existingUserRating.appointmentId = new Types.ObjectId(appointmentId);
            existingUserRating.updatedAt = new Date();
            
            await existingUserRating.save();
            
            // Update professional stats
            await updateProfessionalStats(professionalId);
            
            return res.json({
                ...existingUserRating.toObject(),
                id: existingUserRating._id.toString(),
                message: 'Rating updated successfully'
            });
        }

        // Check if professional exists first
        const professional = await User.findById(professionalId);
        if (!professional || professional.role === 'user') {
            return res.status(404).json({ message: 'Professional not found' });
        }

        // Use rating service to create new rating
        const result = await ratingService.addRating({
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
    } catch (error: any) {
        console.error('Rate professional error:', error);
        
        if (error.message.includes('already rated')) {
            return res.status(409).json({ 
                message: 'You have already rated this professional. Please update your existing rating instead.' 
            });
        }
        
        res.status(400).json({ 
            message: error.message || 'Failed to submit rating' 
        });
    }
};

/* ---------- Helper: Update professional stats (reused) ---------- */
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
                    'healthcareProfile.averageRating': Math.round(stats[0].averageRating * 10) / 10,
                    'healthcareProfile.totalRatings': stats[0].totalRatings
                }
            };
            await User.findByIdAndUpdate(professionalId, updateData);
        } else {
            // No ratings left, reset to defaults
            const updateData: any = {
                $set: {
                    'healthcareProfile.averageRating': 0,
                    'healthcareProfile.totalRatings': 0
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

/* ---------- Delete rating ---------- */
export const deleteRating = async (req: AuthRequest, res: Response) => {
    try {
        const { ratingId } = req.params;
        const userId = req.user._id;

        // Find rating
        const rating = await Rating.findOne({
            _id: ratingId,
            userId: new Types.ObjectId(userId)
        });

        if (!rating) {
            return res.status(404).json({ 
                message: 'Rating not found or unauthorized' 
            });
        }

        const professionalId = rating.professionalId;
        
        // Delete the rating
        await Rating.deleteOne({ _id: ratingId });

        // Update professional stats
        await updateProfessionalStats(professionalId.toString());

        res.json({
            message: 'Rating deleted successfully',
            ratingId
        });
    } catch (error: any) {
        console.error('Delete rating error:', error);
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

/* ---------- Helper: Clean up expired appointments ---------- */
const cleanupExpiredAppointments = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await Appointment.deleteMany({
      date: { $lt: thirtyDaysAgo },
      status: { $in: ['pending', 'rejected'] } // Only cleanup stale requests
    });

    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} stale pending/rejected appointments`);
    }
  } catch (error) {
    console.error('Cleanup appointments error:', error);
  }
};

/** ------------------ book appointments ---------------- */
export const bookAppointment = async (req: AuthRequest, res: Response) => {
    const { professionalId } = req.params;
    const { date, duration = 60, notes, type = 'physical' } = req.body;

    if (type !== 'physical') {
        return res.status(400).json({ message: 'Only physical appointments are supported at this time.' });
    }

    const appointmentDate = new Date(date);
    const endDate = new Date(appointmentDate.getTime() + duration * 60000); // Add duration to calculate endDate

    const day = appointmentDate.getDay();
    const hours = appointmentDate.getHours();
    const minutes = appointmentDate.getMinutes();

    // Validate: Mon–Fri, 8:00–16:30
    if (day < 1 || day > 5) {
        return res.status(400).json({ message: 'Physical sessions only available Monday to Friday' });
    }
    const timeInMinutes = hours * 60 + minutes;
    if (timeInMinutes < 480 || timeInMinutes >= 990) {
        return res.status(400).json({ message: 'Physical sessions available 8:00 AM – 4:30 PM only' });
    }

    // Check for conflicting appointments
    const conflicting = await Appointment.findOne({
        professionalId,
        date: { $gte: appointmentDate, $lt: new Date(appointmentDate.getTime() + duration * 60000) },
        status: { $in: ['pending', 'confirmed'] }
    });

    if (conflicting) {
        return res.status(409).json({ message: 'This time slot is already booked or pending' });
    }

    // Create appointment with endDate
    let appointment = await Appointment.create({
        patientId: req.user._id,
        professionalId,
        type,
        date: appointmentDate,
        endDate: endDate, // Add this line
        duration,
        notes,
    });

    // Populate with proper typing
    appointment = await appointment.populate([
        { path: 'patientId', select: 'name profile.avatar phoneNumber' },
        { path: 'professionalId', select: 'name email' }
    ]);

    // Send notification + email
    try {
        await notificationService.sendNotification({
            userId: new Types.ObjectId(professionalId),
            type: 'booking_request',
            title: 'New Physical Booking Request',
            message: `${(appointment.patientId as any).name} wants to book a physical session on ${appointmentDate.toLocaleString()}`,
            priority: 'high',
            actionUrl: '/appointments',
            data: { appointmentId: appointment._id }
        });

        await sendBookingRequestEmail(
            (appointment.professionalId as any).email,
            (appointment.patientId as any).name,
            appointmentDate,
            duration
        );
    } catch (err) {
        console.error('Failed to notify professional:', err);
    }

    res.status(201).json({
        appointment: {
            ...appointment.toObject(),
            id: appointment._id.toString()
        },
        message: 'Booking request sent! Awaiting confirmation.'
    });
};

/* ---------- Get healthcare professional's appointments ---------- */
export const getMyAppointments = async (req: AuthRequest, res: Response) => {
    try {
        const { status, type, startDate, endDate, page = 1, limit = 20 } = req.query;
        const professionalId = req.user._id;

        const query: any = { professionalId: new Types.ObjectId(professionalId) };

        // Filter by status if provided
        if (status) {
            query.status = status;
        }

        // Filter by type if provided
        if (type) {
            query.type = type;
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate as string);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate as string);
            }
        }

        const skip = (Number(page) - 1) * Number(limit);

        // Get appointments
        const appointments = await Appointment.find(query)
            .populate('patientId', 'name profile.avatar phoneNumber email')
            .sort({ date: 1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        // Get total count for pagination
        const total = await Appointment.countDocuments(query);

        // Clean up expired appointments (optional - can be moved to cron job)
        await cleanupExpiredAppointments();

        res.json({
            appointments,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        });
    } catch (error: any) {
        console.error('Get appointments error:', error);
        res.status(500).json({ message: error.message });
    }
};

/* ---------- Patient: Get my bookings ---------- */
export const getMyBookings = async (req: AuthRequest, res: Response) => {
    try {
        const { status, type, upcoming = 'true', page = 1, limit = 20 } = req.query;
        const patientId = req.user._id;

        const query: any = { patientId: new Types.ObjectId(patientId) };

        // Filter by status if provided
        if (status) {
            query.status = status;
        } else if (upcoming === 'true') {
            // Default: show upcoming appointments
            query.date = { $gte: new Date() };
            query.status = { $in: ['pending', 'confirmed'] };
        }

        // Filter by type if provided
        if (type) {
            query.type = type;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const appointments = await Appointment.find(query)
            .populate('professionalId', 'name profile.avatar profile.specialization healthcareProfile')
            .sort({ date: 1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        
        // Map _id to id for frontend consistency
        const formattedAppointments = appointments.map(apt => ({
            ...apt,
            id: apt._id.toString(),  // ← Add this
            // optionally delete _id if you don't want both
            // delete apt._id;
        }));
        
        const total = await Appointment.countDocuments(query);

        res.json({
            appointments: formattedAppointments,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        });
    } catch (error: any) {
        console.error('Get bookings error:', error);
        res.status(500).json({ message: error.message });
    }
};

/* ---------- Patient: Update booking ---------- */
export const updateBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId } = req.params;
        const { date, duration, notes, type } = req.body;
        const patientId = req.user._id;

        // Find appointment
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            patientId: new Types.ObjectId(patientId)
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found or unauthorized' });
        }

        // Only allow updates for pending appointments
        if (appointment.status !== 'pending') {
            return res.status(400).json({ 
                message: `Cannot update appointment with status: ${appointment.status}` 
            });
        }

        // Validate new date if provided
        if (date) {
            const newDate = new Date(date);
            const day = newDate.getDay();
            const hours = newDate.getHours();
            const minutes = newDate.getMinutes();
            const timeInMinutes = hours * 60 + minutes;

            // Validate: Mon–Fri, 8:00–16:30
            if (day < 1 || day > 5) {
                return res.status(400).json({ 
                    message: 'Physical sessions only available Monday to Friday' 
                });
            }
            if (timeInMinutes < 480 || timeInMinutes >= 990) {
                return res.status(400).json({ 
                    message: 'Physical sessions available 8:00 AM – 4:30 PM only' 
                });
            }

            appointment.date = newDate;
        }

        // Update other fields
        if (duration !== undefined) {
            appointment.duration = duration;
            // Update endDate when duration changes
            const endDate = new Date(appointment.date.getTime() + appointment.duration * 60000);
            appointment.endDate = endDate;
        }

        if (notes !== undefined) appointment.notes = notes;
        if (type !== undefined) appointment.type = type;

        appointment.updatedAt = new Date();

        await appointment.save();

        // Notify professional about update
        try {
            await notificationService.sendNotification({
                userId: appointment.professionalId,
                type: 'booking_updated',
                title: 'Booking Updated',
                message: `Patient has updated their booking for ${appointment.date.toLocaleString()}`,
                priority: 'medium',
                actionUrl: '/appointments',
                data: { appointmentId: appointment._id }
            });
        } catch (err) {
            console.error('Failed to send notification:', err);
        }

        res.json({
            appointment: {
                ...appointment.toObject(),
                id: appointment._id.toString()
            },
            message: 'Booking updated successfully'
        });
    } catch (error: any) {
        console.error('Update booking error:', error);
        res.status(400).json({ message: error.message });
    }
};

/* ---------- Patient: Delete/cancel booking ---------- */
export const cancelBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId } = req.params;
        const patientId = req.user._id;

        // Find appointment
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            patientId: new Types.ObjectId(patientId)
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found or unauthorized' });
        }

        // Only allow cancellation for pending or confirmed appointments
        if (!['pending', 'confirmed'].includes(appointment.status)) {
            return res.status(400).json({ 
                message: `Cannot cancel appointment with status: ${appointment.status}` 
            });
        }

        const oldStatus = appointment.status;
        appointment.status = 'cancelled';
        appointment.updatedAt = new Date();

        await appointment.save();

        // Notify professional about cancellation
        try {
            await notificationService.sendNotification({
                userId: appointment.professionalId,
                type: 'booking_cancelled',
                title: 'Booking Cancelled',
                message: `Patient has cancelled their booking for ${appointment.date.toLocaleString()}`,
                priority: 'medium',
                actionUrl: '/appointments',
                data: { 
                    appointmentId: appointment._id,
                    oldStatus,
                    cancelledAt: new Date()
                }
            });
        } catch (err) {
            console.error('Failed to send notification:', err);
        }

        res.json({
            message: 'Booking cancelled successfully',
            appointmentId: appointment._id.toString()
        });
    } catch (error: any) {
        console.error('Cancel booking error:', error);
        res.status(400).json({ message: error.message });
    }
};

/* ---------- Professional: Update appointment status ---------- */
export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;
        const professionalId = req.user._id;

        // Validate status
        const validStatuses = ['confirmed', 'rejected', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }

        // Find appointment
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            professionalId: new Types.ObjectId(professionalId)
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found or unauthorized' });
        }

        
        const oldStatus = appointment.status;
        appointment.status = status;
        appointment.updatedAt = new Date();

        await appointment.save();

        if (status === 'completed' && oldStatus !== 'completed') {
        // Only increment when it actually becomes completed (avoid double-counting)
            try {
                await healthcareService.incrementProfessionalCompletedCount(appointment.professionalId.toString());
            } catch (err) {
                console.error('Failed to increment completed consultations count:', err);
                // Don't fail the whole request
            }
        }

        const patient = await User.findById(appointment.patientId)
             .select('email name')
             .lean();

        const professional = await User.findById(appointment.professionalId)
            .select('email name')
            .lean();

        await notifyBothParties({
            appointmentId: appointment._id.toString(),
            date: appointment.date,
            duration: appointment.duration,
            type: appointment.type,
            notes: appointment.notes,
            patientName: patient?.name || 'Patient',
            patientEmail: patient?.email,
            professionalName: professional?.name || 'Professional',
            professionalEmail: professional?.email,
            status,
            oldStatus,
            actionUrl: `${process.env.APP_URL}/${
            req.user._id.toString() === appointment.patientId.toString() 
                ? 'bookings' 
                : 'appointments'
            }/${appointment._id.toString()}`
        });

        // Notify patient about status change
        try {
            let notificationMessage = '';
            switch (status) {
                case 'confirmed':
                    notificationMessage = `Your appointment has been confirmed for ${appointment.date.toLocaleString()}`;
                    break;
                case 'rejected':
                    notificationMessage = `Your appointment request has been rejected`;
                    break;
                case 'completed':
                    notificationMessage = `Your appointment has been marked as completed`;
                    break;
                case 'cancelled':
                    notificationMessage = `Your appointment has been cancelled by the professional`;
                    break;
            }

            await notificationService.sendNotification({
                userId: appointment.patientId,
                type: 'booking_status_changed',
                title: 'Appointment Status Updated',
                message: notificationMessage,
                priority: 'medium',
                actionUrl: '/bookings',
                data: { 
                    appointmentId: appointment._id,
                    oldStatus,
                    newStatus: status,
                    updatedAt: new Date()
                }
            });
        } catch (err) {
            console.error('Failed to send notification:', err);
        }

        res.json({
            appointment: {
                ...appointment.toObject(),
                id: appointment._id.toString()
            },
            message: `Appointment ${status} successfully`
        });
    } catch (error: any) {
        console.error('Update appointment status error:', error);
        res.status(400).json({ message: error.message });
    }
};

/* ---------- Professional: Get appointment by ID ---------- */
export const getAppointmentById = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId } = req.params;
        const professionalId = req.user._id;

        const appointment = await Appointment.findOne({
            _id: appointmentId,
            professionalId: new Types.ObjectId(professionalId)
        })
        .populate('patientId', 'name profile.avatar phoneNumber email profile.dateOfBirth profile.gender')
        .lean();

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found or unauthorized' });
        }

        res.json(appointment);
    } catch (error: any) {
        console.error('Get appointment error:', error);
        res.status(500).json({ message: error.message });
    }
};

/* ---------- Patient: Get booking by ID ---------- */
export const getBookingById = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId } = req.params;
        const patientId = req.user._id;

        const appointment = await Appointment.findOne({
            _id: appointmentId,
            patientId: new Types.ObjectId(patientId)
        })
        .populate('professionalId', 'name profile.avatar profile.specialization healthcareProfile profile.department')
        .lean();

        if (!appointment) {
            return res.status(404).json({ message: 'Booking not found or unauthorized' });
        }

        res.json(appointment);
    } catch (error: any) {
        console.error('Get booking error:', error);
        res.status(500).json({ message: error.message });
    }
};

/* ---------- Get recent past appointment ---------- */
export const getRecentPastAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role === 'user' ? 'patient' : 'professional';

    const appointment = await appointmentService.getRecentPastAppointment(
      userId.toString(),
      userRole
    );

    res.json({
      appointment,
      message: appointment 
        ? 'Recent past appointment found' 
        : 'No past appointments found'
    });
  } catch (error: any) {
    console.error('Get recent past appointment error:', error);
    res.status(500).json({ message: error.message });
  }
};

/* ---------- Get all past appointments ---------- */
export const getPastAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role === 'user' ? 'patient' : 'professional';
    const {
      page = 1,
      limit = 20,
      type,
      professionalId,
      patientId,
      startDate,
      endDate
    } = req.query;

    const result = await appointmentService.getPastAppointments({
      userId: userId.toString(),
      userRole,
      page: Number(page),
      limit: Number(limit),
      type: type as string,
      professionalId: professionalId as string,
      patientId: patientId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json(result);
  } catch (error: any) {
    console.error('Get past appointments error:', error);
    res.status(500).json({ message: error.message });
  }
};