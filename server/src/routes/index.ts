// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import HealthRoutes from './health';
import systemRoutes from './systemRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/v1/auth', authRoutes);
router.use('/v1/user', userRoutes);
router.use('/v1/health', HealthRoutes);
router.use('/v1/system', systemRoutes);
router.use('/v1/admin', adminRoutes);

export default router;