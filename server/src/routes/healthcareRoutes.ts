// src/routes/healthcareRoutes.ts
import { Router } from 'express';
import * as healthcareCtrl from '../controllers/healthcareController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Public routes
router.get('/professionals', healthcareCtrl.getHealthcareProfessionals);
router.get('/professionals/:professionalId', healthcareCtrl.getProfessionalProfile);
router.get('/professionals/:professionalId/ratings', healthcareCtrl.getProfessionalRatings);

// Protected routes
router.post('/professionals/:professionalId/rate', verifyToken, healthcareCtrl.rateProfessional);
router.put('/professionals/:professionalId/rate', verifyToken, healthcareCtrl.updateProfessionalRating); 
router.post('/professionals/:professionalId/tip', verifyToken, healthcareCtrl.tipProfessional);
router.get('/professionals/:professionalId/user-rating', verifyToken, healthcareCtrl.getUserProfessionalRating);

// Rating management
router.delete('/ratings/:ratingId', verifyToken, healthcareCtrl.deleteRating);

// Professional appointment management
router.get('/professionals/appointments/my', verifyToken, healthcareCtrl.getMyAppointments);
router.get('/professionals/appointments/:appointmentId', verifyToken, healthcareCtrl.getAppointmentById);
router.put('/professionals/appointments/:appointmentId/status', verifyToken, healthcareCtrl.updateAppointmentStatus);

// Patient booking management
router.post('/professionals/:professionalId/book', verifyToken, healthcareCtrl.bookAppointment);
router.get('/bookings/my', verifyToken, healthcareCtrl.getMyBookings);
router.get('/bookings/:appointmentId', verifyToken, healthcareCtrl.getBookingById);
router.put('/bookings/:appointmentId', verifyToken, healthcareCtrl.updateBooking);
router.delete('/bookings/:appointmentId', verifyToken, healthcareCtrl.cancelBooking);

export default router;
 