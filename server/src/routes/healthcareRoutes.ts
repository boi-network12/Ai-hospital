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

export default router;
 