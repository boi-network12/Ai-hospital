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
router.post('/professionals/:professionalId/tip', verifyToken, healthcareCtrl.tipProfessional);

export default router;
