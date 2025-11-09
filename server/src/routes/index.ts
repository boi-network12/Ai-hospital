// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.use('/v1/auth', authRoutes);
router.use('/v1/user', userRoutes);

export default router;