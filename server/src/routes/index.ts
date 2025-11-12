// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import HealthRoutes from './userRoutes';

const router = Router();

router.use('/v1/auth', authRoutes);
router.use('/v1/user', userRoutes);
router.use('/v1/health', HealthRoutes);

export default router;